import type { CompileContractOptions, Contract } from '@algorandfoundation/algorand-typescript'
import type {
  BareCreateApplicationCallFields,
  ContractProxy,
  TypedApplicationCallFields,
} from '@algorandfoundation/algorand-typescript/arc4'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import type { ConstructorFor, DeliberateAny, FunctionKeys, InstanceMethod } from '../typescript-helpers'
import { ApplicationCallInnerTxn, ApplicationCallInnerTxnContext } from './inner-transactions'
import type { ApplicationData } from './reference'

export function compileArc4<TContract extends Contract>(
  contract: ConstructorFor<TContract>,
  options?: CompileContractOptions,
): ContractProxy<TContract> {
  let app: ApplicationData | undefined
  const compiledAppEntry = lazyContext.value.getCompiledAppEntry(contract)
  if (compiledAppEntry !== undefined) {
    app = lazyContext.ledger.applicationDataMap.get(compiledAppEntry.value)
  }

  if (options?.templateVars) {
    Object.entries(options.templateVars).forEach(([key, value]) => {
      lazyContext.value.setTemplateVar(key, value, options.templateVarsPrefix)
    })
  }

  return {
    call: new Proxy({} as unknown as TContract, {
      get: (_target, prop) => {
        return (methodArgs: TypedApplicationCallFields<DeliberateAny[]>) => {
          const onAbiCall = lazyContext.value.getOnAbiCall(prop as FunctionKeys<TContract>, contract)
          if (!onAbiCall.value) {
            throw new InternalError('Unknown method, check correct testing context is active')
          }
          const itxnContext = ApplicationCallInnerTxnContext(getCommonApplicationCallFields(app, options), methodArgs)
          return invokeCallback(onAbiCall.value, itxnContext)
        }
      },
    }),

    bareCreate: (methodArgs?: BareCreateApplicationCallFields) => {
      const onAbiCall = lazyContext.value.getOnAbiCall('bareCreate', contract)
      if (!onAbiCall.value) {
        throw new InternalError('Unknown method, check correct testing context is active')
      }
      const itxnContext = ApplicationCallInnerTxnContext(getCommonApplicationCallFields(app, options), methodArgs)
      return invokeCallback(onAbiCall.value, itxnContext).itxn
    },
    approvalProgram: app?.application.approvalProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
    clearStateProgram: app?.application.clearStateProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
    extraProgramPages: options?.extraProgramPages ?? app?.application.extraProgramPages ?? lazyContext.any.uint64(),
    globalUints: options?.globalUints ?? app?.application.globalNumUint ?? lazyContext.any.uint64(),
    globalBytes: options?.globalBytes ?? app?.application.globalNumBytes ?? lazyContext.any.uint64(),
    localUints: options?.localUints ?? app?.application.localNumUint ?? lazyContext.any.uint64(),
    localBytes: options?.localBytes ?? app?.application.localNumBytes ?? lazyContext.any.uint64(),
  } as unknown as ContractProxy<TContract>
}

const invokeCallback = <TReturn>(
  onAbiCall: ((innerTxnContext: ApplicationCallInnerTxnContext<DeliberateAny>) => void)[],
  itxnContext: ApplicationCallInnerTxnContext<DeliberateAny>,
) => {
  onAbiCall.forEach((cb) => cb(itxnContext!))
  const innerTxn = new ApplicationCallInnerTxn(itxnContext)
  lazyContext.txn.activeGroup.addInnerTransactionGroup(innerTxn)
  return {
    itxn: innerTxn,
    returnValue: itxnContext.returnValue as TReturn,
  }
}
const getCommonApplicationCallFields = (app: ApplicationData | undefined, options: CompileContractOptions | undefined) => ({
  approvalProgram: app?.application.approvalProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
  clearStateProgram: app?.application.clearStateProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
  extraProgramPages: options?.extraProgramPages ?? app?.application.extraProgramPages ?? lazyContext.any.uint64(),
  globalNumUint: options?.globalUints ?? app?.application.globalNumUint ?? lazyContext.any.uint64(),
  globalNumBytes: options?.globalBytes ?? app?.application.globalNumBytes ?? lazyContext.any.uint64(),
  localNumUint: options?.localUints ?? app?.application.localNumUint ?? lazyContext.any.uint64(),
  localNumBytes: options?.localBytes ?? app?.application.localNumBytes ?? lazyContext.any.uint64(),
})

export function abiCall<TArgs extends DeliberateAny[], TReturn>(
  method: InstanceMethod<Contract, TArgs, TReturn>,
  methodArgs: TypedApplicationCallFields<TArgs>,
  contract?: Contract | { new (): Contract },
): { itxn: ApplicationCallInnerTxn; returnValue: TReturn | undefined } {
  const onAbiCall = lazyContext.value.getOnAbiCall(method, contract)
  if (!onAbiCall.value) {
    throw new InternalError('Unknown method, check correct testing context is active')
  }
  const itxnContext = ApplicationCallInnerTxnContext<TArgs, TReturn>({}, methodArgs)
  return invokeCallback<TReturn>(onAbiCall.value, itxnContext)
}
