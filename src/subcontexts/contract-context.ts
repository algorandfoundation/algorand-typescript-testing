import type { BaseContract as BaseContractType } from '@algorandfoundation/algorand-typescript'
import {
  OnCompleteAction,
  type Account,
  type Application,
  type Asset,
  type contract,
  type LocalState,
} from '@algorandfoundation/algorand-typescript'
import type { ARC4Encoded, ResourceEncodingOptions } from '@algorandfoundation/algorand-typescript/arc4'
import type { AbiMetadata } from '../abi-metadata'
import { getArc4Selector, getContractAbiMetadata, getContractMethodAbiMetadata } from '../abi-metadata'
import { BytesMap } from '../collections/custom-key-map'
import { checkRoutingConditions } from '../context-helpers/context-util'
import { lazyContext } from '../context-helpers/internal-context'
import { CodeError } from '../errors'
import type { BaseContract } from '../impl/base-contract'
import { ContractOptionsSymbol } from '../impl/base-contract'
import type { Contract } from '../impl/contract'
import { getArc4Encoded, Uint, type TypeInfo } from '../impl/encoded-types'
import { Bytes } from '../impl/primitives'
import { AccountCls, ApplicationCls, AssetCls } from '../impl/reference'
import { BoxCls, BoxMapCls, BoxRefCls, GlobalStateCls } from '../impl/state'
import type { Transaction } from '../impl/transactions'
import {
  ApplicationCallTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
} from '../impl/transactions'
import { getGenericTypeInfo } from '../runtime-helpers'
import type { DeliberateAny, IConstructor } from '../typescript-helpers'
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

const getUint8 = (value: number) => new Uint({ name: 'Uint<8>', genericArgs: [{ name: '8' }] }, value)

/**
 * @internal
 */
export const extractArraysFromArgs = (
  app: Application,
  methodSelector: Uint8Array,
  resourceEncoding: ResourceEncodingOptions | undefined,
  args: DeliberateAny[],
) => {
  const transactions: Transaction[] = []
  const accounts: Account[] = [lazyContext.defaultSender]
  const apps: Application[] = [app]
  const assets: Asset[] = []
  let appArgs: ARC4Encoded[] = []

  for (const arg of args) {
    if (isTransaction(arg)) {
      transactions.push(arg)
    } else if (arg instanceof AccountCls) {
      if (resourceEncoding === 'index') {
        appArgs.push(getUint8(accounts.length))
        accounts.push(arg as Account)
      } else {
        appArgs.push(getArc4Encoded(arg.bytes))
      }
    } else if (arg instanceof ApplicationCls) {
      if (resourceEncoding === 'index') {
        appArgs.push(getUint8(apps.length))
        apps.push(arg as Application)
      } else {
        appArgs.push(getArc4Encoded(arg.id))
      }
    } else if (arg instanceof AssetCls) {
      if (resourceEncoding === 'index') {
        appArgs.push(getUint8(assets.length))
        assets.push(arg as Asset)
      } else {
        appArgs.push(getArc4Encoded(arg.id))
      }
    } else if (arg !== undefined) {
      appArgs.push(getArc4Encoded(arg))
    }
  }

  if (appArgs.length > 15) {
    const packed = getArc4Encoded(appArgs.slice(14))
    appArgs = [...appArgs.slice(0, 14), packed]
  }
  return {
    accounts,
    apps,
    assets,
    transactions,
    appArgs: [Bytes(methodSelector), ...appArgs.filter((a) => a !== undefined).map((a) => a.bytes)],
  }
}

function isTransaction(obj: unknown): obj is Transaction {
  return (
    obj instanceof PaymentTransaction ||
    obj instanceof KeyRegistrationTransaction ||
    obj instanceof AssetConfigTransaction ||
    obj instanceof AssetTransferTransaction ||
    obj instanceof AssetFreezeTransaction ||
    obj instanceof ApplicationCallTransaction
  )
}

/**
 * Provides a context for creating contracts and registering created contract instances
 * with test execution context.
 */
export class ContractContext {
  /**
   * Creates a new contract instance and register the created instance with test execution context.
   *
   * @template T Type of contract extending BaseContract
   * @param {IConstructor<T>} type The contract class constructor
   * @param {...any[]} args Constructor arguments for the contract
   * @returns {T} Proxied instance of the contract
   * @example
   * const ctx = new TestExecutionContext();
   * const contract = ctx.contract.create(MyContract);
   */
  create<T extends BaseContractType>(type: IConstructor<T>, ...args: DeliberateAny[]): T {
    const proxy = new Proxy(type, this.getContractProxyHandler<T>(this.isArc4(type)))
    return new proxy(...args)
  }

  /**
   * Creates an array of transactions for calling a contract method.
   *
   * @internal
   * @template TParams Array of parameter types
   * @param {BaseContract} contract The contract instance
   * @param {AbiMetadata | undefined} abiMetadata ABI metadata for the method
   * @param {...TParams} args Method arguments
   * @returns {Transaction[]} Array of transactions needed to execute the method
   * @example
   * const txns = ContractContext.createMethodCallTxns(
   *   myContract,
   *   methodAbiMetadata,
   *   arg1,
   *   arg2
   * );
   */
  static createMethodCallTxns<TParams extends unknown[]>(
    contract: BaseContract,
    abiMetadata: AbiMetadata | undefined,
    ...args: TParams
  ): Transaction[] {
    const app = lazyContext.ledger.getApplicationForContract(contract)
    const methodSelector = abiMetadata ? getArc4Selector(abiMetadata) : new Uint8Array()
    const { transactions, ...appCallArgs } = extractArraysFromArgs(app, methodSelector, abiMetadata?.resourceEncoding, args)
    const appTxn = lazyContext.any.txn.applicationCall({
      appId: app,
      ...appCallArgs,
      // TODO: This needs to be specifiable by the test code
      onCompletion: OnCompleteAction[(abiMetadata?.allowActions ?? [])[0]],
    })
    const txns = [...(transactions ?? []), appTxn]
    return txns
  }

  /**
   * @internal
   */
  private isArc4<T extends BaseContract>(type: IConstructor<T>): boolean {
    const result = (type as DeliberateAny as typeof BaseContract).isArc4
    if (result !== undefined && result !== null) {
      return result
    }

    throw new CodeError('Cannot create a contract for class as it does not extend Contract or BaseContract')
  }

  /**
   * @internal
   */
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
        appData.isCreating = isArc4 && hasCreateMethods(t! as Contract)
        const instance = new Proxy(t!, {
          get(target, prop, receiver) {
            const orig = Reflect.get(target, prop, receiver)
            const abiMetadata =
              isArc4 && typeof orig === 'function' ? getContractMethodAbiMetadata(target as Contract, orig.name) : undefined
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
                    ;(txns.at(-1) as ApplicationCallTransaction).logArc4ReturnValue(returnValue)
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

        return instance
      },
    }
  }
}

const getContractOptions = (contract: BaseContract): ContractOptionsParameter | undefined => {
  const contractClass = contract.constructor as DeliberateAny
  return contractClass[ContractOptionsSymbol] as ContractOptionsParameter
}

const hasCreateMethods = (contract: Contract) => {
  const createFn = Reflect.get(contract, 'createApplication')
  if (createFn !== undefined && typeof createFn === 'function') return true

  const metadatas = getContractAbiMetadata(contract)
  return Object.values(metadatas).some((metadata) => (metadata.onCreate ?? 'disallow') !== 'disallow')
}
