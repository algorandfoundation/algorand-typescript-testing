import { arc4, assert, BaseContract, Bytes, op, uint64, Uint64 } from '@algorandfoundation/algo-ts'

export class ScratchSlotsContract extends arc4.Contract {
  @arc4.abimethod()
  public storeData(): boolean {
    op.Scratch.store(1, Uint64(5))
    op.Scratch.store(2, Bytes('Hello World'))
    assert(op.Scratch.loadUint64(1) === Uint64(5))
    assert(op.Scratch.loadBytes(2) === Bytes('Hello World'))
    return true
  }
}

export class SimpleScratchSlotsContract extends BaseContract {
  approvalProgram(): boolean | uint64 {
    assert(op.Scratch.loadUint64(1) === Uint64(5))
    assert(op.Scratch.loadBytes(2) === Bytes('Hello World'))
    return Uint64(1)
  }
  clearStateProgram(): boolean | uint64 {
    return Uint64(1)
  }
}
