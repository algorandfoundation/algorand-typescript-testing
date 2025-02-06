import type {
  Account,
  BaseContract,
  CompileContractOptions,
  CompiledContract,
  CompiledLogicSig,
  CompileLogicSigOptions,
  LogicSig,
} from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import type { ConstructorFor } from '../typescript-helpers'
import type { ApplicationData } from './reference'

export function compileImpl(
  artefact: ConstructorFor<BaseContract> | ConstructorFor<LogicSig>,
  options?: CompileContractOptions | CompileLogicSigOptions,
): CompiledLogicSig | CompiledContract {
  let app: ApplicationData | undefined
  let account: Account | undefined
  const compiledApp = lazyContext.value.getCompiledApp(artefact as ConstructorFor<BaseContract>)
  const compiledLogicSig = lazyContext.value.getCompiledLogicSig(artefact as ConstructorFor<LogicSig>)
  if (compiledApp !== undefined) {
    app = lazyContext.ledger.applicationDataMap.get(compiledApp[1])
  }
  if (compiledLogicSig !== undefined) {
    account = compiledLogicSig[1]
  }
  if (options?.templateVars) {
    Object.entries(options.templateVars).forEach(([key, value]) => {
      lazyContext.value.setTemplateVar(key, value, options.templateVarsPrefix)
    })
  }
  return new Proxy({} as CompiledLogicSig | CompiledContract, {
    get: (_target, prop) => {
      switch (prop) {
        case 'approvalProgram':
          return app?.application.approvalProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)]
        case 'clearStateProgram':
          return app?.application.clearStateProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)]
        case 'extraProgramPages':
          return (options as CompileContractOptions)?.extraProgramPages ?? app?.application.extraProgramPages ?? lazyContext.any.uint64()
        case 'globalUints':
          return (options as CompileContractOptions)?.globalUints ?? app?.application.globalNumUint ?? lazyContext.any.uint64()
        case 'globalBytes':
          return (options as CompileContractOptions)?.globalBytes ?? app?.application.globalNumBytes ?? lazyContext.any.uint64()
        case 'localUints':
          return (options as CompileContractOptions)?.localUints ?? app?.application.localNumUint ?? lazyContext.any.uint64()
        case 'localBytes':
          return (options as CompileContractOptions)?.localBytes ?? app?.application.localNumBytes ?? lazyContext.any.uint64()
        case 'account':
          return account ?? lazyContext.any.account()
      }
    },
  })
}
