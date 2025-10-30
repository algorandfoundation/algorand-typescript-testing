import type { op } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'

/** @internal */
export const onlineStake: typeof op.onlineStake = () => {
  return lazyContext.ledger.onlineStake
}
