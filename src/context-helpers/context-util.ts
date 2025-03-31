import type { uint64 } from '@algorandfoundation/algorand-typescript'
import type { AbiMetadata } from '../abi-metadata'
import { AssertError } from '../errors'
import { ApplicationTransaction } from '../impl/transactions'
import { lazyContext } from './internal-context'

export const checkRoutingConditions = (appId: uint64, metadata: AbiMetadata) => {
  const appData = lazyContext.getApplicationData(appId)
  const isCreating = appData.isCreating
  if (isCreating && metadata.onCreate === 'disallow') {
    throw new AssertError('method can not be called while creating')
  }
  if (!isCreating && metadata.onCreate === 'require') {
    throw new AssertError('method can only be called while creating')
  }
  const txn = lazyContext.activeGroup.activeTransaction
  if (txn instanceof ApplicationTransaction && metadata.allowActions && !metadata.allowActions.includes(txn.onCompletion)) {
    throw new AssertError(`method can only be called with one of the following on_completion values: ${metadata.allowActions.join(', ')}`)
  }
}
