import { algo } from '@algorandfoundation/algokit-utils'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { ApplicationSpy } from '../../src/application-spy'
import { TestExecutionContext } from '../../src/test-execution-context'
import { ContractTwo } from '../artifacts/circurlar-reference/circular-reference-2.algo'
import { ContractOne } from '../artifacts/circurlar-reference/circular-reference.algo'
import { createArc4TestFixture } from '../test-fixture'

describe('circular reference', () => {
  const ctx = new TestExecutionContext()
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/circurlar-reference', {
    ContractOne: { funding: algo(1) },
    ContractTwo: { funding: algo(1) },
  })

  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  afterEach(() => {
    ctx.reset()
  })

  test('test call contract one', async ({ appClientContractOne, appClientContractTwo }) => {
    const result = await appClientContractOne.send.call({
      method: 'test',
      args: [appClientContractTwo.appId],
      extraFee: algo(1),
    })
    expect(result.return).toEqual(appClientContractTwo.appId)

    const contractOne = ctx.contract.create(ContractOne)
    const contractTwo = ctx.contract.create(ContractTwo)
    const contractTwoApp = ctx.ledger.getApplicationForContract(contractTwo)

    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector(ContractTwo.prototype.receiver), (itxnContext) => {
      itxnContext.setReturnValue(contractTwoApp.id)
    })
    ctx.addApplicationSpy(spy)

    const output = contractOne.test(contractTwoApp)
    expect(output).toEqual(contractTwoApp.id)
  })

  test('test call contract two', async ({ appClientContractOne, appClientContractTwo }) => {
    const result = await appClientContractTwo.send.call({
      method: 'test',
      args: [appClientContractOne.appId],
      extraFee: algo(1),
    })
    expect(result.return).toEqual(appClientContractOne.appId)

    const contractOne = ctx.contract.create(ContractOne)
    const contractTwo = ctx.contract.create(ContractTwo)
    const contractOneApp = ctx.ledger.getApplicationForContract(contractOne)

    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector(ContractOne.prototype.receiver), (itxnContext) => {
      itxnContext.setReturnValue(contractOneApp.id)
    })
    ctx.addApplicationSpy(spy)

    const output = contractTwo.test(contractOneApp)
    expect(output).toEqual(contractOneApp.id)
  })
})
