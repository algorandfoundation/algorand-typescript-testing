import type { Asset, gtxn, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, assert, BoxMap, clone, Global, itxn, op, Txn } from '@algorandfoundation/algorand-typescript'

export class ListingKey extends arc4.Struct<{
  owner: arc4.Address
  asset: arc4.UintN64
  nonce: arc4.UintN64
}> {}

export class ListingValue extends arc4.Struct<{
  deposited: arc4.UintN64
  unitaryPrice: arc4.UintN64
  bidder: arc4.Address
  bid: arc4.UintN64
  bidUnitaryPrice: arc4.UintN64
}> {}

export default class DigitalMarketplace extends arc4.Contract {
  listings = BoxMap<ListingKey, ListingValue>({ keyPrefix: 'listings' })

  listingsBoxMbr(): uint64 {
    return (
      2_500 +
      // fmt: off
      // Key length
      (8 +
        32 +
        8 +
        8 +
        // Value length
        8 +
        8 +
        32 +
        8 +
        8) *
        // fmt: on
        400
    )
  }

  quantityPrice(quantity: uint64, price: uint64, assetDecimals: uint64): uint64 {
    const [amountNotScaledHigh, amountNotScaledLow] = op.mulw(price, quantity)
    const [scalingFactorHigh, scalingFactorLow] = op.expw(10, assetDecimals)
    const [_quotientHigh, amountToBePaid, _remainderHigh, _remainderLow] = op.divmodw(
      amountNotScaledHigh,
      amountNotScaledLow,
      scalingFactorHigh,
      scalingFactorLow,
    )
    assert(_quotientHigh === 0)

    return amountToBePaid
  }

  @arc4.abimethod({ readonly: true })
  getListingsMbr(): uint64 {
    return this.listingsBoxMbr()
  }

  @arc4.abimethod()
  allowAsset(mbrPay: gtxn.PaymentTxn, asset: Asset) {
    assert(!Global.currentApplicationAddress.isOptedIn(asset))

    assert(mbrPay.receiver === Global.currentApplicationAddress)
    assert(mbrPay.amount === Global.assetOptInMinBalance)

    itxn
      .assetTransfer({
        xferAsset: asset,
        assetReceiver: Global.currentApplicationAddress,
        assetAmount: 0,
      })
      .submit()
  }

  @arc4.abimethod()
  firstDeposit(mbrPay: gtxn.PaymentTxn, xfer: gtxn.AssetTransferTxn, unitaryPrice: arc4.UintN64, nonce: arc4.UintN64) {
    assert(mbrPay.sender === Txn.sender)
    assert(mbrPay.receiver === Global.currentApplicationAddress)
    assert(mbrPay.amount === this.listingsBoxMbr())

    const key = new ListingKey({
      owner: new arc4.Address(Txn.sender),
      asset: new arc4.UintN64(xfer.xferAsset.id),
      nonce: nonce,
    })
    assert(!this.listings(key).exists)

    assert(xfer.sender === Txn.sender)
    assert(xfer.assetReceiver === Global.currentApplicationAddress)
    assert(xfer.assetAmount > 0)

    this.listings(key).value = new ListingValue({
      deposited: new arc4.UintN64(xfer.assetAmount),
      unitaryPrice: unitaryPrice,
      bidder: new arc4.Address(),
      bid: new arc4.UintN64(),
      bidUnitaryPrice: new arc4.UintN64(),
    })
  }

  @arc4.abimethod()
  deposit(xfer: gtxn.AssetTransferTxn, nonce: arc4.UintN64) {
    const key = new ListingKey({
      owner: new arc4.Address(Txn.sender),
      asset: new arc4.UintN64(xfer.xferAsset.id),
      nonce: nonce,
    })

    assert(xfer.sender === Txn.sender)
    assert(xfer.assetReceiver === Global.currentApplicationAddress)
    assert(xfer.assetAmount > 0)

    const existing = clone(this.listings(key).value)
    this.listings(key).value = new ListingValue({
      bid: existing.bid,
      bidUnitaryPrice: existing.bidUnitaryPrice,
      bidder: existing.bidder,
      unitaryPrice: existing.unitaryPrice,
      deposited: new arc4.UintN64(existing.deposited.native + xfer.assetAmount),
    })
  }

  @arc4.abimethod()
  setPrice(asset: Asset, nonce: arc4.UintN64, unitaryPrice: arc4.UintN64) {
    const key = new ListingKey({
      owner: new arc4.Address(Txn.sender),
      asset: new arc4.UintN64(asset.id),
      nonce: nonce,
    })

    const existing = clone(this.listings(key).value)
    this.listings(key).value = new ListingValue({
      bid: existing.bid,
      bidUnitaryPrice: existing.bidUnitaryPrice,
      bidder: existing.bidder,
      deposited: existing.deposited,
      unitaryPrice: unitaryPrice,
    })
  }

