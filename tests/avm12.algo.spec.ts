import { algos } from '@algorandfoundation/algokit-utils'
import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect } from 'vitest'
import { Avm12Contract, ContractV0, ContractV1 } from './artifacts/avm12/contract.algo'
import { createArc4TestFixture } from './test-fixture'

describe('avm12', () => {
  const test = createArc4TestFixture({
    paths: 'tests/artifacts/avm12/contract.algo.ts',
    contracts: {
      Avm12Contract: { funding: algos(1) },
    },
  })

  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test('reject wrong app version', async ({ appClientAvm12Contract }) => {
    await appClientAvm12Contract.send.call({ method: 'testRejectVersion', args: [], extraFee: algos(1) })
    const itxnComposeAlgoContract = ctx.contract.create(Avm12Contract)

    const contractV0App = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(ContractV0, contractV0App.id)

    const spyV0 = new ApplicationSpy(ContractV0)
    spyV0.onBareCall((itxnContext) => {
      if (itxnContext.approvalProgram === contractV0App.approvalProgram) {
        itxnContext.createdApp = contractV0App
      }
    })
    spyV0.on.update((itxnContext) => {
      if (itxnContext.appId === contractV0App) {
        ctx.ledger.patchApplicationData(itxnContext.appId, { application: { version: 1 } })
      }
    })

    const spyV1 = new ApplicationSpy(ContractV1)
    spyV1.on.delete((itxnContext) => {
      expect(itxnContext.rejectVersion).toEqual(2)
    })
    ctx.addApplicationSpy(spyV0)
    ctx.addApplicationSpy(spyV1)
    itxnComposeAlgoContract.testRejectVersion()
  })
})
