import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import { ScratchSlotsContract, SimpleScratchSlotsContract } from './contract.algo'
import { Bytes, Uint64 } from '@algorandfoundation/algorand-typescript'

describe('ScratchSlotsContract', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })
  it('should be able to store data', async () => {
    const contract = ctx.contract.create(ScratchSlotsContract)
    const result = contract.storeData()
    expect(result).toBe(true)

    const scratchSpace = ctx.txn.lastGroup.getScratchSpace()

    expect(scratchSpace[1]).toEqual(Uint64(5))
    expect(scratchSpace[2]).toEqual(Bytes('Hello World'))
  })

  it('should be able to load stored data', async () => {
    const contract = ctx.contract.create(SimpleScratchSlotsContract)
    ctx.txn.createScope([ctx.any.txn.applicationCall({ scratchSpace: [Uint64(0), Uint64(5), Bytes('Hello World')] })]).execute(() => {
      const result = contract.approvalProgram()
      expect(result).toEqual(Uint64(1))
    })
  })
})
