import { Uint64 } from '@algorandfoundation/algorand-typescript'
import { AssertError, AvmError, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import MyContract from './contract.algo'

describe('Calculator', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })
  describe('when calling with with no args', () => {
    it('errors', async () => {
      const contract = ctx.contract.create(MyContract)
      ctx.txn
        .createScope([
          ctx.any.txn.applicationCall({
            appId: contract,
            appArgs: [],
          }),
        ])
        .execute(() => {
          expect(() => contract.approvalProgram()).toThrowError(new AvmError('ERR:Unknown operation'))
          const logs = ctx.txn.activeGroup.getApplicationCallTransaction().appLogs
          expect(logs.length).toBe(3)
          expect(logs[2].toString()).toEqual('ERR:Unknown operation')
        })
    })
  })

  describe('when calling with with two args', () => {
    it('errors', async () => {
      const contract = ctx.contract.create(MyContract)
      ctx.txn
        .createScope([
          ctx.any.txn.applicationCall({
            appId: contract,
            appArgs: [Uint64(1), Uint64(2)],
          }),
        ])
        .execute(() => {
          expect(() => contract.approvalProgram()).toThrowError(new AssertError('ERR:Expected 3 args'))
          const logs = ctx.txn.activeGroup.getApplicationCallTransaction().appLogs
          expect(logs.length).toBe(1)
          expect(logs[0].toString()).toEqual('ERR:Expected 3 args')
        })
    })
  })
  describe('when calling with with three args', () => {
    it('Returns 1', async () => {
      const contract = ctx.contract.create(MyContract)
      const application = ctx.ledger.getApplicationForContract(contract)
      const result = ctx.txn
        .createScope([
          ctx.any.txn.applicationCall({
            appId: application,
            appArgs: [Uint64(1), Uint64(2), Uint64(3)],
          }),
        ])
        .execute(contract.approvalProgram)

      const [left, right, outcome] = ctx.exportLogs(application.id, 'i', 'i', 's')

      expect(left).toEqual(Uint64(2))
      expect(right).toEqual(3n)
      expect(outcome).toBe('2 + 3 = 5')
      expect(result).toBe(true)
    })
  })
})
