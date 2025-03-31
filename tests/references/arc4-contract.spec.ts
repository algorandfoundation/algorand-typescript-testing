import type { Account, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, assert, BaseContract, Bytes, contract, Contract, Global, Txn, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import { lazyContext } from '../../src/context-helpers/internal-context'

class ContractTxnInit extends BaseContract {
  arg1: bytes
  creator: Account

  constructor() {
    super()
    this.arg1 = Txn.numAppArgs > 0 ? Txn.applicationArgs(0) : Bytes()
    this.creator = Txn.sender
  }

  approvalProgram(): boolean {
    return true
  }

  clearStateProgram(): boolean {
    return true
  }
}

@contract({ stateTotals: { globalBytes: 4, globalUints: 5, localBytes: 6, localUints: 7 } })
class ContractARC4Create extends Contract {
  creator: Account
  #name: string
  #scratchSlots: uint64
  #stateTotals: uint64
  arg1: uint64 | undefined

  constructor() {
    super()
    this.creator = Txn.sender
    this.#name = 'name'
    this.#scratchSlots = Uint64()
    this.#stateTotals = Uint64()
  }

  @arc4.abimethod({ onCreate: 'require' })
  create(val: uint64): void {
    this.arg1 = val
    assert(Global.currentApplicationId.globalNumBytes === 4)
    assert(Global.currentApplicationId.globalNumUint === 5)
    assert(Global.currentApplicationId.localNumBytes === 6)
    assert(Global.currentApplicationId.localNumUint === 7)
    assert(this.#name === 'name')
    assert(this.#scratchSlots === 0)
    assert(this.#stateTotals === 0)
  }
}

describe('arc4 contract creation', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('can create contract with txn in init', () => {
    const arg1 = ctx.any.bytes(5)
    const sender = ctx.any.account()

    ctx.txn.createScope([ctx.any.txn.applicationCall({ appArgs: [arg1], sender })]).execute(() => {
      const contract = ctx.contract.create(ContractTxnInit)
      expect(contract.arg1).toEqual(arg1)
      expect(contract.creator).toEqual(sender)
    })
  })

  it('can create contract without txn in init', () => {
    const contract = ctx.contract.create(ContractTxnInit)
    expect(contract.arg1).toEqual(Bytes())
    expect(contract.creator).toEqual(ctx.defaultSender)
  })

  it('can create arc4 contract with txn in init', () => {
    const arg1 = ctx.any.uint64()
    const sender = ctx.any.account()

    const contract = ctx.contract.create(ContractARC4Create)
    ctx.txn.createScope([ctx.any.txn.applicationCall({ appId: ctx.ledger.getApplicationForContract(contract), sender })]).execute(() => {
      contract.create(arg1)
      expect(contract.arg1).toEqual(arg1)
      expect(contract.creator).toEqual(sender)
    })
  })

  it('can create arc4 contract without txn in init', () => {
    const arg1 = ctx.any.uint64()

    const contract = ctx.contract.create(ContractARC4Create)

    const appData = lazyContext.getApplicationData(contract)
    expect(appData.isCreating).toBe(true)

    contract.create(arg1)

    expect(appData.isCreating).toBe(false)
    expect(contract.arg1).toEqual(arg1)
    expect(contract.creator).toEqual(ctx.defaultSender)
  })
})
