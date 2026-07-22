import type { uint64 } from '@algorandfoundation/algorand-typescript'
import { Contract, loggedAssert, loggedErr } from '@algorandfoundation/algorand-typescript'

export class LoggedErrorsContract extends Contract {
  public testValid(arg: uint64): void {
    loggedAssert(arg !== 1, '01')
    loggedAssert(arg !== 2, '02', {})
    loggedAssert(arg !== 3, '03', { message: 'arg is 3' })
    loggedAssert(arg !== 4, '04', { prefix: 'AER' })
    loggedAssert(arg !== 5, '05', { message: 'arg is 5', prefix: 'AER' })
    loggedAssert(arg !== 6, '06', 'arg is 6')
    if (arg === 7) {
      loggedErr('07')
    }
    if (arg === 8) {
      loggedErr('08', {})
    }
    if (arg === 9) {
      loggedErr('09', { message: 'arg is 9' })
    }
    if (arg === 10) {
      loggedErr('10', { prefix: 'AER' })
    }
    if (arg === 11) {
      loggedErr('11', { message: 'arg is 11', prefix: 'AER' })
    }
    if (arg === 12) {
      loggedErr('12', 'arg is 12')
    }
  }

  public testInvalidCode(arg: uint64): void {
    loggedAssert(arg !== 1, 'not-alnum!')
    loggedErr('not-alnum!')
  }

  public testCamelCaseCode(arg: uint64): void {
    loggedAssert(arg !== 1, 'MyCode')
    loggedErr('MyCode')
  }

  public testAERPrefix(arg: uint64): void {
    loggedAssert(arg !== 1, '01', { prefix: 'AER' })
    loggedErr('01', { prefix: 'AER' })
  }

  public testLongMessage(arg: uint64): void {
    loggedAssert(arg !== 1, '01', {
      message: 'I will now provide a succint description of the error. I guess it all started when I was 5...',
    })
    loggedErr('01', { message: 'I will now provide a succint description of the error. I guess it all started when I was 5...' })
  }

  public test8ByteMessage(arg: uint64): void {
    loggedAssert(arg !== 1, 'abcd')
    loggedErr('abcd')
  }

  public test32ByteMessage(arg: uint64): void {
    loggedAssert(arg !== 1, '01', { message: 'aaaaaaaaaaaaaaaaaaaaaaaaa' })
    loggedErr('01', { message: 'aaaaaaaaaaaaaaaaaaaaaaaaa' })
  }

  public testColonInCode(arg: uint64): void {
    loggedAssert(arg !== 1, 'bad:code')
  }

  public testColonInMessage(arg: uint64): void {
    loggedAssert(arg !== 1, '01', { message: 'bad:msg' })
  }

  public testInvalidPrefix(arg: uint64): void {
    loggedAssert(arg !== 1, '01', { prefix: 'BAD' as 'ERR' })
  }
}
