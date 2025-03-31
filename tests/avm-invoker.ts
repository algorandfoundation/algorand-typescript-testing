import type { AppClient } from '@algorandfoundation/algokit-utils/types/app-client'
import type { AssetCreateParams } from '@algorandfoundation/algokit-utils/types/composer'
import { randomUUID } from 'crypto'
import type { Mutable } from '../src/typescript-helpers'
import { getRandomBigInt, getRandomNumber } from '../src/util'

export type ABIValue = boolean | number | bigint | string | Uint8Array | ABIValue[]

export const INITIAL_BALANCE_MICRO_ALGOS = Number(20e6)

type MethodArgs = Exclude<Parameters<typeof AppClient.prototype.send.call>[0]['args'], undefined>

const invokeMethod = async (
  appClient: AppClient,
  method: string,
  sendParams?: Partial<Parameters<AppClient['send']['call']>[0]>,
  ...methodArgs: MethodArgs
): ReturnType<AppClient['send']['call']> => {
  const response = await appClient.send.call({ method, args: methodArgs, note: randomUUID(), ...sendParams })
  return response
}

export const getAvmResult = async <TResult extends ABIValue>(
  { appClient, sendParams }: { appClient: AppClient; sendParams?: Partial<Parameters<AppClient['send']['call']>[0]> },
  method: string,
  ...methodArgs: MethodArgs
): Promise<TResult> => {
  const result = await invokeMethod(appClient, method, sendParams, ...methodArgs)
  if (result.returns?.at(-1)?.decodeError) {
    throw result.returns.at(-1)!.decodeError
  }
  return result?.return?.valueOf() as TResult
}

export const getAvmResultLog = async (
  { appClient, sendParams }: { appClient: AppClient; sendParams?: Partial<Parameters<AppClient['send']['call']>[0]> },
  method: string,
  ...methodArgs: MethodArgs
): Promise<Uint8Array[] | undefined> => {
  const result = await invokeMethod(appClient, method, sendParams, ...methodArgs)
  return result?.confirmation?.logs
}

export const getAvmResultRaw = async (
  { appClient, sendParams }: { appClient: AppClient; sendParams?: Partial<Parameters<AppClient['send']['call']>[0]> },
  method: string,
  ...methodArgs: MethodArgs
): Promise<Uint8Array | undefined> => {
  const result = await invokeMethod(appClient, method, sendParams, ...methodArgs)
  return result?.returns?.at(-1)?.rawReturnValue
}

export const generateTestAsset = async (
  assetFactory: (assetCreateParams: AssetCreateParams) => Promise<bigint>,
  fields: Mutable<AssetCreateParams>,
): Promise<bigint> => {
  if (fields.total === undefined) {
    fields.total = getRandomBigInt(20, 120)
  }

  if (fields.assetName === undefined) {
    fields.assetName = `ASA ${getRandomNumber(1, 100)}_${getRandomNumber(1, 100)}_${fields.total}`
  }

  if (fields.decimals === undefined) {
    fields.decimals = 0
  }

  return await assetFactory({
    sender: fields.sender,
    total: BigInt(fields.total) * 10n ** BigInt(fields.decimals),
    decimals: fields.decimals,
    assetName: fields.assetName,
    unitName: fields.unitName ?? '',
    url: fields.url ?? 'https://algorand.co',
    metadataHash: fields.metadataHash,
    manager: fields.manager,
    reserve: fields.reserve,
    freeze: fields.freeze,
    clawback: fields.clawback,
    defaultFrozen: fields.defaultFrozen ?? false,
    note: randomUUID(),
  })
}
