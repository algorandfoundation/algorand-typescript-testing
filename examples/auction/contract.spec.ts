import { OnCompleteAction, TransactionType } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import { Auction } from './contract.algo'

describe('Auction', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  it('should be able to opt into an asset', () => {
    // Arrange
    const asset = ctx.any.asset()
    const contract = ctx.contract.create(Auction)
    contract.createApplication()

    // Act
    contract.optIntoAsset(asset)

    // Assert
    expect(contract.asa.value.id).toEqual(asset.id)
    const innerTxn = ctx.txn.lastGroup.lastItxnGroup().getAssetTransferInnerTxn()

    expect(innerTxn.assetReceiver, 'Asset receiver does not match').toEqual(ctx.ledger.getApplicationForContract(contract).address)

    expect(innerTxn.xferAsset, 'Transferred asset does not match').toEqual(asset)
  })

  it('should be able to start an auction', () => {
    // Arrange
    const contract = ctx.contract.create(Auction)
    contract.createApplication()

    const app = ctx.ledger.getApplicationForContract(contract)

    const latestTimestamp = ctx.any.uint64(1, 1000)
    const startingPrice = ctx.any.uint64()
    const auctionDuration = ctx.any.uint64(100, 1000)
    const axferTxn = ctx.any.txn.assetTransfer({
      assetReceiver: app.address,
      assetAmount: startingPrice,
    })
    contract.asaAmt.value = startingPrice
    ctx.ledger.patchGlobalData({
      latestTimestamp: latestTimestamp,
    })

    // Act
    contract.startAuction(startingPrice, auctionDuration, axferTxn)

    // Assert
    expect(contract.auctionEnd.value).toEqual(latestTimestamp + auctionDuration)
    expect(contract.previousBid.value).toEqual(startingPrice)
    expect(contract.asaAmt.value).toEqual(startingPrice)
  })

  it('should be able to bid', () => {
    // Arrange
    const account = ctx.defaultSender
    const auctionEnd = ctx.any.uint64(Date.now() + 10_000)
    const previousBid = ctx.any.uint64(1, 100)
    const payAmount = ctx.any.uint64()

    const contract = ctx.contract.create(Auction)
    contract.createApplication()
    contract.auctionEnd.value = auctionEnd
    contract.previousBid.value = previousBid
    const pay = ctx.any.txn.payment({ sender: account, amount: payAmount })

    // Act
    contract.bid(pay)

    // Assert
    expect(contract.previousBid.value).toEqual(payAmount)
    expect(contract.previousBidder.value).toEqual(account)
    expect(contract.claimableAmount(account).value).toEqual(payAmount)
  })

  it('should be able to claim bids', () => {
    // Arrange
    const account = ctx.any.account()
    const contract = ctx.contract.create(Auction)
    contract.createApplication()

    const claimableAmount = ctx.any.uint64()
    contract.claimableAmount(account).value = claimableAmount

    contract.previousBidder.value = account
    const previousBid = ctx.any.uint64(undefined, claimableAmount)
    contract.previousBid.value = previousBid

    // Act
    ctx.txn.createScope([ctx.any.txn.applicationCall({ sender: account })]).execute(() => {
      contract.claimBids()
    })

    //  Assert
    const expectedPayment = claimableAmount - previousBid
    const lastInnerTxn = ctx.txn.lastGroup.lastItxnGroup().getPaymentInnerTxn()

    expect(lastInnerTxn.amount).toEqual(expectedPayment)
    expect(lastInnerTxn.receiver).toEqual(account)
    expect(contract.claimableAmount(account).value).toEqual(claimableAmount - expectedPayment)
  })

  it('should be able to claim asset', () => {
    // Arrange
    ctx.ledger.patchGlobalData({ latestTimestamp: ctx.any.uint64() })
    const contract = ctx.contract.create(Auction)
    contract.createApplication()

    contract.auctionEnd.value = ctx.any.uint64(1, 100)
    contract.previousBidder.value = ctx.defaultSender
    const asaAmount = ctx.any.uint64(1000, 2000)
    contract.asaAmt.value = asaAmount
    const asset = ctx.any.asset()

    // Act
    contract.claimAsset(asset)

    // Assert
    const lastInnerTxn = ctx.txn.lastGroup.lastItxnGroup().getAssetTransferInnerTxn()
    expect(lastInnerTxn.xferAsset).toEqual(asset)
    expect(lastInnerTxn.assetCloseTo).toEqual(ctx.defaultSender)
    expect(lastInnerTxn.assetReceiver).toEqual(ctx.defaultSender)
    expect(lastInnerTxn.assetAmount).toEqual(asaAmount)
  })

  it('should be able to delete application', () => {
    // Arrange
    const account = ctx.any.account()

    // Act
    // setting sender will determine creator
    let contract
    ctx.txn.createScope([ctx.any.txn.applicationCall({ sender: account })]).execute(() => {
      contract = ctx.contract.create(Auction)
      contract.createApplication()
    })

    ctx.txn.createScope([ctx.any.txn.applicationCall({ onCompletion: OnCompleteAction.DeleteApplication })]).execute(() => {
      contract!.deleteApplication()
    })

    // Assert
    const innerTransactions = ctx.txn.lastGroup.lastItxnGroup().getPaymentInnerTxn()
    expect(innerTransactions).toBeTruthy()
    expect(innerTransactions.type).toEqual(TransactionType.Payment)
    expect(innerTransactions.receiver).toEqual(account)
    expect(innerTransactions.closeRemainderTo).toEqual(account)
  })

  it('should be able to call clear state program', () => {
    const contract = ctx.contract.create(Auction)
    contract.createApplication()

    expect(contract.clearStateProgram()).toBeTruthy()
  })
})
