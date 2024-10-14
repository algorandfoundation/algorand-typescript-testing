import { bytes, internal, TransactionType, uint64 } from '@algorandfoundation/algo-ts'
import algosdk from 'algosdk'
import { lazyContext } from '../context-helpers/internal-context'
import { DecodedLogs, decodeLogs, LogDecoding } from '../decode-logs'
import { testInvariant } from '../errors'
import {
  AllTransactionFields,
  ApplicationTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
  Transaction,
} from '../impl/transactions'
import { asBigInt, asNumber, asUint64 } from '../util'
import { InnerTxn, InnerTxnFields } from '../impl/itxn'
import {
  ApplicationInnerTxn,
  AssetConfigInnerTxn,
  AssetFreezeInnerTxn,
  AssetTransferInnerTxn,
  createInnerTxn,
  KeyRegistrationInnerTxn,
  PaymentInnerTxn,
} from '../impl/inner-transactions'

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

export class TransactionContext {
  readonly groups: TransactionGroup[] = []
  #activeGroup: TransactionGroup | undefined

  createScope(group: Transaction[], activeTransactionIndex?: number): ExecutionScope {
    const transactionGroup = new TransactionGroup(group, activeTransactionIndex)
    const previousGroup = this.#activeGroup
    this.#activeGroup = transactionGroup

    const scope = ScopeGenerator(() => {
      if (this.#activeGroup?.transactions?.length) {
        this.groups.push(this.#activeGroup)
      }
      this.#activeGroup = previousGroup
    })
    return {
      execute: <TReturn>(body: () => TReturn) => {
        const result = body()
        scope.done()
        return result
      },
    }
  }

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

  get activeGroup(): TransactionGroup {
    if (this.#activeGroup) {
      return this.#activeGroup
    }
    throw internal.errors.internalError('no active txn group')
  }

  get lastGroup(): TransactionGroup {
    if (this.groups.length === 0) {
      internal.errors.internalError('No group transactions found!')
    }
    return this.groups.at(-1)!
  }

  get lastActive(): Transaction {
    return this.lastGroup.activeTransaction
  }

  /* internal */
  appendLog(value: internal.primitives.StubBytesCompat): void {
    const activeTransaction = this.activeGroup.activeTransaction
    if (activeTransaction.type !== TransactionType.ApplicationCall) {
      throw internal.errors.internalError('Can only add logs to ApplicationCallTransaction!')
    }
    activeTransaction.appendLog(value)
  }

  exportLogs<const T extends [...LogDecoding[]]>(appId: uint64, ...decoding: T): DecodedLogs<T> {
    const transaction = this.groups
      .flatMap((g) => g.transactions)
      .filter((t) => t.type === TransactionType.ApplicationCall)
      .find((t) => asBigInt(t.appId.id) === asBigInt(appId))
    let logs = []
    if (transaction) {
      logs = transaction.appLogs
    } else {
      logs = lazyContext.getApplicationData(appId).appLogs
    }
    const rawLogs = logs.map((l) => internal.primitives.toExternalValue(l))
    return decodeLogs(rawLogs, decoding)
  }
}

export class TransactionGroup {
  activeTransactionIndex: number
  latestTimestamp: number
  transactions: Transaction[]
  itxnGroups: ItxnGroup[] = []
  constructingItxnGroup: InnerTxnFields[] = []

  constructor(transactions: Transaction[], activeTransactionIndex?: number) {
    this.latestTimestamp = Date.now()
    if (transactions.length > algosdk.AtomicTransactionComposer.MAX_GROUP_SIZE) {
      internal.errors.internalError(
        `Transaction group can have at most ${algosdk.AtomicTransactionComposer.MAX_GROUP_SIZE} transactions, as per AVM limits.`,
      )
    }
    transactions.forEach((txn, index) => Object.assign(txn, { groupIndex: asUint64(index) }))
    this.activeTransactionIndex = activeTransactionIndex === undefined ? transactions.length - 1 : activeTransactionIndex
    this.transactions = transactions
  }

