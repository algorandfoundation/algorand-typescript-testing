import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, Bytes, log, op } from '@algorandfoundation/algorand-typescript'
import type {
  Bool,
  DynamicArray,
  StaticArray,
  Str,
  Tuple,
  UFixed,
  Uint,
  Uint16,
  Uint32,
  Uint64,
  Uint8,
} from '@algorandfoundation/algorand-typescript/arc4'
import { interpretAsArc4 } from '@algorandfoundation/algorand-typescript/arc4'

export class PrimitiveOpsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_uint64_init(raw_value: bytes): uint64 {
    const result = op.btoi(raw_value)
    return result
  }

  @arc4.abimethod()
  public verify_uint64_add(a: uint64, b: uint64): uint64 {
    const result: uint64 = a + b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_sub(a: uint64, b: uint64): uint64 {
    const result: uint64 = a - b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_mul(a: uint64, b: uint64): uint64 {
    const result: uint64 = a * b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_div(a: uint64, b: uint64): uint64 {
    const result: uint64 = a / b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_mod(a: uint64, b: uint64): uint64 {
    const result: uint64 = a % b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_and(a: uint64, b: uint64): uint64 {
    const result: uint64 = a & b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_or(a: uint64, b: uint64): uint64 {
    const result: uint64 = a | b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_xor(a: uint64, b: uint64): uint64 {
    const result: uint64 = a ^ b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_not(a: uint64): uint64 {
    const result: uint64 = ~a
    return result
  }

  @arc4.abimethod()
  public verify_uint64_lshift(a: uint64, b: uint64): uint64 {
    const result: uint64 = a << b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_rshift(a: uint64, b: uint64): uint64 {
    const result: uint64 = a >> b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_pow(a: uint64, b: uint64): uint64 {
    const result: uint64 = a ** b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_eq(a: uint64, b: uint64): boolean {
    const result = a === b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_ne(a: uint64, b: uint64): boolean {
    const result = a !== b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_lt(a: uint64, b: uint64): boolean {
    const result = a < b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_le(a: uint64, b: uint64): boolean {
    const result = a <= b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_gt(a: uint64, b: uint64): boolean {
    const result = a > b
    return result
  }

  @arc4.abimethod()
  public verify_uint64_ge(a: uint64, b: uint64): boolean {
    const result = a >= b
    return result
  }

  @arc4.abimethod()
  public verify_bytes_init(raw_value: uint64): bytes {
    const result = op.itob(raw_value)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_add(a: bytes, b: bytes, pad_a_size: uint64, pad_b_size: uint64): bytes {
    const paddedA = op.bzero(pad_a_size).concat(a)
    const paddedB = op.bzero(pad_b_size).concat(b)
    const result = paddedA.concat(paddedB)
    const resultHash = op.sha256(result)
    return resultHash
  }

  @arc4.abimethod()
  public verify_bytes_eq(a: bytes, b: bytes): boolean {
    const result = a === b
    return result
  }

  @arc4.abimethod()
  public verify_bytes_ne(a: bytes, b: bytes): boolean {
    const result = a !== b
    return result
  }

  @arc4.abimethod()
  public verify_bytes_and(a: bytes, b: bytes): bytes {
    const result = a.bitwiseAnd(b)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_or(a: bytes, b: bytes): bytes {
    const result = a.bitwiseOr(b)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_xor(a: bytes, b: bytes): bytes {
    const result = a.bitwiseXor(b)
    return result
  }

  @arc4.abimethod()
  public verify_bytes_not(a: bytes, pad_size: uint64): bytes {
    const paddedA = op.bzero(pad_size).concat(a)
    const result = paddedA.bitwiseInvert()
    const resultHash = op.sha256(result)
    return resultHash
  }

  @arc4.abimethod()
  public verify_biguint_add(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint + b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_add_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint + b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_sub(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint - b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_sub_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint - b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_mul(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint * b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_mul_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint * b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_div(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint / b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_div_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint / b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_mod(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint % b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_mod_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint % b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_and(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint & b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_and_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint & b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_or(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint | b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_or_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint | b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_xor(a: bytes, b: bytes): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint ^ b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_xor_uint64(a: bytes, b: uint64): bytes {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result: biguint = a_biguint ^ b_biguint
    return Bytes(result)
  }

  @arc4.abimethod()
  public verify_biguint_eq(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint === b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_eq_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const result = a_biguint === BigUint(b)
    return result
  }

  @arc4.abimethod()
  public verify_biguint_ne(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint !== b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_ne_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const result = a_biguint !== BigUint(b)
    return result
  }

  @arc4.abimethod()
  public verify_biguint_lt(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint < b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_lt_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint < b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_le(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint <= b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_le_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint <= b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_gt(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint > b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_gt_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint > b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_ge(a: bytes, b: bytes): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint >= b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_biguint_ge_uint64(a: bytes, b: uint64): boolean {
    const a_biguint = BigUint(a)
    const b_biguint = BigUint(b)
    const result = a_biguint >= b_biguint
    return result
  }

  @arc4.abimethod()
  public verify_log(
    a: string,
    b: uint64,
    c: bytes,
    d: bytes,
    e: Bool,
    f: Str,
    g: Uint<64>,
    h: Uint<256>,
    i: UFixed<32, 8>,
    j: UFixed<256, 16>,
    k: bytes,
    m: bytes,
    n: bytes,
  ) {
    const d_biguint = BigUint(d)
    const arc4_k = interpretAsArc4<StaticArray<Uint8, 3>>(k)
    const arc4_m = interpretAsArc4<DynamicArray<Uint16>>(m)
    const arc4_n = interpretAsArc4<Tuple<[Uint32, Uint64, Str]>>(n)
    log(a, b, c, d_biguint, e, f, g, h, i, j, arc4_k, arc4_m, arc4_n)
  }
}
