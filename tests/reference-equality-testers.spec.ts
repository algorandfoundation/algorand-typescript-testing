import { afterEach, describe, expect, it } from 'vitest'
import { Account, Application, Asset } from '../src/impl/reference'
import { TestExecutionContext } from '../src/test-execution-context'

describe('Reference equality testers', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  it('test account equality', () => {
    const account1 = ctx.any.account()
    const account2 = ctx.any.account()

    expect(account1).not.toEqual(account2)

    const sameAddr = Account(account1.bytes)
    expect(account1).toEqual(sameAddr)
  })

  it('test application equality', () => {
    const app1 = ctx.any.application()
    const app2 = ctx.any.application()

    expect(app1).not.toEqual(app2)

    const sameId = Application(app1.id)
    expect(app1).toEqual(sameId)
  })

  it('test asset equality', () => {
    const asset1 = ctx.any.asset()
    const asset2 = ctx.any.asset()

    expect(asset1).not.toEqual(asset2)

    const sameId = Asset(asset1.id)
    expect(asset1).toEqual(sameId)
  })
})
