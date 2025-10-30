import { assert, Bytes, TransactionType } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import HelloWorldContract from './contract.algo'

describe('HelloWorldContract', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })
  it('logs the returned value when sayBananas is called', async () => {
    const contract = ctx.contract.create(HelloWorldContract)
    const result = contract.sayBananas()
    assert(ctx.txn.lastActive.type === TransactionType.ApplicationCall, 'Last txn must be app')

    expect(result).toBe('Bananas')
    const bananasBytes = Bytes('Bananas')
    const logs = ctx.exportLogs(ctx.txn.lastActive.appId.id, 's', 'b')
    expect(logs).toStrictEqual([result, bananasBytes])
  })
  it('logs the returned value when sayHello is called', async () => {
    const contract = ctx.contract.create(HelloWorldContract)
    const result = contract.sayHello('John', 'Doe')
    assert(ctx.txn.lastActive.type === TransactionType.ApplicationCall, 'Last txn must be app')

    expect(result).toBe('Hello John Doe')
    const helloBytes = Bytes('Hello John Doe')
    const logs = ctx.exportLogs(ctx.txn.lastActive.appId.id, 's', 'b')
    expect(logs).toStrictEqual([result, helloBytes])
  })
})
