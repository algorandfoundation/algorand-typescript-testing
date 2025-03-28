import { type CompileContractOptions, type Contract } from '@algorandfoundation/algorand-typescript'
import type { ContractProxy, TypedApplicationCallFields, TypedApplicationCallResponse } from '@algorandfoundation/algorand-typescript/arc4'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import type { ConstructorFor, DeliberateAny, InstanceMethod } from '../typescript-helpers'

export function compileArc4<TContract extends Contract>(
  contract: ConstructorFor<TContract>,
  options?: CompileContractOptions,
): ContractProxy<TContract> {
  const configuredValue = lazyContext.value.getCompiledAppProxy(contract)
  if (!configuredValue) {
    throw new InternalError('Unknown contract, check correct testing context is active')
  }
  if (options?.templateVars) {
    Object.entries(options.templateVars).forEach(([key, value]) => {
      lazyContext.value.setTemplateVar(key, value, options.templateVarsPrefix)
    })
  }
  const appProxy = configuredValue[1]
  return {
    ...appProxy,
    approvalProgram: appProxy.approvalProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
    clearStateProgram: appProxy.clearStateProgram ?? [lazyContext.any.bytes(10), lazyContext.any.bytes(10)],
    extraProgramPages: options?.extraProgramPages ?? appProxy.extraProgramPages ?? lazyContext.any.uint64(),
    globalUints: options?.globalUints ?? appProxy.globalNumUint ?? lazyContext.any.uint64(),
    globalBytes: options?.globalBytes ?? appProxy.globalNumBytes ?? lazyContext.any.uint64(),
    localUints: options?.localUints ?? appProxy.localNumUint ?? lazyContext.any.uint64(),
    localBytes: options?.localBytes ?? appProxy.localNumBytes ?? lazyContext.any.uint64(),
  } as unknown as ContractProxy<TContract>
}

export function abiCall<TArgs extends DeliberateAny[], TReturn>(
  method: InstanceMethod<Contract, TArgs, TReturn>,
  fields: TypedApplicationCallFields<TArgs>,
): TypedApplicationCallResponse<TReturn> {
  const configuredValue = lazyContext.value.getAbiCallResponse(method)
  if (!configuredValue) {
    throw new InternalError('Unknown method, check correct testing context is active')
  }
  return configuredValue[1](fields as TypedApplicationCallFields<DeliberateAny[]>) as TypedApplicationCallResponse<TReturn>
}
