type UInt8Array = arc4.DynamicArray<arc4.Uint8>
type MyAlias = arc4.Uint<128>

import type { Account, Application, Asset } from '@algorandfoundation/algorand-typescript'
import { arc4, assert, clone, gtxn, op, Txn } from '@algorandfoundation/algorand-typescript'

export class AnotherStruct extends arc4.Struct<{
  one: arc4.Uint64
  two: arc4.Str
}> {}

type MyStructAlias = AnotherStruct

export class MyStruct extends arc4.Struct<{
  anotherStruct: AnotherStruct
  anotherStructAlias: MyStructAlias
  three: arc4.Uint128
  four: MyAlias
}> {}

export class SignaturesContract extends arc4.Contract {
  @arc4.abimethod({ onCreate: 'require' })
  create() {
    const appTxn = gtxn.ApplicationCallTxn(0)
    assert(op.Global.currentApplicationId.id !== 0, 'expected global to have app id')
    assert(op.Global.currentApplicationAddress !== op.Global.zeroAddress, 'expected global to have app address')
    assert(appTxn.appId.id === 0, 'expected txn to have 0')
    assert(Txn.applicationId.id === 0, 'expected txn to have 0')
  }

  @arc4.abimethod()
  sink(value: arc4.Str, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
  }

  @arc4.abimethod({ name: 'alias' })
  sink2(value: arc4.Str, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
  }

  @arc4.abimethod()
  withTxn(value: arc4.Str, pay: gtxn.PaymentTxn, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
    assert(pay.groupIndex === 0)
    assert(Txn.groupIndex === 1)
    assert(pay.amount === 123)
  }

  @arc4.abimethod()
  withAsset(value: arc4.Str, asset: Asset, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
    assert(asset.total === 123)
    assert(Txn.assets(0) === asset)
  }

  @arc4.abimethod()
  withApp(value: arc4.Str, app: Application, appId: arc4.Uint64, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
    assert(app.id === appId.native, 'expected app id to match provided app id')
    assert(app.creator === op.Global.creatorAddress, 'expected other app to have same creator')
    const appTxn = gtxn.ApplicationCallTxn(0)
    assert(appTxn.apps(0) === op.Global.currentApplicationId)
    assert(Txn.applications(0) === op.Global.currentApplicationId)
    assert(appTxn.apps(1) === app)
    assert(Txn.applications(1) === app)
  }

  @arc4.abimethod()
  withAcc(value: arc4.Str, acc: Account, arr: UInt8Array) {
    assert(value.native)
    assert(arr.length)
    assert(acc.balance === acc.minBalance + 1234)
    assert(Txn.accounts(0) === Txn.sender)
    assert(Txn.accounts(1) === acc)
  }

  @arc4.abimethod()
  complexSig(struct1: MyStruct, txn: gtxn.PaymentTxn, acc: Account, five: UInt8Array): readonly [MyStructAlias, MyStruct] {
    assert(Txn.numAppArgs === 4)

    // struct
    assert(struct1.anotherStruct.one.native === 1)
    assert(struct1.anotherStruct.two.native === '2')
    assert(struct1.anotherStructAlias.one.native === 1)
    assert(struct1.anotherStructAlias.two.native === '2')
    assert(struct1.three.native === 3n)
    assert(struct1.four.native === 4n)

    // txn
    assert(txn.groupIndex === Txn.groupIndex - 1)

    // acc
    assert(Txn.applicationArgs(2) === new arc4.Uint8(1).bytes) // acc array ref
    assert(acc.balance === acc.minBalance + 1234)
    assert(five[0].native === 5)

    return [clone(struct1.anotherStruct), clone(struct1)]
  }
}