  get activeTransaction() {
    return this.transactions[this.activeTransactionIndex]
  }

  get activeApplicationId() {
    if (this.transactions.length === 0) {
      internal.errors.internalError('No transactions in the group')
    }
    testInvariant(this.activeTransaction.type === TransactionType.ApplicationCall, 'No app_id found in the active transaction')
    return this.activeTransaction.appId.id
  }

  get constructingItxn() {
    if (!this.constructingItxnGroup.length) {
      internal.errors.internalError('itxn field without itxn begin')
    }
    return this.constructingItxnGroup.at(-1)!
  }

  getScratchSpace() {
    return this.activeTransaction.scratchSpace
  }

  getScratchSlot(index: internal.primitives.StubUint64Compat): bytes | uint64 {
    return this.activeTransaction.getScratchSlot(index)
  }

  patchActiveTransactionFields(fields: AllTransactionFields) {
    const activeTransaction = this.activeTransaction as unknown as AllTransactionFields
    const filteredFields = Object.fromEntries(Object.entries(fields).filter(([_, value]) => value !== undefined))
    Object.assign(activeTransaction, filteredFields)
  }

  beginInnerTransactionGroup() {
    if (this.constructingItxnGroup.length) {
      internal.errors.internalError('itxn begin without itxn submit')
    }
    testInvariant(this.activeTransaction.type === TransactionType.ApplicationCall, 'No active application call transaction')
    if (this.activeTransaction.onCompletion === 'ClearState') {
      internal.errors.internalError('Cannot begin inner transaction group in a clear state call')
    }
    this.constructingItxnGroup.push({} as InnerTxnFields)
  }

  appendInnerTransactionGroup() {
    if (!this.constructingItxnGroup.length) {
      internal.errors.internalError('itxn next without itxn begin')
    }
    this.constructingItxnGroup.push({ type: TransactionType.Payment } as InnerTxnFields)
  }

  submitInnerTransactionGroup() {
    if (!this.constructingItxnGroup.length) {
      internal.errors.internalError('itxn submit without itxn begin')
    }
    if (this.constructingItxnGroup.length > algosdk.AtomicTransactionComposer.MAX_GROUP_SIZE) {
      internal.errors.internalError('Cannot submit more than 16 inner transactions at once')
    }
    const itxns = this.constructingItxnGroup.map((t) => createInnerTxn(t))
    itxns.forEach((itxn, index) => Object.assign(itxn, { groupIndex: asUint64(index) }))
    this.itxnGroups.push(new ItxnGroup(itxns))
    this.constructingItxnGroup = []
  }

