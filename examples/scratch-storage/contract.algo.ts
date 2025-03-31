import type { uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, assert, BaseContract, Bytes, contract, op, Uint64 } from '@algorandfoundation/algorand-typescript'

@contract({ scratchSlots: [1, 2] })
export class ScratchSlotsContract extends arc4.Contract {
  @arc4.abimethod()
  public storeData(): boolean {
    op.Scratch.store(1, Uint64(5))
    op.Scratch.store(2, Bytes('Hello World'))
    assert(op.Scratch.loadUint64(1) === 5)
    assert(op.Scratch.loadBytes(2) === Bytes('Hello World'))
    return true
  }
}

@contract({ scratchSlots: [1, 2] })
export class SimpleScratchSlotsContract extends BaseContract {
  approvalProgram(): uint64 {
    assert(op.Scratch.loadUint64(1) === 5)
    assert(op.Scratch.loadBytes(2) === Bytes('Hello World'))
    return Uint64(1)
  }
  clearStateProgram(): uint64 {
    return Uint64(1)
  }
}
