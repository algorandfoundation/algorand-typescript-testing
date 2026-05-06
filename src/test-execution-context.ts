import type { Account as AccountType, BaseContract, bytes, Contract, LogicSig, uint64 } from '@algorandfoundation/algorand-typescript'
import type { ApplicationSpy } from './application-spy'
import { DEFAULT_TEMPLATE_VAR_PREFIX } from './constants'
import { ContextManager } from './context-helpers/context-manager'
import type { DecodedLogs, LogDecoding } from './decode-logs'
import { toBytes } from './impl/encoded-types'
import type { ApplicationCallInnerTxnContext } from './impl/inner-transactions'
import { AccountCls } from './impl/reference'
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
  #templateVars: Record<string, DeliberateAny> = {}
  #compiledApps: Map<ConstructorFor<BaseContract>, uint64> = new Map()
  #compiledLogicSigs: Map<ConstructorFor<LogicSig>, AccountType> = new Map()
  #applicationSpies: Array<ApplicationSpy<Contract>> = []

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
    if (val instanceof AccountCls) {
      this.#defaultSender = val
    } else if (!this.#defaultSender.bytes.equals(val as bytes)) {
      this.#defaultSender = new AccountCls(val as bytes)
    }
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
   * @param {...unknown[]} args - The arguments for the logic signature.
   * @returns {boolean | uint64}
   */
  executeLogicSig(logicSig: LogicSig, ...args: unknown[]): boolean | uint64 {
    this.#activeLogicSigArgs = args.map((a) => toBytes(a))
    try {
      if (logicSig.program.length === 0) {
        return logicSig.program()
      } else {
        return logicSig.program(...args)
      }
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
   * Gets the compiled application ID for a contract, or undefined if not compiled.
   *
   * @param {ConstructorFor<BaseContract>} contract - The contract class.
   * @returns {uint64 | undefined}
   */
  getCompiledApp(contract: ConstructorFor<BaseContract>): uint64 | undefined {
    return this.#compiledApps.get(contract)
  }

  /**
   * Sets a compiled application.
   *
   * @param {ConstructorFor<BaseContract>} c - The contract class.
   * @param {uint64} appId - The application ID.
   */
  setCompiledApp(c: ConstructorFor<BaseContract>, appId: uint64) {
    this.#compiledApps.set(c, appId)
  }

  /** @internal */
  notifyApplicationSpies(itxn: ApplicationCallInnerTxnContext) {
    for (const spy of this.#applicationSpies) {
      spy.notify(itxn)
    }
  }

  /**
   * Adds an application spy to the context.
   *
   * @param {ApplicationSpy<TContract>} spy - The application spy to add.
   */
  addApplicationSpy<TContract extends Contract>(spy: ApplicationSpy<TContract>) {
    this.#applicationSpies.push(spy)
  }

  /**
   * Gets the compiled logic signature account, or undefined if not compiled.
   *
   * @param {ConstructorFor<LogicSig>} logicsig - The logic signature class.
   * @returns {AccountType | undefined}
   */
  getCompiledLogicSig(logicsig: ConstructorFor<LogicSig>): AccountType | undefined {
    return this.#compiledLogicSigs.get(logicsig)
  }

  /**
   * Sets a compiled logic signature.
   *
   * @param {ConstructorFor<LogicSig>} c - The logic signature class.
   * @param {Account} account - The account associated with the logic signature.
   */
  setCompiledLogicSig(c: ConstructorFor<LogicSig>, account: AccountType) {
    this.#compiledLogicSigs.set(c, account)
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
    this.#compiledApps = new Map()
    this.#compiledLogicSigs = new Map()
    this.#applicationSpies = []
    this.#defaultSender = this.any.account({ address: this.#defaultSender.bytes }) // reset default sender account data in ledger context
    ContextManager.reset()
    ContextManager.instance = this
  }
}
