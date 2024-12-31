import * as algokit from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import { AppClient } from '@algorandfoundation/algokit-utils/types/app-client'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { AssetCreateParams } from '@algorandfoundation/algokit-utils/types/composer'
import { KmdAccountManager } from '@algorandfoundation/algokit-utils/types/kmd-account-manager'
import { nullLogger } from '@algorandfoundation/algokit-utils/types/logging'
import { Account, Bytes, internal, uint64 } from '@algorandfoundation/algorand-typescript'
import { AccountImpl } from '@algorandfoundation/algorand-typescript-testing/runtime-helpers'
import { randomUUID } from 'crypto'
import { Mutable } from '../src/typescript-helpers'
import { asUint64, getRandomBigInt, getRandomNumber, Lazy } from '../src/util'

export type ABIValue = boolean | number | bigint | string | Uint8Array | ABIValue[]

algokit.Config.configure({ logger: nullLogger })

const algorandClient = Lazy(() => {
  const client = algokit.AlgorandClient.defaultLocalNet()
  client.setDefaultValidityWindow(1000)
  return client
})

export const INITIAL_BALANCE_MICRO_ALGOS = Number(20e6)

export const getAlgorandAppClientV11 = async (appSpec: AppSpec) => {
  if ((await getAlgodMajorVersion()) < 4) {
    return undefined
  }
  const [appClient, _] = await getAlgorandAppClientWithApp(appSpec)
  return appClient
}

export const getAlgorandAppClient = async (appSpec: AppSpec) => {
  const [appClient, _] = await getAlgorandAppClientWithApp(appSpec)
  return appClient
}

export const getAlgodMajorVersion = async () => {
  const algorand = algorandClient()
  const version = await algorand.client.algod.versionsCheck().do()
  return version.build.major
}

export const getAlgorandAppClientWithApp = async (appSpec: AppSpec) => {
  const algorand = algorandClient()
  const defaultSigner = await algorand.account.kmd.getLocalNetDispenserAccount()
  const appClient = algorand.client.getAppFactory({
    appSpec,
    defaultSigner: defaultSigner.signer,
    defaultSender: defaultSigner.account.sender.addr,
  })
  const app = await appClient.deploy({ appName: `${appSpec.contract.name}${randomUUID()}`, createParams: { extraProgramPages: undefined } })

  return [app.appClient, app.result] as const
}

const invokeMethod = async (
  appClient: AppClient,
  method: string,
  sendParams?: Partial<Parameters<AppClient['send']['call']>[0]>,
  ...methodArgs: ABIValue[]
): ReturnType<AppClient['send']['call']> => {
  const response = await appClient.send.call({ method, args: methodArgs, note: randomUUID(), ...sendParams })
  return response
}

export const getAvmResult = async <TResult extends ABIValue>(
  { appClient, sendParams }: { appClient: AppClient; sendParams?: Partial<Parameters<AppClient['send']['call']>[0]> },
  method: string,
  ...methodArgs: ABIValue[]
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
  ...methodArgs: ABIValue[]
): Promise<Uint8Array[] | undefined> => {
  const result = await invokeMethod(appClient, method, sendParams, ...methodArgs)
  return result?.confirmation?.logs
}

export const getAvmResultRaw = async (
  { appClient, sendParams }: { appClient: AppClient; sendParams?: Partial<Parameters<AppClient['send']['call']>[0]> },
  method: string,
  ...methodArgs: ABIValue[]
): Promise<Uint8Array | undefined> => {
  const result = await invokeMethod(appClient, method, sendParams, ...methodArgs)
  return result?.returns?.at(-1)?.rawReturnValue
}

export const getLocalNetDefaultAccount = () => {
  const client = algorandClient()
  const kmdAccountManager = new KmdAccountManager(client.client)
  return kmdAccountManager.getLocalNetDispenserAccount()
}

export const generateAVMTestAccount = async (): Promise<ReturnType<algokit.AlgorandClient['account']['random']>> => {
  const client = algorandClient()
  const account = client.account.random()
  await client.account.ensureFundedFromEnvironment(account.addr, AlgoAmount.MicroAlgos(INITIAL_BALANCE_MICRO_ALGOS))
  return account
}

export const generateTestAccount = async (): Promise<Account> => {
  const account = await generateAVMTestAccount()
  return AccountImpl(Bytes.fromBase32(account.addr.toString()))
}

export const generateTestAsset = async (fields: Mutable<AssetCreateParams>): Promise<uint64> => {
  if (fields.total === undefined) {
    fields.total = getRandomBigInt(20, 120)
  }

  if (fields.assetName === undefined) {
    fields.assetName = `ASA ${getRandomNumber(1, 100)}_${getRandomNumber(1, 100)}_${fields.total}`
  }

  if (fields.decimals === undefined) {
    fields.decimals = 0
  }

  const client = algorandClient()
  const x = await client.send.assetCreate({
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
  if (x.confirmation === undefined || x.confirmation.assetIndex === undefined) {
    internal.errors.internalError('Failed to create asset')
  }
  return asUint64(x.confirmation.assetIndex)
}
