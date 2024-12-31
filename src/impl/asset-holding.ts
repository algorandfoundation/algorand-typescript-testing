import { Account, Asset, internal, Uint64, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { getAccount } from './acct-params'
import { getAsset } from './asset-params'
import { AssetHolding as AssetHoldingData } from './reference'

const getAssetHolding = (
  acctOrIndex: Account | internal.primitives.StubUint64Compat,
  assetOrIndex: Asset | internal.primitives.StubUint64Compat,
): AssetHoldingData | undefined => {
  const account = getAccount(acctOrIndex)
  const asset = getAsset(assetOrIndex)
  if (asset === undefined) {
    return undefined
  }

  const accountData = lazyContext.getAccountData(account)
  const holding = accountData.optedAssets.get(asset.id)
  if (holding === undefined) {
    return undefined
  }
  return holding
}

export const AssetHolding: internal.opTypes.AssetHoldingType = {
  assetBalance(
    a: Account | internal.primitives.StubUint64Compat,
    b: Asset | internal.primitives.StubUint64Compat,
  ): readonly [uint64, boolean] {
    const holding = getAssetHolding(a, b)
    return holding === undefined ? [Uint64(0), false] : [holding.balance, true]
  },
  assetFrozen(
    a: Account | internal.primitives.StubUint64Compat,
    b: Asset | internal.primitives.StubUint64Compat,
  ): readonly [boolean, boolean] {
    const holding = getAssetHolding(a, b)
    return holding === undefined ? [false, false] : [holding.frozen, true]
  },
}
