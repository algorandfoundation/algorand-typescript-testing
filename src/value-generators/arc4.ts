import type { arc4 } from '@algorandfoundation/algorand-typescript'
import { BITS_IN_BYTE, MAX_UINT128, MAX_UINT16, MAX_UINT256, MAX_UINT32, MAX_UINT512, MAX_UINT64, MAX_UINT8 } from '../constants'
import { AddressImpl, DynamicBytesImpl, StrImpl, UintImpl } from '../impl/encoded-types'
import { getRandomBigInt, getRandomBytes } from '../util'
import { AvmValueGenerator } from './avm'

export class Arc4ValueGenerator {
  /**
   * Generate a random Algorand address.
   * @returns: A new, random Algorand address.
   * */
  address(): arc4.Address {
    const source = new AvmValueGenerator().account()
    const result = new AddressImpl(
      { name: 'Address', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] }, size: { name: '32' } } },
      source,
    )
    return result
  }

  /**
   * Generate a random Uint8 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2 ** 8 - 1.
   * @returns: A random Uint8 value.
   * */
  uint8(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT8): arc4.Uint8 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '8' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint8
  }

  /**
   * Generate a random Uint16 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2 ** 16 - 1.
   * @returns: A random Uint16 value.
   * */
  uint16(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT16): arc4.Uint16 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '16' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint16
  }

  /**
   * Generate a random Uint32 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2 ** 32 - 1.
   * @returns: A random Uint32 value.
   * */
  uint32(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT32): arc4.Uint32 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '32' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint32
  }

  /**
   * Generate a random Uint64 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2n ** 64n - 1n.
   * @returns: A random Uint64 value.
   * */
  uint64(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT64): arc4.Uint64 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '64' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint64
  }

  /**
   * Generate a random Uint128 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2n ** 128n - 1n.
   * @returns: A random Uint128 value.
   * */
  uint128(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT128): arc4.Uint128 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '128' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint128
  }

  /**
   * Generate a random Uint256 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2n ** 256n - 1n.
   * @returns: A random Uint256 value.
   * */
  uint256(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT256): arc4.Uint256 {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '256' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint256
  }

  /**
   * Generate a random Uint512 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to 2n ** 512n - 1n.
   * @returns: A random Uint512 value.
   * */
  uint512(minValue: number | bigint = 0, maxValue: number | bigint = MAX_UINT512): arc4.Uint<512> {
    return new UintImpl({ name: 'Uint', genericArgs: [{ name: '512' }] }, getRandomBigInt(minValue, maxValue)) as arc4.Uint<512>
  }

  /**
   * Generate a random dynamic bytes of size `n` bits.
   * @param n: The number of bits for the dynamic bytes. Must be a multiple of 8, otherwise
   * the last byte will be truncated.
   * @returns: A new, random dynamic bytes of size `n` bits.
   * */
  dynamicBytes(n: number): arc4.DynamicBytes {
    return new DynamicBytesImpl(
      { name: 'DynamicBytes', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] } } },
      getRandomBytes(n / BITS_IN_BYTE).asAlgoTs(),
    )
  }

  /**
   * Generate a random dynamic string of size `n` bits.
   * @param n: The number of bits for the string.
   * @returns: A new, random string of size `n` bits.
   * */
  str(n: number): arc4.Str {
    // Calculate the number of characters needed (rounding up)
    const numChars = n + 7 // 8

    // Generate random string
    const bytes = getRandomBytes(numChars)
    return new StrImpl(JSON.stringify(undefined), bytes.toString()) as unknown as arc4.Str
  }
}
