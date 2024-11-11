import { arc4, BigUint, bytes } from '@algorandfoundation/algorand-typescript'
import { Bool, Byte, Contract, Str, UFixedNxM, UintN } from '@algorandfoundation/algorand-typescript/arc4'

export class Arc4PrimitiveOpsContract extends Contract {
  @arc4.abimethod()
  public verify_uintn_uintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.equals(bUintN)
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.equals(bUintN)
  }
  @arc4.abimethod()
  public verify_byte_byte_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.equals(bByte)
  }
  @arc4.abimethod()
  public verify_uintn_uintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return !aUintN.equals(bUintN)
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return !aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return !aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return !aUintN.equals(bUintN)
  }
  @arc4.abimethod()
  public verify_byte_byte_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return !aByte.equals(bByte)
  }
  @arc4.abimethod()
  public verify_uintn_uintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native < bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native < BigUint(bUintN.native)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return BigUint(aUintN.native) < bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.native < bUintN.native
  }
  @arc4.abimethod()
  public verify_byte_byte_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.native < bByte.native
  }
  @arc4.abimethod()
  public verify_uintn_uintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native <= bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native <= BigUint(bUintN.native)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return BigUint(aUintN.native) <= bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.native <= bUintN.native
  }
  @arc4.abimethod()
  public verify_byte_byte_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.native <= bByte.native
  }
  @arc4.abimethod()
  public verify_uintn_uintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native > bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native > BigUint(bUintN.native)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return BigUint(aUintN.native) > bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.native > bUintN.native
  }
  @arc4.abimethod()
  public verify_byte_byte_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.native > bByte.native
  }
  @arc4.abimethod()
  public verify_uintn_uintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native >= bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN.native >= BigUint(bUintN.native)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return BigUint(aUintN.native) >= bUintN.native
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<512>(aBiguint)
    const bUintN = new UintN<512>(bBiguint)
    return aUintN.native >= bUintN.native
  }
  @arc4.abimethod()
  public verify_byte_byte_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.native >= bByte.native
  }
  @arc4.abimethod()
  public verify_uintn_init(a: bytes): UintN<32> {
    const aBiguint = BigUint(a)
    return new UintN<32>(aBiguint)
  }
  @arc4.abimethod()
  public verify_biguintn_init(a: bytes): UintN<256> {
    const aBiguint = BigUint(a)
    return new UintN<256>(aBiguint)
  }
  @arc4.abimethod()
  public verify_byte_init(a: bytes): Byte {
    const aBiguint = BigUint(a)
    return new Byte(aBiguint)
  }
  @arc4.abimethod()
  public verify_uintn_from_bytes(a: bytes): UintN<32> {
    return UintN.fromBytes<UintN<32>>(a)
  }
  @arc4.abimethod()
  public verify_biguintn_from_bytes(a: bytes): UintN<256> {
    return UintN.fromBytes<UintN<256>>(a)
  }
  @arc4.abimethod()
  public verify_byte_from_bytes(a: bytes): Byte {
    return Byte.fromBytes(a)
  }
  @arc4.abimethod()
  public verify_uintn_from_log(a: bytes): UintN<32> {
    return UintN.fromLog<UintN<32>>(a)
  }
  @arc4.abimethod()
  public verify_biguintn_from_log(a: bytes): UintN<256> {
    return UintN.fromLog<UintN<256>>(a)
  }
  @arc4.abimethod()
  public verify_byte_from_log(a: bytes): Byte {
    return Byte.fromLog(a)
  }
  @arc4.abimethod()
  public verify_ufixednxm_bytes(a: UFixedNxM<32, 8>): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_bigufixednxm_bytes(a: UFixedNxM<256, 16>): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_ufixednxm_from_bytes(a: bytes): UFixedNxM<32, 8> {
    return UFixedNxM.fromBytes<UFixedNxM<32, 8>>(a)
  }
  @arc4.abimethod()
  public verify_bigufixednxm_from_bytes(a: bytes): UFixedNxM<256, 16> {
    return UFixedNxM.fromBytes<UFixedNxM<256, 16>>(a)
  }
  @arc4.abimethod()
  public verify_ufixednxm_from_log(a: bytes): UFixedNxM<32, 8> {
    return UFixedNxM.fromLog<UFixedNxM<32, 8>>(a)
  }
  @arc4.abimethod()
  public verify_bigufixednxm_from_log(a: bytes): UFixedNxM<256, 16> {
    return UFixedNxM.fromLog<UFixedNxM<256, 16>>(a)
  }
  @arc4.abimethod()
  public verify_string_init(a: string): Str {
    const result = new Str(`Hello, ${a}`)
    return result
  }
  @arc4.abimethod()
  public verify_string_add(a: Str, b: Str): Str {
    const result = a.native.concat(b.native)
    return new Str(result)
  }
  @arc4.abimethod()
  public verify_string_eq(a: Str, b: Str): boolean {
    return a.equals(b)
  }
  @arc4.abimethod()
  public verify_string_bytes(a: string): bytes {
    const result = new Str(a)
    return result.bytes
  }
  @arc4.abimethod()
  public verify_string_from_bytes(a: bytes): Str {
    return Str.fromBytes(a)
  }
  @arc4.abimethod()
  public verify_string_from_log(a: bytes): Str {
    return Str.fromLog(a)
  }
  @arc4.abimethod()
  public verify_bool_bytes(a: Bool): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_bool_from_bytes(a: bytes): Bool {
    return Bool.fromBytes(a)
  }
  @arc4.abimethod()
  public verify_bool_from_log(a: bytes): Bool {
    return Bool.fromLog(a)
  }
}
