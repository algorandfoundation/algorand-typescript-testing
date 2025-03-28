import type { Account as AccountType, arc4, BaseContract, bytes, Contract, LogicSig, uint64 } from '@algorandfoundation/algorand-typescript'
import type { ApplicationSpy } from './application-spy'
import { BytesMap } from './collections/custom-key-map'
import { DEFAULT_TEMPLATE_VAR_PREFIX } from './constants'
import { ContextManager } from './context-helpers/context-manager'
import type { DecodedLogs, LogDecoding } from './decode-logs'
import type { ApplicationCallInnerTxnContext } from './impl/inner-transactions'
import { methodSelector } from './impl/method-selector'
import type { StubBytesCompat } from './impl/primitives'
import { BytesCls } from './impl/primitives'
import { Account, AccountCls } from './impl/reference'
import { ContractContext } from './subcontexts/contract-context'
import { LedgerContext } from './subcontexts/ledger-context'
import { TransactionContext } from './subcontexts/transaction-context'
import type { ConstructorFor, DeliberateAny, FunctionKeys, InstanceMethod, Overloads } from './typescript-helpers'
import { asBytes, getRandomBytes } from './util'
import { ValueGenerator } from './value-generators'

/**
 * The `TestExecutionContext` class provides a context for executing tests in an Algorand environment.
 * It manages various contexts such as contract, ledger, and transaction contexts, and provides utilities
 * for generating values, managing accounts, and handling logic signatures.
 *
 * @class
 */
export class TestExecutionContext {
  #contractContext: ContractContext
  #ledgerContext: LedgerContext
  #txnContext: TransactionContext
  #valueGenerator: ValueGenerator
  #defaultSender: AccountType
  #activeLogicSigArgs: bytes[]
  #templateVars: Record<string, DeliberateAny> = {}
  #compiledApps: Array<{ key: ConstructorFor<BaseContract>; value: uint64 }> = []
  #compiledLogicSigs: Array<{ key: ConstructorFor<LogicSig>; value: AccountType }> = []
  #abiCallHooks: BytesMap<((innerTxnContext: ApplicationCallInnerTxnContext) => void)[]> = new BytesMap()

  /**
   * Creates an instance of `TestExecutionContext`.
   *
   * @param {bytes} [defaultSenderAddress] - The default sender address.
   */
  constructor(defaultSenderAddress?: bytes) {
    ContextManager.instance = this
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#valueGenerator = new ValueGenerator()
    this.#defaultSender = this.any.account({ address: defaultSenderAddress ?? getRandomBytes(32).asAlgoTs() })
    this.#activeLogicSigArgs = []
  }

  /**
   * Exports logs for a given application ID and decoding.
   *
   * @template T
   * @param {uint64} appId - The application ID.
   * @param {...T} decoding - The log decoding.
   * @returns {DecodedLogs<T>}
   */
  exportLogs<const T extends [...LogDecoding[]]>(appId: uint64, ...decoding: T): DecodedLogs<T> {
    return this.txn.exportLogs(appId, ...decoding)
  }

  /**
   * Returns the contract context.
   *
   * @type {ContractContext}
   */
  get contract() {
    return this.#contractContext
  }

  /**
   * Returns the ledger context.
   *
   * @type {LedgerContext}
   */
  get ledger() {
    return this.#ledgerContext
  }

  /**
   * Returns the transaction context.
   *
   * @type {TransactionContext}
   */
  get txn() {
    return this.#txnContext
  }

  /**
   * Returns the value generator.
   *
   * @type {ValueGenerator}
   */
  get any() {
    return this.#valueGenerator
  }

  /**
   * Returns the default sender account.
   *
   * @type {Account}
   */
  get defaultSender(): AccountType {
    return this.#defaultSender
  }

  /**
   * Sets the default sender account.
   *
   * @param {bytes | AccountType} val - The default sender account.
   */
  set defaultSender(val: bytes | AccountType) {
    this.#defaultSender = val instanceof AccountCls ? val : Account(val as bytes)
  }

  /**
   * Returns the active logic signature arguments.
   *
   * @type {bytes[]}
   */
  get activeLogicSigArgs(): bytes[] {
    return this.#activeLogicSigArgs
  }

