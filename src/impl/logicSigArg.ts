import type { bytes } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asNumber } from '../util'
import type { StubUint64Compat } from './primitives'

/** @internal */
export const arg = (a: StubUint64Compat): bytes => {
  const index = asNumber(a)
  return lazyContext.value.activeLogicSigArgs[index]
}
