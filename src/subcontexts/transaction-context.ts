import type { bytes, Contract, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { OnCompleteAction, TransactionType } from '@algorandfoundation/algorand-typescript'
import { getContractAbiMetadata, type AbiMetadata } from '../abi-metadata'
import { TRANSACTION_GROUP_MAX_SIZE } from '../constants'
import { checkRoutingConditions } from '../context-helpers/context-util'
import { lazyContext } from '../context-helpers/internal-context'
import type { DecodedLogs, LogDecoding } from '../decode-logs'
import { decodeLogs } from '../decode-logs'
import { InternalError, invariant } from '../errors'
import type {
  ApplicationCallInnerTxn,
  AssetConfigInnerTxn,
  AssetFreezeInnerTxn,
  AssetTransferInnerTxn,
  KeyRegistrationInnerTxn,
  PaymentInnerTxn,
} from '../impl/inner-transactions'
import { ApplicationCallInnerTxnContext, createInnerTxn, ItxnParams } from '../impl/inner-transactions'
import type { InnerTxn, InnerTxnFields } from '../impl/itxn'
import type { StubBytesCompat } from '../impl/primitives'
import type {
  AllTransactionFields,
  ApplicationCallTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
  Transaction,
} from '../impl/transactions'
import type { DeliberateAny, FunctionKeys } from '../typescript-helpers'
import { asBigInt, asNumber, asUint64 } from '../util'
import { ContractContext } from './contract-context'

function ScopeGenerator(dispose: () => void) {
  function* internal() {
    try {
      yield
    } finally {
      dispose()
    }
  }
  const scope = internal()
  scope.next()
  return {
    done: () => {
      scope.return()
    },
  }
}

interface ExecutionScope {
  execute: <TReturn>(body: () => TReturn) => TReturn
}

/**
 * Represents a deferred application call.
 */
export class DeferredAppCall<TParams extends unknown[], TReturn> {
  /** @internal */
  constructor(
    /** @internal */
    private readonly appId: uint64,
    /** @internal */
    readonly txns: Transaction[],
    /** @internal */
    private readonly method: (...args: TParams) => TReturn,
    /** @internal */
    private readonly abiMetadata: AbiMetadata,
    /** @internal */
    private readonly args: TParams,
  ) {}

  /**
   * Submits the deferred application call.
   * @returns The result of the application call.
   */
  submit(): TReturn {
    checkRoutingConditions(this.appId, this.abiMetadata)
    return this.method(...this.args)
  }
}

/**
 * Manages transaction contexts and groups.
 */
export class TransactionContext {
  readonly groups: TransactionGroup[] = []
  #activeGroup: TransactionGroup | undefined

  /**
   * Creates a new execution scope for a group of transactions.
   * @param group The group of transactions or deferred application calls.
   * @param activeTransactionIndex The index of the active transaction.
   * @returns The execution scope.
   */
  createScope(
    group: Array<Transaction | DeferredAppCall<DeliberateAny[], DeliberateAny>>,
    activeTransactionIndex?: number,
  ): ExecutionScope {
    let activeIndex = activeTransactionIndex
    const transactions = group.map((t) => (t instanceof DeferredAppCall ? t.txns : [t])).flat()
    if (activeIndex === undefined) {
      const lastAppCall = group
        .filter((t) => t instanceof DeferredAppCall)
        .at(-1)
        ?.txns.at(-1)
      if (lastAppCall) {
        activeIndex = transactions.indexOf(lastAppCall)
      }
    }
    const transactionGroup = new TransactionGroup(transactions, activeIndex)

    this.#activeGroup = transactionGroup

    const scope = ScopeGenerator(() => {
      if (this.#activeGroup?.transactions?.length) {
        this.groups.push(this.#activeGroup)
      }
      this.#activeGroup = undefined
    })
    return {
      execute: <TReturn>(body: () => TReturn) => {
        const result = body()
        scope.done()
        return result
      },
    }
  }

  /**
   * Ensures that a scope is created for the given group of transactions.
   * @internal
   * @param group The group of transactions.
   * @param activeTransactionIndex The index of the active transaction.
   * @returns The execution scope.
   */
  ensureScope(group: Transaction[], activeTransactionIndex?: number): ExecutionScope {
    if (!this.#activeGroup || !this.#activeGroup.transactions.length) {
      return this.createScope(group, activeTransactionIndex)
    }
    return {
      execute: <TReturn>(body: () => TReturn) => {
        return body()
      },
    }
  }

  get hasActiveGroup(): boolean {
    return !!this.#activeGroup
  }

  /**
   * Gets the active transaction group.
   * @returns The active transaction group.
   * @throws If there is no active transaction group.
   */
  get activeGroup(): TransactionGroup {
    if (this.#activeGroup) {
      return this.#activeGroup
    }
    throw new InternalError('no active txn group')
  }

  /**
   * Gets the last transaction group.
   * @returns The last transaction group.
   * @throws If there are no transaction groups.
   */
  get lastGroup(): TransactionGroup {
    if (this.groups.length === 0) {
      throw new InternalError('No group transactions found!')
    }
    return this.groups.at(-1)!
  }

  /**
   * Gets the last active transaction.
   * @returns The last active transaction.
   */
  get lastActive(): Transaction {
    return this.lastGroup.activeTransaction
  }

  /**
   * Appends a log to the active transaction.
   * @internal
   * @param value The log value.
   * @throws If the active transaction is not an application call.
   */
  appendLog(value: StubBytesCompat): void {
    const activeTransaction = this.activeGroup.activeTransaction
    if (activeTransaction.type !== TransactionType.ApplicationCall) {
      throw new InternalError('Can only add logs to ApplicationCallTransaction!')
    }
    activeTransaction.appendLog(value)
  }

  /**
   * Defers an application call.
   * @param contract The contract.
   * @param method The method to call.
   * @param methodName The name of the method.
   * @param args The arguments for the method.
   * @returns The deferred application call.
   */
  deferAppCall<TContract extends Contract, TParams extends unknown[], TReturn>(
    contract: TContract,
    method: (...args: TParams) => TReturn,
    methodName: FunctionKeys<TContract>,
    ...args: TParams
  ): DeferredAppCall<TParams, TReturn> {
    const appId = lazyContext.ledger.getApplicationForContract(contract)
    const abiMetadata = getContractAbiMetadata(contract)[methodName as string]
    const txns = ContractContext.createMethodCallTxns(contract, abiMetadata, ...args)
    return new DeferredAppCall(appId.id, txns, method, abiMetadata, args)
  }

  /**
   * Exports logs for the given application ID.
   * @param appId The application ID.
   * @param decoding The log decoding.
   * @returns The decoded logs.
   */
  exportLogs<const T extends [...LogDecoding[]]>(appId: uint64, ...decoding: T): DecodedLogs<T> {
    const transaction = this.lastGroup.transactions
      .filter((t) => t.type === TransactionType.ApplicationCall)
      .find((t) => asBigInt(t.appId.id) === asBigInt(appId))
    let logs = []
    if (transaction) {
      logs = transaction.appLogs
    } else {
      logs = lazyContext.getApplicationData(appId).application.appLogs
    }

    return decodeLogs(logs, decoding)
  }
}

/**
 * Represents a group of transactions.
 */
export class TransactionGroup {
  latestTimestamp: number
  transactions: Transaction[]
  itxnGroups: ItxnGroup[] = []
  /** @internal */
  activeTransactionIndex: number
  /** @internal */
  constructingItxnGroup: InnerTxnFields[] = []

  /** @internal */
  constructor(transactions: Transaction[], activeTransactionIndex?: number) {
    this.latestTimestamp = Date.now()
    if (transactions.length > TRANSACTION_GROUP_MAX_SIZE) {
      throw new InternalError(`Transaction group can have at most ${TRANSACTION_GROUP_MAX_SIZE} transactions, as per AVM limits.`)
    }
    transactions.forEach((txn, index) => Object.assign(txn, { groupIndex: asUint64(index) }))
    this.activeTransactionIndex = activeTransactionIndex === undefined ? transactions.length - 1 : activeTransactionIndex
    this.transactions = transactions
  }

  /**
   * Gets the active transaction.
   * @returns The active transaction.
   */
  get activeTransaction() {
    return this.transactions[this.activeTransactionIndex]
  }

  /**
   * Gets the active application ID.
   * @returns The active application ID.
   * @throws If there are no transactions in the group or the active transaction is not an application call.
   */
  get activeApplicationId() {
    // this should return the true app_id and not 0 if the app is in the creation phase
    if (this.transactions.length === 0) {
      throw new InternalError('No transactions in the group')
    }
    invariant(this.activeTransaction.type === TransactionType.ApplicationCall, 'No app_id found in the active transaction')
    return (this.activeTransaction as ApplicationCallTransaction).backingAppId.id
  }

  /* @internal */
  get constructingItxn() {
    if (!this.constructingItxnGroup.length) {
      throw new InternalError('itxn field without itxn begin')
    }
    return this.constructingItxnGroup.at(-1)!
  }

  /**
   * Gets the scratch space of the active transaction.
   * @returns The scratch space.
   */
  getScratchSpace() {
    return this.activeTransaction.scratchSpace
  }

  /**
   * Gets the scratch slot of the active transaction.
   * @param index The index of the scratch slot.
   * @returns The scratch slot value.
   */
  getScratchSlot(index: Uint64Compat): bytes | uint64 {
    return this.activeTransaction.getScratchSlot(index)
  }

  /**
   * Patches the fields of the active transaction.
   * @param fields The fields to patch.
   */
  patchActiveTransactionFields(fields: AllTransactionFields) {
    const activeTransaction = this.activeTransaction as unknown as AllTransactionFields
    const filteredFields = Object.fromEntries(Object.entries(fields).filter(([_, value]) => value !== undefined))
    Object.assign(activeTransaction, filteredFields)
  }

  /**
   * Adds a group of inner transactions.
   * @internal
   * @param itxns The inner transactions.
   */
  addInnerTransactionGroup(...itxns: InnerTxn[]) {
    this.itxnGroups.push(new ItxnGroup(itxns))
  }

  /**
   * Begins a new inner transaction group.
   * @internal
   * @throws If there is already an inner transaction group being constructed or the active transaction is not an application call.
   */
  beginInnerTransactionGroup() {
    if (this.constructingItxnGroup.length) {
      throw new InternalError('itxn begin without itxn submit')
    }
    invariant(this.activeTransaction.type === TransactionType.ApplicationCall, 'No active application call transaction')
    if (this.activeTransaction.onCompletion === OnCompleteAction.ClearState) {
      throw new InternalError('Cannot begin inner transaction group in a clear state call')
    }
    this.constructingItxnGroup.push({} as InnerTxnFields)
  }

  /**
   * Appends a new inner transaction to the current group.
   * @internal
   * @throws If there is no inner transaction group being constructed.
   */
  appendInnerTransactionGroup() {
    if (!this.constructingItxnGroup.length) {
      throw new InternalError('itxn next without itxn begin')
    }
    this.constructingItxnGroup.push({ type: TransactionType.Payment } as InnerTxnFields)
  }

  /**
   * Submits the current inner transaction group.
   * @internal
   * @throws If there is no inner transaction group being constructed or the group exceeds the maximum size.
   */
  submitInnerTransactionGroup() {
    if (!this.constructingItxnGroup.length) {
      throw new InternalError('itxn submit without itxn begin')
    }
    if (this.constructingItxnGroup.length > TRANSACTION_GROUP_MAX_SIZE) {
      throw new InternalError(`Cannot submit more than ${TRANSACTION_GROUP_MAX_SIZE} inner transactions at once`)
    }
    const itxns = this.constructingItxnGroup.flatMap((t) =>
      t instanceof ApplicationCallInnerTxnContext
        ? [...(t.itxns ?? []), t]
        : t instanceof ItxnParams
          ? t.createInnerTxns()
          : [createInnerTxn(t)],
    )
    itxns.forEach((itxn, index) => Object.assign(itxn, { groupIndex: asUint64(index) }))
    for (const itxn of itxns) {
      if (itxn instanceof ApplicationCallInnerTxnContext) {
        lazyContext.value.notifyApplicationSpies(itxn)
      }
    }
    this.itxnGroups.push(new ItxnGroup(itxns))
    this.constructingItxnGroup = []
  }

  /**
   * Gets the last inner transaction group.
   * @returns The last inner transaction group.
   */
  lastItxnGroup() {
    return this.getItxnGroup()
  }

  /**
   * Gets an inner transaction group by index.
   * @param index The index of the group. If not provided, the last group is returned.
   * @returns The inner transaction group.
   * @throws If the index is invalid or there are no previous inner transactions.
   */
  getItxnGroup(index?: Uint64Compat): ItxnGroup {
    const i = index !== undefined ? asNumber(index) : undefined

    invariant(this.itxnGroups.length > 0, 'no previous inner transactions')
    if (i !== undefined && i >= this.itxnGroups.length) {
      throw new InternalError('Invalid group index')
    }
    const group = i !== undefined ? this.itxnGroups[i] : this.itxnGroups.at(-1)!
    invariant(group.itxns.length > 0, 'no previous inner transactions')

    return group
  }

  /**
   * Gets an application transaction by index.
   * @param index The index of the transaction.
   * @returns The application transaction.
   */
  getApplicationCallTransaction(index?: Uint64Compat): ApplicationCallTransaction {
    return this._getTransaction({ type: TransactionType.ApplicationCall, index }) as ApplicationCallTransaction
  }

  /**
   * Gets an asset configuration transaction by index.
   * @param index The index of the transaction.
   * @returns The asset configuration transaction.
   */
  getAssetConfigTransaction(index?: Uint64Compat): AssetConfigTransaction {
    return this._getTransaction({ type: TransactionType.AssetConfig, index }) as AssetConfigTransaction
  }

  /**
   * Gets an asset transfer transaction by index.
   * @param index The index of the transaction.
   * @returns The asset transfer transaction.
   */
  getAssetTransferTransaction(index?: Uint64Compat): AssetTransferTransaction {
    return this._getTransaction({ type: TransactionType.AssetTransfer, index }) as AssetTransferTransaction
  }

  /**
   * Gets an asset freeze transaction by index.
   * @param index The index of the transaction.
   * @returns The asset freeze transaction.
   */
  getAssetFreezeTransaction(index?: Uint64Compat): AssetFreezeTransaction {
    return this._getTransaction({ type: TransactionType.AssetFreeze, index }) as AssetFreezeTransaction
  }

  /**
   * Gets a key registration transaction by index.
   * @param index The index of the transaction.
   * @returns The key registration transaction.
   */
  getKeyRegistrationTransaction(index?: Uint64Compat): KeyRegistrationTransaction {
    return this._getTransaction({ type: TransactionType.KeyRegistration, index }) as KeyRegistrationTransaction
  }

  /**
   * Gets a payment transaction by index.
   * @param index The index of the transaction.
   * @returns The payment transaction.
   */
  getPaymentTransaction(index?: Uint64Compat): PaymentTransaction {
    return this._getTransaction({ type: TransactionType.Payment, index }) as PaymentTransaction
  }

  /**
   * Gets a transaction by index.
   * @param index The index of the transaction.
   * @returns The transaction.
   */
  getTransaction(index?: Uint64Compat): Transaction {
    return this._getTransaction({ index })
  }
  /** @internal */
  private _getTransaction({ type, index }: { type?: TransactionType; index?: Uint64Compat }) {
    const i = index !== undefined ? asNumber(index) : undefined
    if (i !== undefined && i >= lazyContext.activeGroup.transactions.length) {
      throw new InternalError('Invalid group index')
    }
    const transaction = i !== undefined ? lazyContext.activeGroup.transactions[i] : lazyContext.activeGroup.activeTransaction
    if (type === undefined) {
      return transaction
    }
    if (transaction.type !== type) {
      throw new InternalError(`Invalid transaction type: ${transaction.type}`)
    }
    switch (type) {
      case TransactionType.ApplicationCall:
        return transaction as ApplicationCallTransaction
      case TransactionType.Payment:
        return transaction as PaymentTransaction
      case TransactionType.AssetConfig:
        return transaction as AssetConfigTransaction
      case TransactionType.AssetTransfer:
        return transaction as AssetTransferTransaction
      case TransactionType.AssetFreeze:
        return transaction as AssetFreezeTransaction
      case TransactionType.KeyRegistration:
        return transaction as KeyRegistrationTransaction
      default:
        throw new InternalError(`Invalid transaction type: ${type}`)
    }
  }
}

/**
 * Represents a group of inner transactions.
 */
export class ItxnGroup {
  itxns: InnerTxn[] = []
  /** @internal */
  constructor(itxns: InnerTxn[]) {
    this.itxns = itxns
  }

  /**
   * Gets an application inner transaction by index.
   * @param index The index of the transaction.
   * @returns The application inner transaction.
   */
  getApplicationCallInnerTxn(index?: Uint64Compat): ApplicationCallInnerTxn {
    return this._getInnerTxn({ type: TransactionType.ApplicationCall, index }) as ApplicationCallInnerTxn
  }

  /**
   * Gets an asset configuration inner transaction by index.
   * @param index The index of the transaction.
   * @returns The asset configuration inner transaction.
   */
  getAssetConfigInnerTxn(index?: Uint64Compat): AssetConfigInnerTxn {
    return this._getInnerTxn({ type: TransactionType.AssetConfig, index }) as AssetConfigInnerTxn
  }

  /**
   * Gets an asset transfer inner transaction by index.
   * @param index The index of the transaction.
   * @returns The asset transfer inner transaction.
   */
  getAssetTransferInnerTxn(index?: Uint64Compat): AssetTransferInnerTxn {
    return this._getInnerTxn({ type: TransactionType.AssetTransfer, index }) as AssetTransferInnerTxn
  }

  /**
   * Gets an asset freeze inner transaction by index.
   * @param index The index of the transaction.
   * @returns The asset freeze inner transaction.
   */
  getAssetFreezeInnerTxn(index?: Uint64Compat): AssetFreezeInnerTxn {
    return this._getInnerTxn({ type: TransactionType.AssetFreeze, index }) as AssetFreezeInnerTxn
  }

  /**
   * Gets a key registration inner transaction by index.
   * @param index The index of the transaction.
   * @returns The key registration inner transaction.
   */
  getKeyRegistrationInnerTxn(index?: Uint64Compat): KeyRegistrationInnerTxn {
    return this._getInnerTxn({ type: TransactionType.KeyRegistration, index }) as KeyRegistrationInnerTxn
  }

  /**
   * Gets a payment inner transaction by index.
   * @param index The index of the transaction.
   * @returns The payment inner transaction.
   */
  getPaymentInnerTxn(index?: Uint64Compat): PaymentInnerTxn {
    return this._getInnerTxn({ type: TransactionType.Payment, index }) as PaymentInnerTxn
  }

  /**
   * Gets an inner transaction by index.
   * @param index The index of the transaction.
   * @returns The inner transaction.
   */
  getInnerTxn(index?: Uint64Compat): InnerTxn {
    return this._getInnerTxn({ index })
  }

  /** @internal */
  private _getInnerTxn({ type, index }: { type?: TransactionType; index?: Uint64Compat }) {
    invariant(this.itxns.length > 0, 'no previous inner transactions')
    const i = index !== undefined ? asNumber(index) : undefined
    if (i !== undefined && i >= this.itxns.length) {
      throw new InternalError('Invalid group index')
    }
    const transaction = i !== undefined ? this.itxns[i] : this.itxns.at(-1)!
    if (type === undefined) {
      return transaction
    }
    if (transaction.type !== type) {
      throw new InternalError(`Invalid transaction type: ${transaction.type}`)
    }
    switch (type) {
      case TransactionType.ApplicationCall:
        return transaction as ApplicationCallInnerTxn
      case TransactionType.Payment:
        return transaction as PaymentInnerTxn
      case TransactionType.AssetConfig:
        return transaction as AssetConfigInnerTxn
      case TransactionType.AssetTransfer:
        return transaction as AssetTransferInnerTxn
      case TransactionType.AssetFreeze:
        return transaction as AssetFreezeInnerTxn
      case TransactionType.KeyRegistration:
        return transaction as KeyRegistrationInnerTxn
      default:
        throw new InternalError(`Invalid transaction type: ${type}`)
    }
  }
}
