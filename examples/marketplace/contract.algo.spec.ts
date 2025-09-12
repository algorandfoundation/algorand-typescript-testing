import { arc4, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { interpretAsArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import DigitalMarketplace, { ListingKey, ListingValue } from './contract.algo'

const TEST_DECIMALS = 6

describe('DigitalMarketplace', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test('first deposit', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()

    // Arrange
    const testApp = ctx.ledger.getApplicationForContract(contract)

    // Act
    contract.firstDeposit(
      ctx.any.txn.payment({ receiver: testApp.address, amount: 50500 }),
      ctx.any.txn.assetTransfer({
        xferAsset: testAsset,
        assetReceiver: testApp.address,
        assetAmount: 10,
      }),
      ctx.any.arc4.uint64(),
      testNonce,
    )

    // Assert
    const listingKey = new ListingKey({
      owner: new arc4.Address(ctx.defaultSender),
      asset: new arc4.Uint64(testAsset.id),
      nonce: testNonce,
    })
    const listingValue = interpretAsArc4<ListingValue>(Bytes(ctx.ledger.getBox(contract, Bytes('listings').concat(listingKey.bytes))))
    expect(listingValue.deposited.asUint64()).toEqual(10)
  })

  test('deposit', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()

    // Arrange
    const testApp = ctx.ledger.getApplicationForContract(contract)
    const listingKey = new ListingKey({
      owner: new arc4.Address(ctx.defaultSender),
      asset: new arc4.Uint64(testAsset.id),
      nonce: testNonce,
    })
    contract.listings(listingKey).value = new ListingValue({
      deposited: new arc4.Uint64(10),
      unitaryPrice: new arc4.Uint64(10),
      bidder: new arc4.Address(ctx.defaultSender),
      bid: new arc4.Uint64(10),
      bidUnitaryPrice: new arc4.Uint64(10),
    })

    // Act
    contract.deposit(
      ctx.any.txn.assetTransfer({
        xferAsset: testAsset,
        assetReceiver: testApp.address,
        assetAmount: 10,
      }),
      testNonce,
    )

    // Assert
    expect(ctx.ledger.boxExists(contract, Bytes('listings').concat(listingKey.bytes)))
  })

  test('setPrice', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()
    // Arrange
    const testUnitaryPrice = ctx.any.arc4.uint64()
    const listingKey = new ListingKey({
      owner: new arc4.Address(ctx.defaultSender),
      asset: new arc4.Uint64(testAsset.id),
      nonce: testNonce,
    })
    contract.listings(listingKey).value = new ListingValue({
      deposited: new arc4.Uint64(10),
      unitaryPrice: new arc4.Uint64(10),
      bidder: new arc4.Address(ctx.defaultSender),
      bid: new arc4.Uint64(10),
      bidUnitaryPrice: new arc4.Uint64(10),
    })

    //  Act
    contract.setPrice(testAsset, testNonce, testUnitaryPrice)

    // Assert
    const updatedListing = interpretAsArc4<ListingValue>(Bytes(ctx.ledger.getBox(contract, Bytes('listings').concat(listingKey.bytes))))
    expect(updatedListing.unitaryPrice.asUint64()).toEqual(testUnitaryPrice.asUint64())
  })

  test('buy', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()
    // Arrange
    const testOwner = new arc4.Address(ctx.defaultSender)
    const testUnitaryPrice = ctx.any.arc4.uint64(0, 10000000n)
    const initialDeposit = ctx.any.arc4.uint64()
    const testBuyQuantity = ctx.any.arc4.uint64(0, 1000000n)

    const listingKey = new ListingKey({ owner: testOwner, asset: new arc4.Uint64(testAsset.id), nonce: testNonce })
    contract.listings(listingKey).value = new ListingValue({
      deposited: initialDeposit,
      unitaryPrice: testUnitaryPrice,
      bidder: new arc4.Address(),
      bid: new arc4.Uint64(0),
      bidUnitaryPrice: new arc4.Uint64(0),
    })

    // Act
    contract.buy(
      testOwner,
      testAsset,
      testNonce,
      ctx.any.txn.payment({
        receiver: ctx.defaultSender,
        amount: contract.quantityPrice(testBuyQuantity.asUint64(), testUnitaryPrice.asUint64(), testAsset.decimals),
      }),
      testBuyQuantity.asUint64(),
    )

    // Assert
    const updatedListing = interpretAsArc4<ListingValue>(Bytes(ctx.ledger.getBox(contract, Bytes('listings').concat(listingKey.bytes))))
    expect(updatedListing.deposited.asUint64()).toEqual(initialDeposit.asUint64() - testBuyQuantity.asUint64())
    expect(ctx.txn.lastGroup.getItxnGroup(0).getAssetTransferInnerTxn(0).assetReceiver).toEqual(ctx.defaultSender)
  })

  test('withdraw', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()

    // Arrange
    const testOwner = new arc4.Address(ctx.defaultSender)
    const initialDeposit = ctx.any.arc4.uint64(1)
    const testUnitaryPrice = ctx.any.arc4.uint64()

    const listingsBoxMbr = contract.listingsBoxMbr()

    const listingKey = new ListingKey({ owner: testOwner, asset: new arc4.Uint64(testAsset.id), nonce: testNonce })
    contract.listings(listingKey).value = new ListingValue({
      deposited: initialDeposit,
      unitaryPrice: testUnitaryPrice,
      bidder: new arc4.Address(),
      bid: new arc4.Uint64(0),
      bidUnitaryPrice: new arc4.Uint64(0),
    })

    //  Act
    contract.withdraw(testAsset, testNonce)

    // Assert
    expect(ctx.ledger.boxExists(contract, Bytes('listings').concat(listingKey.bytes))).toEqual(false)
    expect(ctx.txn.lastGroup.itxnGroups.length).toEqual(2)

    const paymentTxn = ctx.txn.lastGroup.getItxnGroup(0).getPaymentInnerTxn(0)
    expect(paymentTxn.receiver).toEqual(testOwner.native)
    expect(paymentTxn.amount).toEqual(listingsBoxMbr)

    const assetTransferTxn = ctx.txn.lastGroup.getItxnGroup(1).getAssetTransferInnerTxn(0)
    expect(assetTransferTxn.xferAsset).toEqual(testAsset)
    expect(assetTransferTxn.assetReceiver).toEqual(testOwner.native)
    expect(assetTransferTxn.assetAmount).toEqual(initialDeposit.asUint64())
  })

  test('bid', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()

    // Arrange
    const app = ctx.ledger.getApplicationForContract(contract)
    const owner = new arc4.Address(ctx.defaultSender)
    const initialPrice = ctx.any.arc4.uint64(0, 10000000n)
    const initialDeposit = ctx.any.arc4.uint64(0, 1000000n)

    const listingKey = new ListingKey({ owner, asset: new arc4.Uint64(testAsset.id), nonce: testNonce })
    contract.listings(listingKey).value = new ListingValue({
      deposited: initialDeposit,
      unitaryPrice: initialPrice,
      bidder: new arc4.Address(),
      bid: new arc4.Uint64(0),
      bidUnitaryPrice: new arc4.Uint64(0),
    })

    const bidder = ctx.any.account()
    const bidQuantity = ctx.any.arc4.uint64(0, BigInt(initialDeposit.asUint64()))
    const bidPrice = ctx.any.arc4.uint64(initialPrice.asUint64() + 1, 10000000n)
    const bidAmount = contract.quantityPrice(bidQuantity.asUint64(), bidPrice.asUint64(), testAsset.decimals)

    // Act
    ctx.txn.createScope([ctx.any.txn.applicationCall({ appId: app, sender: bidder })]).execute(() => {
      contract.bid(
        owner,
        testAsset,
        testNonce,
        ctx.any.txn.payment({
          sender: bidder,
          receiver: app.address,
          amount: bidAmount,
        }),
        bidQuantity,
        bidPrice,
      )
    })

    // Assert
    const updatedListing = contract.listings(listingKey).value
    expect(updatedListing.bidder.native).toEqual(bidder)
    expect(updatedListing.bid.asUint64()).toEqual(bidQuantity.asUint64())
    expect(updatedListing.bidUnitaryPrice.asUint64()).toEqual(bidPrice.asUint64())
  })

  test('acceptBid', () => {
    const contract = ctx.contract.create(DigitalMarketplace)
    const testAsset = ctx.any.asset({ decimals: TEST_DECIMALS })
    const testNonce = ctx.any.arc4.uint64()
    // Arrange
    const owner = ctx.defaultSender
    const initialDeposit = ctx.any.arc4.uint64(1, 10000000n)
    const bidQuantity = ctx.any.arc4.uint64(0, BigInt(initialDeposit.asUint64()))
    const bidPrice = ctx.any.arc4.uint64(0, 10000000n)
    const bidder = ctx.any.account()

    const listingKey = new ListingKey({
      owner: new arc4.Address(owner),
      asset: new arc4.Uint64(testAsset.id),
      nonce: testNonce,
    })
    contract.listings(listingKey).value = new ListingValue({
      deposited: initialDeposit,
      unitaryPrice: ctx.any.arc4.uint64(),
      bidder: new arc4.Address(bidder),
      bid: bidQuantity,
      bidUnitaryPrice: bidPrice,
    })

    const minQuantity = initialDeposit.asUint64() < bidQuantity.asUint64() ? initialDeposit.asUint64() : bidQuantity.asUint64()
    const expectedPayment = contract.quantityPrice(minQuantity, bidPrice.asUint64(), testAsset.decimals)

    // Act
    contract.acceptBid(testAsset, testNonce)

    // Assert
    const updatedListing = contract.listings(listingKey).value
    expect(updatedListing.deposited.asUint64()).toEqual(initialDeposit.asUint64() - minQuantity)

    expect(ctx.txn.lastGroup.itxnGroups.length).toEqual(2)

    const paymentTxn = ctx.txn.lastGroup.getItxnGroup(0).getPaymentInnerTxn(0)
    expect(paymentTxn.receiver).toEqual(owner)
    expect(paymentTxn.amount).toEqual(expectedPayment)

    const assetTransferTxn = ctx.txn.lastGroup.getItxnGroup(1).getAssetTransferInnerTxn(0)
    expect(assetTransferTxn.xferAsset).toEqual(testAsset)
    expect(assetTransferTxn.assetReceiver).toEqual(bidder)
    expect(assetTransferTxn.assetAmount).toEqual(minQuantity)
  })
})
