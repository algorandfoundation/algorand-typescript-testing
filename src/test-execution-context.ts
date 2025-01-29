import type { Account as AccountType, BaseContract, bytes, LogicSig, uint64 } from '@algorandfoundation/algorand-typescript'
import { internal } from '@algorandfoundation/algorand-typescript'
import { captureMethodConfig } from './abi-metadata'
import { DEFAULT_TEMPLATE_VAR_PREFIX } from './constants'
import type { DecodedLogs, LogDecoding } from './decode-logs'
import { Account, AccountCls } from './impl/reference'
import { ContractContext } from './subcontexts/contract-context'
import { LedgerContext } from './subcontexts/ledger-context'
import { TransactionContext } from './subcontexts/transaction-context'
import type { ConstructorFor, DeliberateAny } from './typescript-helpers'
import { getRandomBytes } from './util'
import { ValueGenerator } from './value-generators'

export class TestExecutionContext implements internal.ExecutionContext {
  #contractContext: ContractContext
  #ledgerContext: LedgerContext
  #txnContext: TransactionContext
  #valueGenerator: ValueGenerator
  #defaultSender: AccountType
  #activeLogicSigArgs: bytes[]
  #template_vars: Record<string, DeliberateAny> = {}
  #compiledApps: Array<[ConstructorFor<BaseContract>, uint64]> = []
  #compiledLogicSigs: Array<[ConstructorFor<LogicSig>, AccountType]> = []

  constructor(defaultSenderAddress?: bytes) {
    internal.ctxMgr.instance = this
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#valueGenerator = new ValueGenerator()
    this.#defaultSender = Account(defaultSenderAddress ?? getRandomBytes(32).asAlgoTs())
    this.#activeLogicSigArgs = []
  }

  exportLogs<const T extends [...LogDecoding[]]>(appId: uint64, ...decoding: T): DecodedLogs<T> {
    return this.txn.exportLogs(appId, ...decoding)
  }

  get contract() {
    return this.#contractContext
  }

  get ledger() {
    return this.#ledgerContext
  }

  get txn() {
    return this.#txnContext
  }

  get any() {
    return this.#valueGenerator
  }

  get defaultSender(): AccountType {
    return this.#defaultSender
  }

  set defaultSender(val: bytes | AccountType) {
    this.#defaultSender = val instanceof AccountCls ? val : Account(val as bytes)
  }

  /* @internal */
  get abiMetadata() {
    return {
      captureMethodConfig,
    }
  }

  get activeLogicSigArgs(): bytes[] {
    return this.#activeLogicSigArgs
  }

  get templateVars(): Record<string, DeliberateAny> {
    return this.#template_vars
  }

  executeLogicSig(logicSig: LogicSig, ...args: bytes[]): boolean | uint64 {
    this.#activeLogicSigArgs = args
    try {
      return logicSig.program()
    } finally {
      this.#activeLogicSigArgs = []
    }
  }

  setTemplateVar(name: string, value: DeliberateAny, prefix?: string) {
    this.#template_vars[(prefix ?? DEFAULT_TEMPLATE_VAR_PREFIX) + name] = value
  }

  getCompiledApp(contract: ConstructorFor<BaseContract>) {
    return this.#compiledApps.find(([c, _]) => c === contract)
  }

  setCompiledApp(c: ConstructorFor<BaseContract>, appId: uint64) {
    const existing = this.getCompiledApp(c)
    if (existing) {
      existing[1] = appId
    } else {
      this.#compiledApps.push([c, appId])
    }
  }

  getCompiledLogicSig(logicsig: ConstructorFor<LogicSig>) {
    return this.#compiledLogicSigs.find(([c, _]) => c === logicsig)
  }

  setCompiledLogicSig(c: ConstructorFor<LogicSig>, account: AccountType) {
    const existing = this.getCompiledLogicSig(c)
    if (existing) {
      existing[1] = account
    } else {
      this.#compiledLogicSigs.push([c, account])
    }
  }

  reset() {
    this.#contractContext = new ContractContext()
    this.#ledgerContext = new LedgerContext()
    this.#txnContext = new TransactionContext()
    this.#activeLogicSigArgs = []
    this.#template_vars = {}
    this.#compiledApps = []
    internal.ctxMgr.reset()
    internal.ctxMgr.instance = this
  }
}
