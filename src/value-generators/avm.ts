import { Account, Application, Asset, bytes, Bytes, internal, Uint64, uint64 } from '@algorandfoundation/algorand-typescript'
import { randomBytes } from 'crypto'
import { MAX_BYTES_SIZE, MAX_UINT64, ZERO_ADDRESS } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { AccountData, AccountImpl, ApplicationCls, ApplicationData, AssetCls, AssetData } from '../impl/reference'
import { asBigInt, asUint64Cls, getRandomBigInt, getRandomBytes } from '../util'

type AccountContextData = Partial<AccountData['account']> & {
  address?: Account
  incentiveEligible?: boolean
  optedAssetBalances?: Map<internal.primitives.StubUint64Compat, internal.primitives.StubUint64Compat>
  optedApplications?: Application[]
}

type AssetContextData = Partial<AssetData> & { assetId?: internal.primitives.StubUint64Compat }

type ApplicationContextData = Partial<ApplicationData['application']> & { applicationId?: internal.primitives.StubUint64Compat }

export class AvmValueGenerator {
  uint64(minValue: internal.primitives.StubUint64Compat = 0n, maxValue: internal.primitives.StubUint64Compat = MAX_UINT64): uint64 {
    const min = asBigInt(minValue)
    const max = asBigInt(maxValue)
    if (max > MAX_UINT64) {
      internal.errors.internalError('maxValue must be less than or equal to MAX_UINT64')
    }
    if (min > max) {
      internal.errors.internalError('minValue must be less than or equal to maxValue')
    }
    if (min < 0n || max < 0n) {
      internal.errors.internalError('minValue and maxValue must be greater than or equal to 0')
    }
    return Uint64(getRandomBigInt(min, max))
  }

  bytes(length = MAX_BYTES_SIZE): bytes {
    return Bytes(new Uint8Array(randomBytes(length)))
  }

  string(length = 11): string {
    const setLength = 11
    return Array(Math.ceil(length / setLength))
      .fill(0)
      .map(() => Math.random().toString(36).substring(2))
      .join('')
      .substring(0, length)
  }

  account(input?: AccountContextData): Account {
    const account = input?.address ?? AccountImpl(getRandomBytes(32).asAlgoTs())

    if (input?.address && lazyContext.ledger.accountDataMap.has(account)) {
      internal.errors.internalError(
        'Account with such address already exists in testing context. Use `context.ledger.getAccount(address)` to retrieve the existing account.',
      )
    }

    const data = new AccountData()
    const { address, optedAssetBalances, optedApplications, incentiveEligible, ...accountData } = input ?? {}
    data.incentiveEligible = incentiveEligible ?? false
    data.account = {
      ...data.account,
      ...accountData,
    }
    lazyContext.ledger.accountDataMap.set(account, data)

    if (input?.optedAssetBalances) {
      for (const [assetId, balance] of input.optedAssetBalances) {
        lazyContext.ledger.updateAssetHolding(account, assetId, balance)
      }
    }
    if (input?.optedApplications) {
      for (const app of input.optedApplications) {
        data.optedApplications.set(asBigInt(app.id), app)
      }
    }
    return account
  }

  asset(input?: AssetContextData): Asset {
    const id = input?.assetId
    if (id && lazyContext.ledger.assetDataMap.has(id)) {
      internal.errors.internalError('Asset with such ID already exists in testing context!')
    }
    const assetId = asUint64Cls(id ?? lazyContext.ledger.assetIdIter.next().value)
    const defaultAssetData = {
      total: lazyContext.any.uint64(),
      decimals: lazyContext.any.uint64(1, 6),
      defaultFrozen: false,
      unitName: lazyContext.any.bytes(4),
      name: lazyContext.any.bytes(32),
      url: lazyContext.any.bytes(10),
      metadataHash: lazyContext.any.bytes(32),
      manager: AccountImpl(ZERO_ADDRESS),
      freeze: AccountImpl(ZERO_ADDRESS),
      clawback: AccountImpl(ZERO_ADDRESS),
      creator: lazyContext.defaultSender,
      reserve: AccountImpl(ZERO_ADDRESS),
    }
    const { assetId: _, ...assetData } = input ?? {}
    lazyContext.ledger.assetDataMap.set(assetId, {
      ...defaultAssetData,
      ...assetData,
    })
    return new AssetCls(assetId.asAlgoTs())
  }

  application(input?: ApplicationContextData): Application {
    const id = input?.applicationId
    if (id && lazyContext.ledger.applicationDataMap.has(id)) {
      internal.errors.internalError('Application with such ID already exists in testing context!')
    }
    const applicationId = asUint64Cls(id ?? lazyContext.ledger.appIdIter.next().value)
    const data = new ApplicationData()
    const { applicationId: _, ...applicationData } = input ?? {}
    data.application = {
      ...data.application,
      ...applicationData,
    }
    lazyContext.ledger.applicationDataMap.set(applicationId, data)
    return new ApplicationCls(applicationId.asAlgoTs())
  }
}
