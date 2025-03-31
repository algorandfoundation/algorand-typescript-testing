import type { bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, Base64, BigUint, Bytes, err, op } from '@algorandfoundation/algorand-typescript'

export class MiscellaneousOpsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_addw(a: uint64, b: uint64): readonly [uint64, uint64] {
    const result = op.addw(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_base64_decode_standard(a: bytes): bytes {
    const result = op.base64Decode(Base64.StdEncoding, a)
    return result
  }

  @arc4.abimethod()
  public verify_base64_decode_url(a: bytes): bytes {
    const result = op.base64Decode(Base64.URLEncoding, a)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_bitlen(a: bytes, pad_a_size: uint64): uint64 {
    const paddedA = op.bzero(pad_a_size).concat(a)
    const result = op.bitLength(paddedA)
    return result
  }

  @arc4.abimethod()
  public verify_uint64_bitlen(a: uint64): uint64 {
    const result = op.bitLength(a)
    return result
  }

  @arc4.abimethod()
  public verify_bsqrt(a: bytes): bytes {
    const a_biguint = BigUint(a)
    const result = op.bsqrt(a_biguint)
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_btoi(a: bytes): uint64 {
    const result = op.btoi(a)
    return result
  }

  @arc4.abimethod()
  public verify_bzero(a: uint64): bytes {
    const result = op.bzero(a)
    return op.sha256(result)
  }

  @arc4.abimethod()
  public verify_concat(a: bytes, b: bytes, pad_a_size: uint64, pad_b_size: uint64): bytes {
    const paddedA = op.bzero(pad_a_size).concat(a)
    const paddedB = op.bzero(pad_b_size).concat(b)
    const result = paddedA.concat(paddedB)
    const resultHash = op.sha256(result)
    return resultHash
  }

  @arc4.abimethod()
  public verify_divmodw(a: uint64, b: uint64, c: uint64, d: uint64): readonly [uint64, uint64, uint64, uint64] {
    const result = op.divmodw(a, b, c, d)
    return result
  }

  @arc4.abimethod()
  public verify_divw(a: uint64, b: uint64, c: uint64): uint64 {
    const result = op.divw(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_err(): void {
    err()
  }

  @arc4.abimethod()
  public verify_exp(a: uint64, b: uint64): uint64 {
    const result = op.exp(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_expw(a: uint64, b: uint64): readonly [uint64, uint64] {
    const result = op.expw(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_extract(a: bytes, b: uint64, c: uint64): bytes {
    const result = op.extract(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_extract_from_2(a: bytes): bytes {
    const result = op.extract(a, 2)
    return result
  }

  @arc4.abimethod()
  public verify_extract_uint16(a: bytes, b: uint64): uint64 {
    const result = op.extractUint16(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_extract_uint32(a: bytes, b: uint64): uint64 {
    const result = op.extractUint32(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_extract_uint64(a: bytes, b: uint64): uint64 {
    const result = op.extractUint64(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_getbit_bytes(a: bytes, b: uint64): uint64 {
    const result = op.getBit(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_getbit_uint64(a: uint64, b: uint64): uint64 {
    const result = op.getBit(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_getbyte(a: bytes, b: uint64): uint64 {
    const result = op.getByte(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_itob(a: uint64): bytes {
    const result = op.itob(a)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_len(a: bytes, pad_a_size: uint64): uint64 {
    const paddedA = op.bzero(pad_a_size).concat(a)
    const result = op.len(paddedA)
    return result
  }

  @arc4.abimethod()
  public verify_mulw(a: uint64, b: uint64): readonly [uint64, uint64] {
    const result = op.mulw(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_replace(a: bytes, b: uint64, c: bytes): bytes {
    const result = op.replace(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_select_bytes(a: bytes, b: bytes, c: uint64): bytes {
    const result = op.select(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_select_uint64(a: uint64, b: uint64, c: uint64): uint64 {
    const result = op.select(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_setbit_bytes(a: bytes, b: uint64, c: uint64): bytes {
    const result = op.setBit(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_setbit_uint64(a: uint64, b: uint64, c: uint64): uint64 {
    const result = op.setBit(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_setbyte(a: bytes, b: uint64, c: uint64): bytes {
    const result = op.setByte(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_shl(a: uint64, b: uint64): uint64 {
    const result = op.shl(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_shr(a: uint64, b: uint64): uint64 {
    const result = op.shr(a, b)
    return result
  }

  @arc4.abimethod()
  public verify_sqrt(a: uint64): uint64 {
    const result = op.sqrt(a)
    return result
  }

  @arc4.abimethod()
  public verify_substring(a: bytes, b: uint64, c: uint64): bytes {
    const result = op.substring(a, b, c)
    return result
  }
}
