import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import type { gtxn } from '@algorandfoundation/algorand-typescript'
import { arc4, Bytes, Global, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { DynamicArray, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect } from 'vitest'
import { toBytes } from '../../src/impl/encoded-types/encoded-types'
import { encodeAddress } from '../../src/impl/reference'
import { AnotherStruct, MyStruct, SignaturesContract } from '../artifacts/arc4-abi-method/contract.algo'
import { getAvmResult } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'

const _FUNDED_ACCOUNT_SPENDING = Uint64(1234)

describe('methodSelector', async () => {
  const ctx = new TestExecutionContext()
  const test = createArc4TestFixture('tests/artifacts/arc4-abi-method/contract.algo.ts', {
    SignaturesContract: {
      deployParams: { createParams: { extraProgramPages: undefined, method: 'create' } },
      funding: new AlgoAmount({ microAlgos: Global.minBalance + _FUNDED_ACCOUNT_SPENDING }),
    },
  })

  afterEach(() => {
    ctx.reset()
  })

  test('app args is correct with simple args', async ({ appClientSignaturesContract: appClient }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()
    const arg1 = new arc4.Str('hello')
    const arg2 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))

    // act
    // ensure same execution in AVM runs without errors
    await getAvmResult({ appClient }, 'sink', 'hello', [1, 2])
    // then run inside emulator
    contract.sink(arg1, arg2)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    expect(appArgs).toEqual([appClient.getABIMethod('sink(string,uint8[])void').getSelector(), arg1.bytes, arg2.bytes])
    expect(appArgs[0]).toEqual(arc4.methodSelector(SignaturesContract.prototype.sink))
  })

  test('app args is correct with alias', async ({ appClientSignaturesContract: appClient }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()
    const arg1 = new arc4.Str('hello')
    const arg2 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))

    // act
    // ensure same execution in AVM runs without errors
    await getAvmResult({ appClient }, 'alias', 'hello', [1, 2])
    // then run inside emulator
    contract.sink2(arg1, arg2)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    expect(appArgs).toEqual([appClient.getABIMethod('alias(string,uint8[])void').getSelector(), arg1.bytes, arg2.bytes])
    expect(appArgs[0]).toEqual(arc4.methodSelector(SignaturesContract.prototype.sink2))
  })

  test('app args is correct with txn', async ({ appClientSignaturesContract: appClient, algorand }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const arg1 = new arc4.Str('hello')
    const arg3 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))
    const localnetCreator = await algorand.account.localNetDispenser()
    const paymentTxn = await algorand.createTransaction.payment({
      sender: localnetCreator,
      receiver: localnetCreator,
      amount: new AlgoAmount({ microAlgo: 123 }),
      signer: algorand.account.getSigner(localnetCreator),
    })

    // act
    await getAvmResult({ appClient }, 'withTxn', 'hello', paymentTxn, [1, 2])
    contract.withTxn(arg1, ctx.any.txn.payment({ amount: Uint64(123) }), arg3)

    // asset
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    expect(appArgs).toEqual([appClient.getABIMethod('withTxn(string,pay,uint8[])void').getSelector(), arg1.bytes, arg3.bytes])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.withTxn))
  })

  test('app args is correct with asset', async ({ appClientSignaturesContract: appClient, algorand }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const arg1 = new arc4.Str('hello')
    const arg3 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))
    const localnetCreator = await algorand.account.localNetDispenser()
    const asaId = (
      await algorand.send.assetCreate({
        sender: localnetCreator,
        total: 123n,
      })
    ).confirmation.assetIndex

    // act
    await getAvmResult({ appClient }, 'withAsset', 'hello', asaId, [1, 2])
    contract.withAsset(arg1, ctx.any.asset({ total: 123 }), arg3)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))

    expect(appArgs).toEqual([
      appClient.getABIMethod('withAsset(string,asset,uint8[])void').getSelector(),
      arg1.bytes,
      Bytes.fromHex('00'),
      arg3.bytes,
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.withAsset))
  })

  test('app args is correct with account', async ({ appClientSignaturesContract: appClient, algorand }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()
    const arg1 = new arc4.Str('hello')
    const arg3 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))

    const account = algorand.account.random()
    await algorand.account.ensureFundedFromEnvironment(account, new AlgoAmount({ microAlgo: _FUNDED_ACCOUNT_SPENDING }))
    //  ensure context has the same account with matching balance
    ctx.any.account({
      address: Bytes(account.publicKey),
      balance: Global.minBalance + _FUNDED_ACCOUNT_SPENDING,
    })

    // act
    contract.withAcc(arg1, ctx.ledger.getAccount(Bytes(account.publicKey)), arg3)
    await getAvmResult({ appClient }, 'withAcc', 'hello', account.publicKey, [1, 2])

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    expect(appArgs).toEqual([
      appClient.getABIMethod('withAcc(string,account,uint8[])void').getSelector(),
      arg1.bytes,
      Bytes.fromHex('01'),
      arg3.bytes,
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.withAcc))
  })

  test('app args is correct with application', async ({ appClientSignaturesContract: appClient, appFactorySignaturesContract }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()
    const arg1 = new arc4.Str('hello')
    const arg4 = new arc4.DynamicArray(new arc4.Uint8(1), new arc4.Uint8(2))

    const selfApp = ctx.ledger.getApplicationForContract(contract)
    const otherApp = await appFactorySignaturesContract.send.create({ method: 'create' })
    const otherAppId = otherApp.appClient.appId
    ctx.any.application({ applicationId: otherAppId })

    // act
    await getAvmResult({ appClient }, 'withApp', 'hello', otherAppId, otherAppId, [1, 2])
    contract.withApp(arg1, ctx.ledger.getApplication(otherAppId), new arc4.Uint64(otherAppId), arg4)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    const appForeignApps = Array(Number(txn.numApps))
      .fill(0)
      .map((_, i) => txn.apps(i))

    expect(appArgs).toEqual([
      appClient.getABIMethod('withApp(string,application,uint64,uint8[])void').getSelector(),
      arg1.bytes,
      Bytes.fromHex('01'), // 0th index is the app being called
      encodingUtil.bigIntToUint8Array(otherAppId, 8), // app id as bytes
      arg4.bytes,
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.withApp))
    expect(appForeignApps.map((a) => a.id)).toEqual([selfApp.id, otherAppId])
  })

  test('app args is correct with complex', async ({ appClientSignaturesContract: appClient, algorand }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const avmAccount = algorand.account.random()
    await algorand.account.ensureFundedFromEnvironment(avmAccount, new AlgoAmount({ microAlgo: _FUNDED_ACCOUNT_SPENDING }))
    //  ensure context has the same account with matching balance
    const account = ctx.any.account({
      address: Bytes(avmAccount.publicKey),
      balance: Global.minBalance + _FUNDED_ACCOUNT_SPENDING,
    })

    const payment = ctx.any.txn.payment()
    const struct = new MyStruct({
      three: new arc4.Uint128(3),
      four: new arc4.Uint128(4),
      anotherStruct: new AnotherStruct({ one: new arc4.Uint64(1), two: new arc4.Str('2') }),
      anotherStructAlias: new AnotherStruct({ one: new arc4.Uint64(1), two: new arc4.Str('2') }),
    })
    const five = new DynamicArray(new arc4.Uint8(5))

    // act
    const result = contract.complexSig(struct, payment, account, five)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))

    expect(appArgs).toEqual([
      appClient
        .getABIMethod(
          'complexSig(((uint64,string),(uint64,string),uint128,uint128),pay,account,uint8[])((uint64,string),((uint64,string),(uint64,string),uint128,uint128))',
        )
        .getSelector(),
      struct.bytes,
      Bytes.fromHex('01'), // 0th index is the sender
      five.bytes,
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.complexSig))
    expect(result[0].bytes).toEqual(struct.anotherStruct.bytes)
    expect(result[1].bytes).toEqual(struct.bytes)
  })

  test('app args is correct with index resource encoding', async ({
    appClientSignaturesContract: appClient,
    algorand,
    appFactorySignaturesContract,
  }) => {
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const localnetCreator = await algorand.account.localNetDispenser()
    const asaId = (
      await algorand.send.assetCreate({
        sender: localnetCreator,
        total: 123n,
      })
    ).confirmation.assetIndex

    const asset = ctx.any.asset({ assetId: asaId, total: 123 })

    const otherApp = await appFactorySignaturesContract.send.create({ method: 'create' })
    const otherAppId = otherApp.appClient.appId
    const otherApplication = ctx.any.application({ applicationId: otherAppId })

    const acc = algorand.account.random()
    await algorand.account.ensureFundedFromEnvironment(acc, new AlgoAmount({ microAlgo: _FUNDED_ACCOUNT_SPENDING }))
    //  ensure context has the same account with matching balance
    const account = ctx.any.account({
      address: Bytes(acc.publicKey),
      balance: Global.minBalance + _FUNDED_ACCOUNT_SPENDING,
    })
    // act
    const result = await getAvmResult({ appClient }, 'echoResourceByIndex', asaId, otherAppId, acc.publicKey)
    contract.echoResourceByIndex(asset, otherApplication, account)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))

    expect(appArgs).toEqual([
      appClient.getABIMethod('echoResourceByIndex(asset,application,account)(uint64,uint64,address)').getSelector(),
      Bytes.fromHex('00'), // asset index
      Bytes.fromHex('01'),
      Bytes.fromHex('01'),
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.echoResourceByIndex))

    expect(result).toEqual([asaId, otherAppId, encodeAddress(acc.publicKey)])
  })

  test('app args is correct with value resource encoding', async ({
    appClientSignaturesContract: appClient,
    algorand,
    appFactorySignaturesContract,
  }) => {
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const localnetCreator = await algorand.account.localNetDispenser()
    const asaId = (
      await algorand.send.assetCreate({
        sender: localnetCreator,
        total: 123n,
      })
    ).confirmation.assetIndex

    const asset = ctx.any.asset({ assetId: asaId, total: 123 })

    const otherApp = await appFactorySignaturesContract.send.create({ method: 'create' })
    const otherAppId = otherApp.appClient.appId
    const otherApplication = ctx.any.application({ applicationId: otherAppId })

    const acc = algorand.account.random()
    await algorand.account.ensureFundedFromEnvironment(acc, new AlgoAmount({ microAlgo: _FUNDED_ACCOUNT_SPENDING }))
    //  ensure context has the same account with matching balance
    const account = ctx.any.account({
      address: Bytes(acc.publicKey),
      balance: Global.minBalance + _FUNDED_ACCOUNT_SPENDING,
    })
    // act
    const result = await getAvmResult({ appClient }, 'echoResourceByValue', asaId, otherAppId, acc.publicKey)
    contract.echoResourceByValue(asset, otherApplication, account)

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))

    expect(appArgs).toEqual([
      appClient.getABIMethod('echoResourceByValue(uint64,uint64,address)(uint64,uint64,address)').getSelector(),
      toBytes(asaId),
      toBytes(otherAppId),
      toBytes(account),
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.echoResourceByValue))

    expect(result).toEqual([asaId, otherAppId, encodeAddress(acc.publicKey)])
  })

  test('prepare txns with complex', async ({ appClientSignaturesContract: appClient, algorand }) => {
    // arrange
    const contract = ctx.contract.create(SignaturesContract)
    contract.create()

    const avmAccount = algorand.account.random()
    await algorand.account.ensureFundedFromEnvironment(avmAccount, new AlgoAmount({ microAlgo: _FUNDED_ACCOUNT_SPENDING }))
    //  ensure context has the same account with matching balance
    const account = ctx.any.account({
      address: Bytes(avmAccount.publicKey),
      balance: Global.minBalance + _FUNDED_ACCOUNT_SPENDING,
    })

    const struct = new MyStruct({
      three: new arc4.Uint128(3),
      four: new arc4.Uint128(4),
      anotherStruct: new AnotherStruct({ one: new arc4.Uint64(1), two: new arc4.Str('2') }),
      anotherStructAlias: new AnotherStruct({ one: new arc4.Uint64(1), two: new arc4.Str('2') }),
    })
    const five = new DynamicArray(new arc4.Uint8(5))

    const deferredAppCall = ctx.txn.deferAppCall(contract, contract.complexSig, 'complexSig', struct, ctx.any.txn.payment(), account, five)
    const localnetCreator = await algorand.account.localNetDispenser()
    const paymentTxn = await algorand.createTransaction.payment({
      sender: localnetCreator,
      receiver: localnetCreator,
      amount: new AlgoAmount({ microAlgo: 123 }),
      signer: algorand.account.getSigner(localnetCreator),
    })

    // # act
    await getAvmResult({ appClient }, 'complexSig', [[1, '2'], [1, '2'], 3, 4], paymentTxn, avmAccount.publicKey, [5])
    ctx.txn.createScope([ctx.any.txn.payment(), deferredAppCall, ctx.any.txn.payment()]).execute(() => {
      const result = deferredAppCall.submit()
      expect(result[0].bytes).toEqual(struct.anotherStruct.bytes)
      expect(result[1].bytes).toEqual(struct.bytes)
    })

    // assert
    const txn = ctx.txn.lastActive as gtxn.ApplicationCallTxn
    const appArgs = Array(Number(txn.numAppArgs))
      .fill(0)
      .map((_, i) => txn.appArgs(i))
    expect(appArgs).toEqual([
      appClient
        .getABIMethod(
          'complexSig(((uint64,string),(uint64,string),uint128,uint128),pay,account,uint8[])((uint64,string),((uint64,string),(uint64,string),uint128,uint128))',
        )
        .getSelector(),
      struct.bytes,
      Bytes.fromHex('01'), // 0th index is the sender
      five.bytes,
    ])
    expect(appArgs[0]).toEqual(methodSelector(SignaturesContract.prototype.complexSig))
  })
})
