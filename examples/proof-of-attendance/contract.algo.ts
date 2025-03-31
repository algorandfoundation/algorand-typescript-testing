import type { Account, Asset, bytes, gtxn, uint64 } from '@algorandfoundation/algorand-typescript'
import {
  arc4,
  assert,
  Box,
  BoxMap,
  BoxRef,
  Bytes,
  ensureBudget,
  Global,
  GlobalState,
  itxn,
  op,
  OpUpFeeSource,
  Txn,
  Uint64,
} from '@algorandfoundation/algorand-typescript'

export default class ProofOfAttendance extends arc4.Contract {
  maxAttendees = GlobalState({ initialValue: Uint64(30) })
  assetUrl = GlobalState({ initialValue: 'ipfs://QmW5vERkgeJJtSY1YQdcWU6gsHCZCyLFtM1oT9uyy2WGm8' })
  totalAttendees = GlobalState({ initialValue: Uint64(0) })
  boxMap = BoxMap<bytes, uint64>({ keyPrefix: 'boxMap' })

  @arc4.abimethod({ onCreate: 'require' })
  init(maxAttendees: uint64) {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can initialize')
    this.maxAttendees.value = maxAttendees
  }

  @arc4.abimethod()
  confirmAttendance() {
    assert(this.totalAttendees.value < this.maxAttendees.value, 'Max attendees reached')

    const mintedAsset = this.mintPoa(Txn.sender)
    this.totalAttendees.value += 1

    const [_id, hasClaimed] = op.Box.get(Txn.sender.bytes)
    assert(!hasClaimed, 'Already claimed POA')

    op.Box.put(Txn.sender.bytes, op.itob(mintedAsset.id))
  }

  @arc4.abimethod()
  confirmAttendanceWithBox() {
    assert(this.totalAttendees.value < this.maxAttendees.value, 'Max attendees reached')

    const mintedAsset = this.mintPoa(Txn.sender)
    this.totalAttendees.value += 1

    const box = Box<uint64>({ key: Txn.sender.bytes })
    const hasClaimed = box.exists
    assert(!hasClaimed, 'Already claimed POA')

    box.value = mintedAsset.id
  }

  @arc4.abimethod()
  confirmAttendanceWithBoxRef() {
    assert(this.totalAttendees.value < this.maxAttendees.value, 'Max attendees reached')

    const mintedAsset = this.mintPoa(Txn.sender)
    this.totalAttendees.value += 1

    const boxRef = BoxRef({ key: Txn.sender.bytes })
    const hasClaimed = boxRef.exists
    assert(!hasClaimed, 'Already claimed POA')

    boxRef.put(op.itob(mintedAsset.id))
  }

  @arc4.abimethod()
  confirmAttendanceWithBoxMap() {
    assert(this.totalAttendees.value < this.maxAttendees.value, 'Max attendees reached')

    const mintedAsset = this.mintPoa(Txn.sender)
    this.totalAttendees.value += 1

    const hasClaimed = this.boxMap(Txn.sender.bytes).exists
    assert(!hasClaimed, 'Already claimed POA')

    this.boxMap(Txn.sender.bytes).value = mintedAsset.id
  }
  @arc4.abimethod({ readonly: true })
  getPoaId(): uint64 {
    const [poaId, exists] = op.Box.get(Txn.sender.bytes)
    assert(exists, 'POA not found')
    return op.btoi(poaId)
  }

  @arc4.abimethod({ readonly: true })
  getPoaIdWithBox(): uint64 {
    const box = Box<uint64>({ key: Txn.sender.bytes })
    const [poaId, exists] = box.maybe()
    assert(exists, 'POA not found')
    return poaId
  }

  @arc4.abimethod({ readonly: true })
  getPoaIdWithBoxRef(): uint64 {
    const boxRef = BoxRef({ key: Txn.sender.bytes })
    const [poaId, exists] = boxRef.maybe()
    assert(exists, 'POA not found')
    return op.btoi(poaId)
  }

  @arc4.abimethod({ readonly: true })
  getPoaIdWithBoxMap(): uint64 {
    const [poaId, exists] = this.boxMap(Txn.sender.bytes).maybe()
    assert(exists, 'POA not found')
    return poaId
  }

