import { Account, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import HashedTimeLockedLogicSig from './signature.algo'

const ZERO_ADDRESS = Bytes.fromBase32('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')

describe('HTLC LogicSig', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('seller receives payment if correct secret is provided', () => {
    const receiverAddress = Bytes.fromBase32('6ZHGHH5Z5CTPCF5WCESXMGRSVK7QJETR63M3NY5FJCUYDHO57VTC')
    ctx.txn
      .createScope([
        ctx.any.txn.payment({
          fee: 500,
          firstValid: 1000,
          closeRemainderTo: Account(ZERO_ADDRESS),
          rekeyTo: Account(ZERO_ADDRESS),
          receiver: Account(receiverAddress),
        }),
      ])
      .execute(() => {
        const result = ctx.executeLogicSig(new HashedTimeLockedLogicSig(), Bytes('secret'))
        expect(result).toBe(true)
      })
  })
})
