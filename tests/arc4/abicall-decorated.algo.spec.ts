import { ApplicationSpy } from '@algorandfoundation/algorand-typescript-testing'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import { TestExecutionContext } from '../../src/test-execution-context'
import { Hello } from '../artifacts/abicall-decorated/contract.algo'
import { DecoratedGreeter } from '../artifacts/abicall-decorated/decorated-greeter.algo'

describe('abicalll polytype ', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test('test call contract one', async () => {
    const greeter = ctx.contract.create(DecoratedGreeter)
    const hello = ctx.contract.create(Hello)

    const greeterApp = ctx.ledger.getApplicationForContract(greeter)

    hello.createApplication(greeterApp)

    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector(DecoratedGreeter.prototype.greet), (itxnContext) => {
      itxnContext.setReturnValue('Hello, World, from Algorand')
    })
    ctx.addApplicationSpy(spy)

    const result = hello.greet()
    expect(result).toEqual('Hello, World, from Algorand')
  })
})
