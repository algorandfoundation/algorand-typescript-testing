import { Bytes, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import { ArgsSimple } from '../artifacts/logic-signature/lsig-args-simple.algo'

describe('ArgsSimple LogicSig', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('should return arg0 when arg0 >= 10 and arg2 is true', () => {
    const result = ctx.executeLogicSig(new ArgsSimple(), Uint64(42), Bytes('hello'), true)
    expect(result).toEqual(Uint64(42))
  })

  it('should clamp arg0 to 10 when arg0 < 10 and arg2 is true', () => {
    const result = ctx.executeLogicSig(new ArgsSimple(), Uint64(5), Bytes('hello'), true)
    expect(result).toEqual(Uint64(10))
  })

  it('should add arg1 length to arg0 when arg2 is false', () => {
    const result = ctx.executeLogicSig(new ArgsSimple(), Uint64(42), Bytes('data'), false)
    // arg2 becomes true after `!arg2`, so total = arg0 + mutableArg1.length
    // mutableArg1 = "data" + "suffix" = 10 bytes
    expect(result).toEqual(Uint64(52))
  })
})
