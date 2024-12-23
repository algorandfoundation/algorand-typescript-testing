import { arc4 } from '@algorandfoundation/algorand-typescript'
import { BITS_IN_BYTE, MAX_UINT128, MAX_UINT16, MAX_UINT256, MAX_UINT32, MAX_UINT512, MAX_UINT64, MAX_UINT8 } from '../constants'
import { AddressImpl, DynamicBytesImpl, StrImpl, UintNImpl } from '../impl/encoded-types'
import { getRandomBigInt, getRandomBytes, getRandomNumber } from '../util'
import { AvmValueGenerator } from './avm'

export class Arc4ValueGenerator {
  /**
   * Generate a random Algorand address.
   * @returns: A new, random Algorand address.
   * */
  address(): arc4.Address {
    const source = new AvmValueGenerator().account()
    const result = new AddressImpl(
      { name: 'StaticArray', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] }, size: { name: '32' } } },
      source,
    )
    return result
  }

  /**
   * Generate a random UintN8 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT8.
   * @returns: A random UintN8 value.
   * */
  uintN8(minValue = 0, maxValue = MAX_UINT8): arc4.UintN8 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '8' }] }, getRandomNumber(minValue, maxValue))
  }

  /**
   * Generate a random UintN16 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT16.
   * @returns: A random UintN16 value.
   * */
  uintN16(minValue = 0, maxValue = MAX_UINT16): arc4.UintN16 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '16' }] }, getRandomNumber(minValue, maxValue))
  }

  /**
   * Generate a random UintN32 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT32.
   * @returns: A random UintN32 value.
   * */
  uintN32(minValue = 0, maxValue = MAX_UINT32): arc4.UintN32 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '32' }] }, getRandomNumber(minValue, maxValue))
  }

  /**
   * Generate a random UintN64 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT64.
   * @returns: A random UintN64 value.
   * */
  uintN64(minValue = 0, maxValue = MAX_UINT64): arc4.UintN64 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '64' }] }, getRandomBigInt(minValue, maxValue))
  }

  /**
   * Generate a random UintN128 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT128.
   * @returns: A random UintN128 value.
   * */
  uintN128(minValue = 0, maxValue = MAX_UINT128): arc4.UintN128 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '128' }] }, getRandomBigInt(minValue, maxValue))
  }

  /**
   * Generate a random UintN256 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT256.
   * @returns: A random UintN256 value.
   * */
  uintN256(minValue = 0, maxValue = MAX_UINT256): arc4.UintN256 {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '256' }] }, getRandomBigInt(minValue, maxValue))
  }

  /**
   * Generate a random UintN512 within the specified range.
   * @param minValue: Minimum value (inclusive). Defaults to 0.
   * @param maxValue: Maximum value (inclusive). Defaults to MAX_UINT512.
   * @returns: A random UintN512 value.
   * */
  uintN512(minValue = 0, maxValue = MAX_UINT512): arc4.UintN<512> {
    return new UintNImpl({ name: 'UintN', genericArgs: [{ name: '512' }] }, getRandomBigInt(minValue, maxValue))
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
    return new StrImpl(JSON.stringify(undefined), bytes.toString())
  }
}
