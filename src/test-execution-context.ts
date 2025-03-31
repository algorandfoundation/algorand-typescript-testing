import type { Account as AccountType, BaseContract, bytes, LogicSig, uint64 } from '@algorandfoundation/algorand-typescript'
import { DEFAULT_TEMPLATE_VAR_PREFIX } from './constants'
import { ContextManager } from './context-helpers/context-manager'
import type { DecodedLogs, LogDecoding } from './decode-logs'
import { Account, AccountCls } from './impl/reference'
import { ContractContext } from './subcontexts/contract-context'
import { LedgerContext } from './subcontexts/ledger-context'
import { TransactionContext } from './subcontexts/transaction-context'
import type { ConstructorFor, DeliberateAny } from './typescript-helpers'
import { getRandomBytes } from './util'
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
  #template_vars: Record<string, DeliberateAny> = {}
  #compiledApps: Array<[ConstructorFor<BaseContract>, uint64]> = []
  #compiledLogicSigs: Array<[ConstructorFor<LogicSig>, AccountType]> = []

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
    return this.#template_vars
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
    this.#template_vars[(prefix ?? DEFAULT_TEMPLATE_VAR_PREFIX) + name] = value
  }

  /**
   * Gets a compiled application by contract.
   *
   * @param {ConstructorFor<BaseContract>} contract - The contract class.
   * @returns {[ConstructorFor<BaseContract>, uint64] | undefined}
   */
  getCompiledApp(contract: ConstructorFor<BaseContract>) {
    return this.#compiledApps.find(([c, _]) => c === contract)
  }

  /**
   * Sets a compiled application.
   *
   * @param {ConstructorFor<BaseContract>} c - The contract class.
   * @param {uint64} appId - The application ID.
   */
  setCompiledApp(c: ConstructorFor<BaseContract>, appId: uint64) {
    const existing = this.getCompiledApp(c)
    if (existing) {
      existing[1] = appId
    } else {
      this.#compiledApps.push([c, appId])
    }
  }

  /**
   * Gets a compiled logic signature.
   *
   * @param {ConstructorFor<LogicSig>} logicsig - The logic signature class.
   * @returns {[ConstructorFor<LogicSig>, Account] | undefined}
   */
  getCompiledLogicSig(logicsig: ConstructorFor<LogicSig>) {
    return this.#compiledLogicSigs.find(([c, _]) => c === logicsig)
  }

  /**
   * Sets a compiled logic signature.
   *
   * @param {ConstructorFor<LogicSig>} c - The logic signature class.
   * @param {Account} account - The account associated with the logic signature.
   */
  setCompiledLogicSig(c: ConstructorFor<LogicSig>, account: AccountType) {
    const existing = this.getCompiledLogicSig(c)
    if (existing) {
      existing[1] = account
    } else {
      this.#compiledLogicSigs.push([c, account])
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
    this.#template_vars = {}
    this.#compiledApps = []
    ContextManager.reset()
    ContextManager.instance = this
  }
}
