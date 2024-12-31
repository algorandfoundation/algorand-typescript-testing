import { Account, Asset, Bytes, bytes, gtxn, internal, Uint64, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asMaybeUint64Cls, asUint64 } from '../util'
import { AccountImpl } from './reference'

const resolveAssetIndex = (assetIdOrIndex: internal.primitives.StubUint64Compat): uint64 => {
  const input = asUint64(assetIdOrIndex)
  if (input >= 1001) {
    return input
  }
  const txn = lazyContext.activeGroup.activeTransaction as gtxn.ApplicationTxn
  return txn.assets(input).id
}

export const getAsset = (asset: Asset | internal.primitives.StubUint64Compat): Asset | undefined => {
  try {
    const assetId = asMaybeUint64Cls(asset)
    if (assetId !== undefined) {
      return lazyContext.ledger.getAsset(resolveAssetIndex(assetId))
    }
    return asset as Asset
  } catch {
    return undefined
  }
}

export const AssetParams: internal.opTypes.AssetParamsType = {
  assetTotal(a: Asset | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Uint64(0), false] : [asset.total, true]
  },
  assetDecimals(a: Asset | internal.primitives.StubUint64Compat): readonly [uint64, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Uint64(0), false] : [asset.decimals, true]
  },
  assetDefaultFrozen(a: Asset | internal.primitives.StubUint64Compat): readonly [boolean, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [false, false] : [asset.defaultFrozen, true]
  },
  assetUnitName(a: Asset | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.unitName, true]
  },
  assetName(a: Asset | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.name, true]
  },
  assetUrl(a: Asset | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.url, true]
  },
  assetMetadataHash(a: Asset | internal.primitives.StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.metadataHash, true]
  },
  assetManager(a: Asset | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [AccountImpl(), false] : [asset.manager, true]
  },
  assetReserve(a: Asset | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [AccountImpl(), false] : [asset.reserve, true]
  },
  assetFreeze(a: Asset | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [AccountImpl(), false] : [asset.freeze, true]
  },
  assetClawback(a: Asset | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [AccountImpl(), false] : [asset.clawback, true]
  },
  assetCreator(a: Asset | internal.primitives.StubUint64Compat): readonly [Account, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [AccountImpl(), false] : [asset.creator, true]
  },
}
