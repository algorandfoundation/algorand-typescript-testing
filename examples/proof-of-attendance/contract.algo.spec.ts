import { Account, Bytes, op } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it, test } from 'vitest'
import ProofOfAttendance from './contract.algo'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type DeliberateAny = any
const ZERO_ADDRESS = Bytes.fromBase32('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')

describe('ProofOfAttendance', () => {
  const ctx = new TestExecutionContext()

  const getContract = () => {
    const contract = ctx.contract.create(ProofOfAttendance)
    contract.init(ctx.any.uint64(1, 100))
    return contract
  }
  afterEach(() => {
    ctx.reset()
  })

  it('should be able to init', () => {
    // Arrange
    const contract = ctx.contract.create(ProofOfAttendance)
    const maxAttendees = ctx.any.uint64(1, 100)

    // Act
    contract.init(maxAttendees)

    // Assert
    expect(contract.maxAttendees.value).toEqual(maxAttendees)
  })

  test.each([
    ['confirmAttendance', Bytes('')],
    ['confirmAttendanceWithBox', Bytes('')],
    ['confirmAttendanceWithBoxRef', Bytes('')],
    ['confirmAttendanceWithBoxMap', Bytes('boxMap')],
  ])('%s', (confirmAttendance, keyPrefix) => {
    // Arrange
    const contract = getContract()

    // Act
    const confirm = (contract as DeliberateAny)[confirmAttendance]
    confirm()

    // Assert
    const boxContent = ctx.ledger.getBox(contract, keyPrefix.concat(ctx.defaultSender.bytes))
    expect(boxContent).toEqual(op.itob(1001))
  })
  test.each([
    ['claimPoa', Bytes('')],
    ['claimPoaWithBox', Bytes('')],
    ['claimPoaWithBoxRef', Bytes('')],
    ['claimPoaWithBoxMap', Bytes('boxMap')],
  ])('%s', (claimPoa, keyPrefix) => {
    // Arrange
    const contract = getContract()

    const dummyPoa = ctx.any.asset()
    const optInTxn = ctx.any.txn.assetTransfer({
      sender: ctx.defaultSender,
      assetReceiver: ctx.defaultSender,
      assetCloseTo: Account(ZERO_ADDRESS),
      rekeyTo: Account(ZERO_ADDRESS),
      xferAsset: dummyPoa,
      fee: 0,
      assetAmount: 0,
    })
    ctx.ledger.setBox(contract, keyPrefix.concat(ctx.defaultSender.bytes), op.itob(dummyPoa.id))

    // Act
    const claim = (contract as DeliberateAny)[claimPoa]
    claim(optInTxn)

    // Assert
    const axferItxn = ctx.txn.lastGroup.getItxnGroup().getAssetTransferInnerTxn(0)
    expect(axferItxn.assetReceiver).toEqual(ctx.defaultSender)
    expect(axferItxn.assetAmount).toEqual(1)
  })
})
