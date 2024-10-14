import { bytes, internal, uint64 } from '@algorandfoundation/algo-ts'
import { lazyContext } from '../context-helpers/internal-context'
import { itob } from './pure'
import { asUint64 } from '../util'

export const Block: internal.opTypes.BlockType = {
  blkSeed: function (a: internal.primitives.StubUint64Compat): bytes {
    return itob(lazyContext.ledger.getBlockContent(a).seed)
  },
  blkTimestamp: function (a: internal.primitives.StubUint64Compat): uint64 {
    return asUint64(lazyContext.ledger.getBlockContent(a).timestamp)
  },
}
