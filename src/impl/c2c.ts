import { type CompileContractOptions, type Contract, OnCompleteAction } from '@algorandfoundation/algorand-typescript'
import type {
  BareCreateApplicationCallFields,
  ContractProxy,
  TypedApplicationCallFields,
} from '@algorandfoundation/algorand-typescript/arc4'
import { getContractMethodAbiMetadata } from '../abi-metadata'
import { lazyContext } from '../context-helpers/internal-context'
import type { ConstructorFor, DeliberateAny, InstanceMethod } from '../typescript-helpers'
import type { ApplicationCallInnerTxn } from './inner-transactions'
import { ApplicationCallInnerTxnContext } from './inner-transactions'
import { methodSelector } from './method-selector'
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
          const selector = methodSelector(prop as string, contract)
          const abiMetadata = getContractMethodAbiMetadata(contract, prop as string)
          const onCompleteActions = abiMetadata?.allowActions?.map((action) => OnCompleteAction[action])
          const itxnContext = ApplicationCallInnerTxnContext.createFromTypedApplicationCallFields(
            {
              ...getCommonApplicationCallFields(app, options),
              onCompletion: onCompleteActions?.[0],
              ...methodArgs,
            },
            selector,
          )
          invokeCallback(itxnContext)
          return {
            itxn: itxnContext,
            returnValue: itxnContext.loggedReturnValue,
          }
        }
      },
    }),

    bareCreate: (methodArgs?: BareCreateApplicationCallFields) => {
      const itxnContext = ApplicationCallInnerTxnContext.createFromBareCreateApplicationCallFields({
        ...getCommonApplicationCallFields(app, options),
        ...methodArgs,
      })
      invokeCallback(itxnContext)
      return itxnContext
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

const invokeCallback = (itxnContext: ApplicationCallInnerTxnContext) => {
  lazyContext.value.notifyApplicationSpies(itxnContext)
  lazyContext.txn.activeGroup.addInnerTransactionGroup(...(itxnContext.itxns ?? []), itxnContext)
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
  const selector = methodSelector(method, contract)
  const itxnContext = ApplicationCallInnerTxnContext.createFromTypedApplicationCallFields<TReturn>(methodArgs, selector)
  invokeCallback(itxnContext)

  return {
    itxn: itxnContext,
    returnValue: itxnContext.loggedReturnValue,
  }
}
