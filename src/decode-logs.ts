import type { bytes } from '@algorandfoundation/algorand-typescript'
import { ABI_RETURN_VALUE_LOG_PREFIX } from './constants'
import { btoi } from './impl/pure'
import { asNumber } from './util'

export type LogDecoding = 'i' | 's' | 'b'

export type DecodedLog<T extends LogDecoding> = T extends 'i' ? bigint : T extends 's' ? string : Uint8Array
export type DecodedLogs<T extends [...LogDecoding[]]> = {
  [Index in keyof T]: DecodedLog<T[Index]>
} & { length: T['length'] }

const ABI_RETURN_VALUE_LOG_PREFIX_LENGTH = asNumber(ABI_RETURN_VALUE_LOG_PREFIX.length)
export function decodeLogs<const T extends [...LogDecoding[]]>(logs: bytes[], decoding: T): DecodedLogs<T> {
  return logs.map((log, i) => {
    const value = log.slice(0, ABI_RETURN_VALUE_LOG_PREFIX_LENGTH).equals(ABI_RETURN_VALUE_LOG_PREFIX)
      ? log.slice(ABI_RETURN_VALUE_LOG_PREFIX_LENGTH)
      : log
    switch (decoding[i]) {
      case 'i':
        return btoi(value)
      case 's':
        return value.toString()
      default:
        return value
    }
  }) as DecodedLogs<T>
}
