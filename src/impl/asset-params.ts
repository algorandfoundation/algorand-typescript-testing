import type { Account as AccountType, Asset as AssetType, bytes, gtxn, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asMaybeUint64Cls, asUint64 } from '../util'
import { Bytes, Uint64, type StubUint64Compat } from './primitives'
import { Account } from './reference'

const resolveAssetIndex = (assetIdOrIndex: StubUint64Compat): uint64 => {
  const input = asUint64(assetIdOrIndex)
  if (input >= 1001) {
    return input
  }
  const txn = lazyContext.activeGroup.activeTransaction as gtxn.ApplicationCallTxn
  return txn.assets(input).id
}

/** @internal */
export const getAsset = (asset: AssetType | StubUint64Compat): AssetType | undefined => {
  try {
    const assetId = asMaybeUint64Cls(asset)
    if (assetId !== undefined) {
      return lazyContext.ledger.getAsset(resolveAssetIndex(assetId))
    }
    return asset as AssetType
  } catch {
    return undefined
  }
}

/** @internal */
export const AssetParams: typeof op.AssetParams = {
  assetTotal(a: AssetType | StubUint64Compat): readonly [uint64, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Uint64(0), false] : [asset.total, true]
  },
  assetDecimals(a: AssetType | StubUint64Compat): readonly [uint64, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Uint64(0), false] : [asset.decimals, true]
  },
  assetDefaultFrozen(a: AssetType | StubUint64Compat): readonly [boolean, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [false, false] : [asset.defaultFrozen, true]
  },
  assetUnitName(a: AssetType | StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.unitName, true]
  },
  assetName(a: AssetType | StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.name, true]
  },
  assetUrl(a: AssetType | StubUint64Compat): readonly [bytes, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes(), false] : [asset.url, true]
  },
  assetMetadataHash(a: AssetType | StubUint64Compat): readonly [bytes<32>, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Bytes() as bytes<32>, false] : [asset.metadataHash, true]
  },
  assetManager(a: AssetType | StubUint64Compat): readonly [AccountType, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Account(), false] : [asset.manager, true]
  },
  assetReserve(a: AssetType | StubUint64Compat): readonly [AccountType, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Account(), false] : [asset.reserve, true]
  },
  assetFreeze(a: AssetType | StubUint64Compat): readonly [AccountType, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Account(), false] : [asset.freeze, true]
  },
  assetClawback(a: AssetType | StubUint64Compat): readonly [AccountType, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Account(), false] : [asset.clawback, true]
  },
  assetCreator(a: AssetType | StubUint64Compat): readonly [AccountType, boolean] {
    const asset = getAsset(a)
    return asset === undefined ? [Account(), false] : [asset.creator, true]
  },
}
