import {
  Account,
  Application,
  Asset,
  BaseContract,
  Bytes,
  bytes,
  Contract,
  contract,
  internal,
  LocalState,
} from '@algorandfoundation/algorand-typescript'
import {
  AbiMetadata,
  copyAbiMetadatas,
  getArc4Selector,
  getContractAbiMetadata,
  getContractMethodAbiMetadata,
  isContractProxy,
} from '../abi-metadata'
import { BytesMap } from '../collections/custom-key-map'
import { checkRoutingConditions } from '../context-helpers/context-util'
import { lazyContext } from '../context-helpers/internal-context'
import { toBytes, type TypeInfo } from '../encoders'
import { AccountCls, ApplicationCls, AssetCls } from '../impl/reference'
import { BoxCls, BoxMapCls, BoxRefCls, GlobalStateCls } from '../impl/state'
import {
  ApplicationTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
  Transaction,
} from '../impl/transactions'
import { getGenericTypeInfo } from '../runtime-helpers'
import { DeliberateAny, IConstructor } from '../typescript-helpers'

type ContractOptionsParameter = Parameters<typeof contract>[0]

type StateTotals = Pick<Application, 'globalNumBytes' | 'globalNumUint' | 'localNumBytes' | 'localNumUint'>

interface States {
  globalStates: BytesMap<GlobalStateCls<unknown>>
  localStates: BytesMap<LocalState<unknown>>
  totals: StateTotals
}

const isUint64GenericType = (typeInfo: TypeInfo | undefined) => {
  if (!Array.isArray(typeInfo?.genericArgs) || !typeInfo?.genericArgs?.length) return false
  return typeInfo.genericArgs.some((t) => t.name.toLocaleLowerCase() === 'uint64')
}

const extractStates = (contract: BaseContract, contractOptions: ContractOptionsParameter | undefined): States => {
  const stateTotals = { globalNumBytes: 0, globalNumUint: 0, localNumBytes: 0, localNumUint: 0 }
  const states = {
    globalStates: new BytesMap<GlobalStateCls<unknown>>(),
    localStates: new BytesMap<LocalState<unknown>>(),
    totals: stateTotals,
  }
  Object.entries(contract).forEach(([key, value]) => {
    const isLocalState = value instanceof Function && value.name === 'localStateInternal'
    const isGlobalState = value instanceof GlobalStateCls
    const isBox = value instanceof BoxCls
    const isBoxRef = value instanceof BoxRefCls
    const isBoxMap = value instanceof BoxMapCls
    if (isLocalState || isGlobalState || isBox || isBoxRef) {
      // set key using property name if not already set
      if (!value.hasKey) value.key = Bytes(key)
    } else if (isBoxMap) {
      if (!value.hasKeyPrefix) value.keyPrefix = Bytes(key)
    }

    if (isLocalState || isGlobalState) {
      // capture state into the context
      if (isLocalState) states.localStates.set(value.key, value)
      else states.globalStates.set(value.key, value)

      // populate state totals
      const isUint64State = isUint64GenericType(getGenericTypeInfo(value)!)
      stateTotals.globalNumUint += isGlobalState && isUint64State ? 1 : 0
      stateTotals.globalNumBytes += isGlobalState && !isUint64State ? 1 : 0
      stateTotals.localNumUint += isLocalState && isUint64State ? 1 : 0
      stateTotals.localNumBytes += isLocalState && !isUint64State ? 1 : 0
    }
  })

  stateTotals.globalNumUint = contractOptions?.stateTotals?.globalUints ?? stateTotals.globalNumUint
  stateTotals.globalNumBytes = contractOptions?.stateTotals?.globalBytes ?? stateTotals.globalNumBytes
  stateTotals.localNumUint = contractOptions?.stateTotals?.localUints ?? stateTotals.localNumUint
  stateTotals.localNumBytes = contractOptions?.stateTotals?.localBytes ?? stateTotals.localNumBytes

  return states
}

const extractArraysFromArgs = (app: Application, methodSelector: Uint8Array, args: DeliberateAny[]) => {
  const transactions: Transaction[] = []
  const accounts: Account[] = []
  const apps: Application[] = [app]
  const assets: Asset[] = []
  const appArgs: bytes[] = []

  for (const arg of args) {
    if (isTransaction(arg)) {
      transactions.push(arg)
    } else if (arg instanceof AccountCls) {
      appArgs.push(toBytes(accounts.length))
      accounts.push(arg as Account)
    } else if (arg instanceof ApplicationCls) {
      appArgs.push(toBytes(apps.length))
      apps.push(arg as Application)
    } else if (arg instanceof AssetCls) {
      appArgs.push(toBytes(assets.length))
      assets.push(arg as Asset)
    }
  }
  return { accounts, apps, assets, transactions, appArgs: [Bytes(methodSelector), ...appArgs] }
}