  getItxnGroup(index?: internal.primitives.StubUint64Compat): ItxnGroup {
    const i = index !== undefined ? asNumber(index) : undefined

    testInvariant(this.itxnGroups.length > 0, 'no previous inner transactions')
    if (i !== undefined && i >= this.itxnGroups.length) {
      throw new internal.errors.InternalError('Invalid group index')
    }
    const group = i !== undefined ? this.itxnGroups[i] : this.itxnGroups.at(-1)!
    testInvariant(group.itxns.length > 0, 'no previous inner transactions')

    return group
  }
  getApplicationTransaction(index?: internal.primitives.StubUint64Compat): ApplicationTransaction {
    return this.getTransactionImpl({ type: TransactionType.ApplicationCall, index }) as ApplicationTransaction
  }
  getAssetConfigTransaction(index?: internal.primitives.StubUint64Compat): AssetConfigTransaction {
    return this.getTransactionImpl({ type: TransactionType.AssetConfig, index }) as AssetConfigTransaction
  }
  getAssetTransferTransaction(index?: internal.primitives.StubUint64Compat): AssetTransferTransaction {
    return this.getTransactionImpl({ type: TransactionType.AssetTransfer, index }) as AssetTransferTransaction
  }
  getAssetFreezeTransaction(index?: internal.primitives.StubUint64Compat): AssetFreezeTransaction {
    return this.getTransactionImpl({ type: TransactionType.AssetFreeze, index }) as AssetFreezeTransaction
  }
  getKeyRegistrationTransaction(index?: internal.primitives.StubUint64Compat): KeyRegistrationTransaction {
    return this.getTransactionImpl({ type: TransactionType.KeyRegistration, index }) as KeyRegistrationTransaction
  }
  getPaymentTransaction(index?: internal.primitives.StubUint64Compat): PaymentTransaction {
    return this.getTransactionImpl({ type: TransactionType.Payment, index }) as PaymentTransaction
  }
  getTransaction(index?: internal.primitives.StubUint64Compat): Transaction {
    return this.getTransactionImpl({ index })
  }
  private getTransactionImpl({ type, index }: { type?: TransactionType; index?: internal.primitives.StubUint64Compat }) {
    const i = index !== undefined ? asNumber(index) : undefined
    if (i !== undefined && i >= lazyContext.activeGroup.transactions.length) {
      throw new internal.errors.InternalError('Invalid group index')
    }
    const transaction = i !== undefined ? lazyContext.activeGroup.transactions[i] : lazyContext.activeGroup.activeTransaction
    if (type === undefined) {
      return transaction
    }
    if (transaction.type !== type) {
      throw new internal.errors.InternalError(`Invalid transaction type: ${transaction.type}`)
    }
    switch (type) {
      case TransactionType.ApplicationCall:
        return transaction as ApplicationTransaction
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
        throw new internal.errors.InternalError(`Invalid transaction type: ${type}`)
    }
  }
}

export class ItxnGroup {
  itxns: InnerTxn[] = []
  constructor(itxns: InnerTxn[]) {
    this.itxns = itxns
  }

  getApplicationInnerTxn(index?: internal.primitives.StubUint64Compat): ApplicationInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.ApplicationCall, index }) as ApplicationInnerTxn
  }
  getAssetConfigInnerTxn(index?: internal.primitives.StubUint64Compat): AssetConfigInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.AssetConfig, index }) as AssetConfigInnerTxn
  }
  getAssetTransferInnerTxn(index?: internal.primitives.StubUint64Compat): AssetTransferInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.AssetTransfer, index }) as AssetTransferInnerTxn
  }
  getAssetFreezeInnerTxn(index?: internal.primitives.StubUint64Compat): AssetFreezeInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.AssetFreeze, index }) as AssetFreezeInnerTxn
  }
  getKeyRegistrationInnerTxn(index?: internal.primitives.StubUint64Compat): KeyRegistrationInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.KeyRegistration, index }) as KeyRegistrationInnerTxn
  }
  getPaymentInnerTxn(index?: internal.primitives.StubUint64Compat): PaymentInnerTxn {
    return this.getInnerTxnImpl({ type: TransactionType.Payment, index }) as PaymentInnerTxn
  }
  getInnerTxn(index?: internal.primitives.StubUint64Compat): InnerTxn {
    return this.getInnerTxnImpl({ index })
  }

  private getInnerTxnImpl({ type, index }: { type?: TransactionType; index?: internal.primitives.StubUint64Compat }) {
    testInvariant(this.itxns.length > 0, 'no previous inner transactions')
    const i = index !== undefined ? asNumber(index) : undefined
    if (i !== undefined && i >= this.itxns.length) {
      throw new internal.errors.InternalError('Invalid group index')
    }
    const transaction = i !== undefined ? this.itxns[i] : this.itxns.at(-1)!
    if (type === undefined) {
      return transaction
    }
    if (transaction.type !== type) {
      throw new internal.errors.InternalError(`Invalid transaction type: ${transaction.type}`)
    }
    switch (type) {
      case TransactionType.ApplicationCall:
        return transaction as ApplicationInnerTxn
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
        throw new internal.errors.InternalError(`Invalid transaction type: ${type}`)
    }
  }
}
