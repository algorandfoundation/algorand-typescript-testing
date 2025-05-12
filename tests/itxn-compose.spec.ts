import { algos } from '@algorandfoundation/algokit-utils'
import { Bytes, TransactionType } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Address } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { ItxnComposeAlgo, VerifierContract } from './artifacts/itxn-compose/contract.algo'
import { createArc4TestFixture } from './test-fixture'

describe('itxn compose', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/itxn-compose/contract.algo.ts', {
    ItxnComposeAlgo: { funding: algos(5) },
    VerifierContract: {},
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })
  afterEach(() => {
    ctx.reset()
  })

  test('should compose transactions', async ({ algorand, localnet, testAccount, appClientVerifierContract, appClientItxnComposeAlgo }) => {
    const testAccounts = [
      await localnet.context.generateAccount({ initialFunds: algos(1) }),
      await localnet.context.generateAccount({ initialFunds: algos(1) }),
      await localnet.context.generateAccount({ initialFunds: algos(1) }),
    ]

    const pay = algorand.createTransaction.payment({
      sender: testAccount.addr,
      amount: algos(9),
      receiver: appClientItxnComposeAlgo.appAddress,
    })

    await appClientItxnComposeAlgo.send.call({
      method: 'distribute',
      args: [testAccounts.map((a) => a.addr.publicKey), pay, appClientVerifierContract.appId],
      extraFee: algos(1),
    })

    const itxnComposeAlgoContract = ctx.contract.create(ItxnComposeAlgo)
    const verifierContract = ctx.contract.create(VerifierContract)

    itxnComposeAlgoContract.distribute(
      testAccounts.map((a) => new Address(Bytes(a.addr.publicKey))),
      ctx.any.txn.payment({ amount: 9, receiver: ctx.ledger.getApplicationForContract(itxnComposeAlgoContract).address }),
      ctx.ledger.getApplicationForContract(verifierContract),
    )

    const itxns = ctx.txn.lastGroup.getItxnGroup().itxns
    expect(itxns.length).toBe(5)
    expect(itxns[0].type).toBe(TransactionType.Payment)
    expect(itxns[1].type).toBe(TransactionType.Payment)
    expect(itxns[2].type).toBe(TransactionType.Payment)
    expect(itxns[3].type).toBe(TransactionType.ApplicationCall)
    expect(itxns[4].type).toBe(TransactionType.AssetConfig)
  })

  test('should compose app call transactions ', async ({ appClientItxnComposeAlgo }) => {
    await appClientItxnComposeAlgo.send.call({
      method: 'conditionalBegin',
      args: [4],
      extraFee: algos(1),
    })

    const itxnComposeAlgoContract = ctx.contract.create(ItxnComposeAlgo)
    itxnComposeAlgoContract.conditionalBegin(4)
    const itxns = ctx.txn.lastGroup.getItxnGroup().itxns
    expect(itxns.length).toBe(4)
    expect(itxns[0].type).toBe(TransactionType.ApplicationCall)
    expect(itxns[1].type).toBe(TransactionType.ApplicationCall)
    expect(itxns[2].type).toBe(TransactionType.ApplicationCall)
    expect(itxns[3].type).toBe(TransactionType.ApplicationCall)
  })
})