  @arc4.abimethod()
  claimPoa(optInTxn: gtxn.AssetTransferTxn) {
    const [poaId, exists] = op.Box.get(Txn.sender.bytes)
    assert(exists, 'POA not found, attendance validation failed!')
    assert(optInTxn.xferAsset.id === op.btoi(poaId), 'POA ID mismatch')
    assert(optInTxn.fee === 0, 'We got you covered for free!')
    assert(optInTxn.assetAmount === 0)
    assert(
      optInTxn.sender === optInTxn.assetReceiver && optInTxn.assetReceiver === Txn.sender,
      'Opt-in transaction sender and receiver must be the same',
    )
    assert(
      optInTxn.assetCloseTo === optInTxn.rekeyTo && optInTxn.rekeyTo === Global.zeroAddress,
      'Opt-in transaction close to must be zero address',
    )

    this.sendPoa(Txn.sender, optInTxn.xferAsset)
  }

  @arc4.abimethod()
  claimPoaWithBox(optInTxn: gtxn.AssetTransferTxn) {
    const box = Box<uint64>({ key: Txn.sender.bytes })
    const [poaId, exists] = box.maybe()
    assert(exists, 'POA not found, attendance validation failed!')
    assert(optInTxn.xferAsset.id === poaId, 'POA ID mismatch')
    assert(optInTxn.fee === 0, 'We got you covered for free!')
    assert(optInTxn.assetAmount === 0)
    assert(
      optInTxn.sender === optInTxn.assetReceiver && optInTxn.assetReceiver === Txn.sender,
      'Opt-in transaction sender and receiver must be the same',
    )
    assert(
      optInTxn.assetCloseTo === optInTxn.rekeyTo && optInTxn.rekeyTo === Global.zeroAddress,
      'Opt-in transaction close to must be zero address',
    )

    this.sendPoa(Txn.sender, optInTxn.xferAsset)
  }

  @arc4.abimethod()
  claimPoaWithBoxRef(optInTxn: gtxn.AssetTransferTxn) {
    const boxRef = BoxRef({ key: Txn.sender.bytes })
    const [poaId, exists] = boxRef.maybe()
    assert(exists, 'POA not found, attendance validation failed!')
    assert(optInTxn.xferAsset.id === op.btoi(poaId), 'POA ID mismatch')
    assert(optInTxn.fee === 0, 'We got you covered for free!')
    assert(optInTxn.assetAmount === 0)
    assert(
      optInTxn.sender === optInTxn.assetReceiver && optInTxn.assetReceiver === Txn.sender,
      'Opt-in transaction sender and receiver must be the same',
    )
    assert(
      optInTxn.assetCloseTo === optInTxn.rekeyTo && optInTxn.rekeyTo === Global.zeroAddress,
      'Opt-in transaction close to must be zero address',
    )

    this.sendPoa(Txn.sender, optInTxn.xferAsset)
  }

  @arc4.abimethod()
  claimPoaWithBoxMap(optInTxn: gtxn.AssetTransferTxn) {
    const [poaId, exists] = this.boxMap(Txn.sender.bytes).maybe()
    assert(exists, 'POA not found, attendance validation failed!')
    assert(optInTxn.xferAsset.id === poaId, 'POA ID mismatch')
    assert(optInTxn.fee === 0, 'We got you covered for free!')
    assert(optInTxn.assetAmount === 0)
    assert(
      optInTxn.sender === optInTxn.assetReceiver && optInTxn.assetReceiver === Txn.sender,
      'Opt-in transaction sender and receiver must be the same',
    )
    assert(
      optInTxn.assetCloseTo === optInTxn.rekeyTo && optInTxn.rekeyTo === Global.zeroAddress,
      'Opt-in transaction close to must be zero address',
    )

    this.sendPoa(Txn.sender, optInTxn.xferAsset)
  }

  private mintPoa(claimer: Account): Asset {
    ensureBudget(10000, OpUpFeeSource.AppAccount)
    const assetName = Bytes('AlgoKit POA #').concat(op.itob(this.totalAttendees.value))
    return itxn
      .assetConfig({
        assetName: assetName,
        unitName: 'POA',
        total: 1,
        decimals: 0,
        url: this.assetUrl.value,
        manager: claimer,
      })
      .submit().createdAsset
  }

  private sendPoa(receiver: Account, asset: Asset) {
    itxn
      .assetTransfer({
        xferAsset: asset,
        sender: Global.currentApplicationAddress,
        assetReceiver: receiver,
        assetAmount: 1,
      })
      .submit()
  }
}