function isTransaction(obj: unknown): obj is Transaction {
  return (
    obj instanceof PaymentTransaction ||
    obj instanceof KeyRegistrationTransaction ||
    obj instanceof AssetConfigTransaction ||
    obj instanceof AssetTransferTransaction ||
    obj instanceof AssetFreezeTransaction ||
    obj instanceof ApplicationTransaction
  )
}

export class ContractContext {
  create<T extends BaseContract>(type: IConstructor<T>, ...args: DeliberateAny[]): T {
    const proxy = new Proxy(type, this.getContractProxyHandler<T>(this.isArc4(type)))
    return new proxy(...args)
  }

  static createMethodCallTxns<TParams extends unknown[]>(
    contract: BaseContract,
    abiMetadata: AbiMetadata | undefined,
    ...args: TParams
  ): Transaction[] {
    const app = lazyContext.ledger.getApplicationForContract(contract)
    const methodSelector = abiMetadata ? getArc4Selector(abiMetadata) : new Uint8Array()
    const { transactions, ...appCallArgs } = extractArraysFromArgs(app, methodSelector, args)
    const appTxn = lazyContext.any.txn.applicationCall({
      appId: app,
      ...appCallArgs,
      // TODO: This needs to be specifiable by the test code
      onCompletion: (abiMetadata?.allowActions ?? [])[0],
    })
    const txns = [...(transactions ?? []), appTxn]
    return txns
  }

  private isArc4<T extends BaseContract>(type: IConstructor<T>): boolean {
    const proto = Object.getPrototypeOf(type)
    if (proto === BaseContract) {
      return false
    } else if (proto === Contract) {
      return true
    } else if (proto === Object) {
      throw new Error('Cannot create a contract for class as it does not extend Contract or BaseContract')
    }
    return this.isArc4(proto)
  }

  private getContractProxyHandler<T extends BaseContract>(isArc4: boolean): ProxyHandler<IConstructor<T>> {
    const onConstructed = (application: Application, instance: T, conrtactOptions: ContractOptionsParameter | undefined) => {
      const states = extractStates(instance, conrtactOptions)

      const applicationData = lazyContext.ledger.applicationDataMap.getOrFail(application.id)
      applicationData.application = {
        ...applicationData.application,
        globalStates: states.globalStates,
        localStates: states.localStates,
        ...states.totals,
      }
      lazyContext.ledger.addAppIdContractMap(application.id, instance)
    }
    return {
      construct(target, args) {
        let t: T | undefined = undefined
        const application = lazyContext.any.application()
        const txn = lazyContext.any.txn.applicationCall({ appId: application })
        const appData = lazyContext.ledger.applicationDataMap.getOrFail(application.id)
        appData.isCreating = true
        lazyContext.txn.ensureScope([txn]).execute(() => {
          t = new target(...args)
        })
        appData.isCreating = hasCreateMethods(t!)
        const instance = new Proxy(t!, {
          get(target, prop, receiver) {
            if (prop === isContractProxy) {
              return true
            }
            const orig = Reflect.get(target, prop, receiver)
            const abiMetadata = getContractMethodAbiMetadata(target, prop as string)
            const isProgramMethod = prop === 'approvalProgram' || prop === 'clearStateProgram'
            const isAbiMethod = isArc4 && abiMetadata
            if (isAbiMethod || isProgramMethod) {
              return (...args: DeliberateAny[]): DeliberateAny => {
                const txns = ContractContext.createMethodCallTxns(receiver, abiMetadata, ...args)
                return lazyContext.txn.ensureScope(txns).execute(() => {
                  if (isAbiMethod) {
                    checkRoutingConditions(application.id, abiMetadata)
                  }
                  const returnValue = (orig as DeliberateAny).apply(target, args)
                  if (!isProgramMethod && isAbiMethod && returnValue !== undefined) {
                    ;(txns.at(-1) as ApplicationTransaction).logArc4ReturnValue(returnValue)
                  }
                  appData.isCreating = false
                  return returnValue
                })
              }
            }
            return orig
          },
        })

        onConstructed(application, instance, getContractOptions(t!))

        copyAbiMetadatas(t!, instance)

        return instance
      },
    }
  }
}

const getContractOptions = (contract: BaseContract): ContractOptionsParameter | undefined => {
  const contractClass = contract.constructor as DeliberateAny
  return contractClass[internal.ContractOptionsSymbol] as ContractOptionsParameter
}

const hasCreateMethods = (contract: BaseContract) => {
  const metadatas = getContractAbiMetadata(contract)
  return Object.values(metadatas).some((metadata) => (metadata.onCreate ?? 'disallow') !== 'disallow')
}
