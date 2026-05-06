import type { BytesBacked, StringCompat } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'

import { AssertError, AvmError, CodeError } from '../errors'
import { toBytes } from './encoded-types'
import type { StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './primitives'

/** @internal */
export function log(...args: Array<StubUint64Compat | StubBytesCompat | StubBigUintCompat | StringCompat | BytesBacked>): void {
  lazyContext.txn.appendLog(args.map((a) => toBytes(a)).reduce((left, right) => left.concat(right)))
}

/** @internal */
export function loggedAssert(
  condition: unknown,
  code: string,
  messageOrOptions?: string | { message?: string | undefined; prefix?: 'ERR' | 'AER' },
): asserts condition {
  if (!condition) {
    const errorMessage = resolveErrorMessage(code, messageOrOptions)
    log(errorMessage)
    throw new AssertError(errorMessage)
  }
}

/** @internal */
export function loggedErr(code: string, messageOrOptions?: string | { message?: string; prefix?: 'ERR' | 'AER' }): never {
  const errorMessage = resolveErrorMessage(code, messageOrOptions)
  log(errorMessage)
  throw new AvmError(errorMessage)
}

const VALID_PREFIXES = new Set(['ERR', 'AER'])
function resolveErrorMessage(code: string, messageOrOptions?: string | { message?: string | undefined; prefix?: 'ERR' | 'AER' }): string {
  const message = typeof messageOrOptions === 'string' ? messageOrOptions : messageOrOptions?.message
  const prefix = typeof messageOrOptions === 'string' ? undefined : (messageOrOptions?.prefix ?? 'ERR')

  if (code.includes(':')) {
    throw new CodeError("error code must not contain domain separator ':'")
  }

  if (message && message.includes(':')) {
    throw new CodeError("error message must not contain domain separator ':'")
  }

  const prefixStr = prefix || 'ERR'
  if (!VALID_PREFIXES.has(prefixStr)) {
    throw new CodeError('error prefix must be one of AER, ERR')
  }
  return message ? `${prefixStr}:${code}:${message}` : `${prefixStr}:${code}`
}