  /**
   * Returns the template variables.
   *
   * @type {Record<string, DeliberateAny>}
   */
  get templateVars(): Record<string, DeliberateAny> {
    return this.#templateVars
  }

  /**
   * Executes a logic signature with the given arguments.
   *
   * @param {LogicSig} logicSig - The logic signature to execute.
   * @param {...bytes[]} args - The arguments for the logic signature.
   * @returns {boolean | uint64}
   */
  executeLogicSig(logicSig: LogicSig, ...args: bytes[]): boolean | uint64 {
    this.#activeLogicSigArgs = args
    try {
      return logicSig.program()
    } finally {
      this.#activeLogicSigArgs = []
    }
  }

  /**
   * Sets a template variable.
   *
   * @param {string} name - The name of the template variable.
   * @param {DeliberateAny} value - The value of the template variable.
   * @param {string} [prefix] - The prefix for the template variable.
   */
  setTemplateVar(name: string, value: DeliberateAny, prefix?: string) {
    this.#templateVars[(prefix ?? DEFAULT_TEMPLATE_VAR_PREFIX) + name] = value
  }

  /**
   * Gets a compiled application by contract.
   *
   * @param {ConstructorFor<BaseContract>} contract - The contract class.
   * @returns {[ConstructorFor<BaseContract>, uint64] | undefined}
   */
  getCompiledAppEntry(contract: ConstructorFor<BaseContract>) {
    return this.#compiledApps.find(({ key: k }) => k === contract)
  }

  /**
   * Sets a compiled application.
   *
   * @param {ConstructorFor<BaseContract>} c - The contract class.
   * @param {uint64} appId - The application ID.
   */
  setCompiledApp(c: ConstructorFor<BaseContract>, appId: uint64) {
    const existing = this.getCompiledAppEntry(c)
    if (existing) {
      existing.value = appId
    } else {
      this.#compiledApps.push({ key: c, value: appId })
    }
  }

  /* @internal */
  getOnAbiCall<TContract extends Contract>(
    methodSignature: FunctionKeys<TContract> | InstanceMethod<TContract> | StubBytesCompat | 'bareCreate',
    contract?: TContract | ConstructorFor<TContract>,
  ) {
    const selector =
      methodSignature === 'bareCreate'
        ? asBytes(methodSignature)
        : methodSignature instanceof BytesCls
          ? asBytes(methodSignature)
          : methodSelector(methodSignature as Parameters<Overloads<typeof arc4.methodSelector>>[0], contract)

    return { key: selector, value: this.#abiCallHooks.get(selector) }
  }

  addApplicationSpy<TContract extends Contract>(spy: ApplicationSpy<TContract>) {
    spy.abiCallHooks.forEach((value, key) => {
      const existing = this.getOnAbiCall(key, spy.contract)
      if (existing.value) {
        existing.value.push(...value)
      } else {
        this.#abiCallHooks.set(key, value)
      }
    })
  }

  /**
   * Gets a compiled logic signature.
   *
   * @param {ConstructorFor<LogicSig>} logicsig - The logic signature class.
   * @returns {[ConstructorFor<LogicSig>, Account] | undefined}
   */
  getCompiledLogicSigEntry(logicsig: ConstructorFor<LogicSig>) {
    return this.#compiledLogicSigs.find(({ key: k }) => k === logicsig)
  }

  /**
   * Sets a compiled logic signature.
   *
   * @param {ConstructorFor<LogicSig>} c - The logic signature class.
   * @param {Account} account - The account associated with the logic signature.
   */
  setCompiledLogicSig(c: ConstructorFor<LogicSig>, account: AccountType) {
    const existing = this.getCompiledLogicSigEntry(c)
    if (existing) {
      existing.value = account
    } else {
      this.#compiledLogicSigs.push({ key: c, value: account })
    }
  }

  /**
   * Reinitializes the execution context, clearing all state variables and resetting internal components.
   * Invoked between test cases to ensure isolation.
   */
  reset() {
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#activeLogicSigArgs = []
    this.#templateVars = {}
    this.#compiledApps = []
    this.#compiledLogicSigs = []
    this.#abiCallHooks = new BytesMap()
    ContextManager.reset()
    ContextManager.instance = this
  }
}