  @arc4.abimethod()
  buy(owner: arc4.Address, asset: Asset, nonce: arc4.UintN64, buyPay: gtxn.PaymentTxn, quantity: uint64) {
    const key = new ListingKey({
      owner: owner,
      asset: new arc4.UintN64(asset.id),
      nonce: nonce,
    })

    const listing = clone(this.listings(key).value)

    const amountToBePaid = this.quantityPrice(quantity, listing.unitaryPrice.native, asset.decimals)

    assert(buyPay.sender === Txn.sender)
    assert(buyPay.receiver.bytes === owner.bytes)
    assert(buyPay.amount === amountToBePaid)

    this.listings(key).value = new ListingValue({
      bid: listing.bid,
      bidUnitaryPrice: listing.bidUnitaryPrice,
      bidder: listing.bidder,
      unitaryPrice: listing.unitaryPrice,
      deposited: new arc4.UintN64(listing.deposited.native - quantity),
    })

    itxn
      .assetTransfer({
        xferAsset: asset,
        assetReceiver: Txn.sender,
        assetAmount: quantity,
      })
      .submit()
  }

  @arc4.abimethod()
  withdraw(asset: Asset, nonce: arc4.UintN64) {
    const key = new ListingKey({
      owner: new arc4.Address(Txn.sender),
      asset: new arc4.UintN64(asset.id),
      nonce: nonce,
    })

    const listing = clone(this.listings(key).value)
    if (listing.bidder !== new arc4.Address()) {
      const currentBidDeposit = this.quantityPrice(listing.bid.native, listing.bidUnitaryPrice.native, asset.decimals)
      itxn.payment({ receiver: listing.bidder.native, amount: currentBidDeposit }).submit()
    }

    this.listings(key).delete()

    itxn.payment({ receiver: Txn.sender, amount: this.listingsBoxMbr() }).submit()

    itxn
      .assetTransfer({
        xferAsset: asset,
        assetReceiver: Txn.sender,
        assetAmount: listing.deposited.native,
      })
      .submit()
  }

  @arc4.abimethod()
  bid(owner: arc4.Address, asset: Asset, nonce: arc4.UintN64, bidPay: gtxn.PaymentTxn, quantity: arc4.UintN64, unitaryPrice: arc4.UintN64) {
    const key = new ListingKey({ owner, asset: new arc4.UintN64(asset.id), nonce })

    const listing = clone(this.listings(key).value)
    if (listing.bidder !== new arc4.Address()) {
      assert(unitaryPrice.native > listing.bidUnitaryPrice.native)

      const currentBidAmount = this.quantityPrice(listing.bid.native, listing.bidUnitaryPrice.native, asset.decimals)

      itxn.payment({ receiver: listing.bidder.native, amount: currentBidAmount }).submit()
    }

    const amountToBeBid = this.quantityPrice(quantity.native, unitaryPrice.native, asset.decimals)

    assert(bidPay.sender === Txn.sender)
    assert(bidPay.receiver === Global.currentApplicationAddress)
    assert(bidPay.amount === amountToBeBid)

    this.listings(key).value = new ListingValue({
      deposited: listing.deposited,
      unitaryPrice: listing.unitaryPrice,
      bidder: new arc4.Address(Txn.sender),
      bid: quantity,
      bidUnitaryPrice: unitaryPrice,
    })
  }

  @arc4.abimethod()
  acceptBid(asset: Asset, nonce: arc4.UintN64) {
    const key = new ListingKey({ owner: new arc4.Address(Txn.sender), asset: new arc4.UintN64(asset.id), nonce })

    const listing = clone(this.listings(key).value)
    assert(listing.bidder !== new arc4.Address())

    const minQuantity = listing.deposited.native < listing.bid.native ? listing.deposited.native : listing.bid.native

    const bestBidAmount = this.quantityPrice(minQuantity, listing.bidUnitaryPrice.native, asset.decimals)

    itxn.payment({ receiver: Txn.sender, amount: bestBidAmount }).submit()

    itxn
      .assetTransfer({
        xferAsset: asset,
        assetReceiver: listing.bidder.native,
        assetAmount: minQuantity,
      })
      .submit()

    this.listings(key).value = new ListingValue({
      bidder: listing.bidder,
      bidUnitaryPrice: listing.bidUnitaryPrice,
      unitaryPrice: listing.unitaryPrice,
      deposited: new arc4.UintN64(listing.deposited.native - minQuantity),
      bid: new arc4.UintN64(listing.bid.native - minQuantity),
    })
  }
}
