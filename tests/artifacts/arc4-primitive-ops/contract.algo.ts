import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, clone, emit } from '@algorandfoundation/algorand-typescript'
import type { Bool, UFixed } from '@algorandfoundation/algorand-typescript/arc4'
import { Byte, Contract, interpretAsArc4, Str, Uint } from '@algorandfoundation/algorand-typescript/arc4'

export class Arc4PrimitiveOpsContract extends Contract {
  @arc4.abimethod()
  public verify_uintn_uintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN === bUintN
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN === bUintN
  }
  @arc4.abimethod()
  public verify_byte_byte_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte === bByte
  }
  @arc4.abimethod()
  public verify_uintn_uintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN !== bUintN
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return !aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return !aUintN.bytes.equals(bUintN.bytes)
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN !== bUintN
  }
  @arc4.abimethod()
  public verify_byte_byte_ne(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte !== bByte
  }
  @arc4.abimethod()
  public verify_uintn_uintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asUint64() < bUintN.asUint64()
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asBigUint() < BigUint(bUintN.asUint64())
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return BigUint(aUintN.asUint64()) < bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN.asBigUint() < bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_byte_byte_lt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.asUint64() < bByte.asUint64()
  }
  @arc4.abimethod()
  public verify_uintn_uintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asUint64() <= bUintN.asUint64()
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asBigUint() <= BigUint(bUintN.asUint64())
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return BigUint(aUintN.asUint64()) <= bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN.asBigUint() <= bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_byte_byte_le(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.asUint64() <= bByte.asUint64()
  }
  @arc4.abimethod()
  public verify_uintn_uintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asUint64() > bUintN.asUint64()
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asBigUint() > BigUint(bUintN.asUint64())
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return BigUint(aUintN.asUint64()) > bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN.asBigUint() > bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_byte_byte_gt(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.asUint64() > bByte.asUint64()
  }
  @arc4.abimethod()
  public verify_uintn_uintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asUint64() >= bUintN.asUint64()
  }
  @arc4.abimethod()
  public verify_biguintn_uintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<64>(bBiguint)
    return aUintN.asBigUint() >= BigUint(bUintN.asUint64())
  }
  @arc4.abimethod()
  public verify_uintn_biguintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<64>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return BigUint(aUintN.asUint64()) >= bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_biguintn_biguintn_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new Uint<512>(aBiguint)
    const bUintN = new Uint<512>(bBiguint)
    return aUintN.asBigUint() >= bUintN.asBigUint()
  }
  @arc4.abimethod()
  public verify_byte_byte_ge(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aByte = new Byte(aBiguint)
    const bByte = new Byte(bBiguint)
    return aByte.asUint64() >= bByte.asUint64()
  }
  @arc4.abimethod()
  public verify_uintn_init(a: bytes): Uint<32> {
    const aBiguint = BigUint(a)
    return new Uint<32>(aBiguint)
  }
  @arc4.abimethod()
  public verify_biguintn_init(a: bytes): Uint<256> {
    const aBiguint = BigUint(a)
    return new Uint<256>(aBiguint)
  }
  @arc4.abimethod()
  public verify_byte_init(a: bytes): Byte {
    const aBiguint = BigUint(a)
    return new Byte(aBiguint)
  }
  @arc4.abimethod()
  public verify_uintn_from_bytes(a: bytes): Uint<32> {
    return interpretAsArc4<Uint<32>>(a)
  }
  @arc4.abimethod()
  public verify_biguintn_from_bytes(a: bytes): Uint<256> {
    return interpretAsArc4<Uint<256>>(a)
  }
  @arc4.abimethod()
  public verify_byte_from_bytes(a: bytes): Byte {
    return interpretAsArc4<Byte>(a)
  }
  @arc4.abimethod()
  public verify_uintn_from_log(a: bytes): Uint<32> {
    return interpretAsArc4<Uint<32>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_biguintn_from_log(a: bytes): Uint<256> {
    return interpretAsArc4<Uint<256>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_biguintn_as_uint64(a: bytes): uint64 {
    return interpretAsArc4<Uint<256>>(a).asUint64()
  }

  @arc4.abimethod()
  public verify_biguintn_as_biguint(a: bytes): biguint {
    return interpretAsArc4<Uint<256>>(a).asBigUint()
  }

  @arc4.abimethod()
  public verify_uintn64_as_uint64(a: bytes): uint64 {
    return interpretAsArc4<arc4.Uint64>(a).asUint64()
  }

  @arc4.abimethod()
  public verify_uintn64_as_biguint(a: bytes): biguint {
    return interpretAsArc4<arc4.Uint64>(a).asBigUint()
  }

  @arc4.abimethod()
  public verify_byte_from_log(a: bytes): Byte {
    return interpretAsArc4<Byte>(a, 'log')
  }
  @arc4.abimethod()
  public verify_ufixed_bytes(a: UFixed<32, 8>): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_bigufixed_bytes(a: UFixed<256, 16>): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_ufixed_from_bytes(a: bytes): UFixed<32, 8> {
    return interpretAsArc4<UFixed<32, 8>>(a)
  }
  @arc4.abimethod()
  public verify_bigufixed_from_bytes(a: bytes): UFixed<256, 16> {
    return interpretAsArc4<UFixed<256, 16>>(a)
  }
  @arc4.abimethod()
  public verify_ufixed_from_log(a: bytes): UFixed<32, 8> {
    return interpretAsArc4<UFixed<32, 8>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_bigufixed_from_log(a: bytes): UFixed<256, 16> {
    return interpretAsArc4<UFixed<256, 16>>(a, 'log')
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
    return a === b
  }
  @arc4.abimethod()
  public verify_string_bytes(a: string): bytes {
    const result = new Str(a)
    return result.bytes
  }
  @arc4.abimethod()
  public verify_string_from_bytes(a: bytes): Str {
    return interpretAsArc4<Str>(a)
  }
  @arc4.abimethod()
  public verify_string_from_log(a: bytes): Str {
    return interpretAsArc4<Str>(a, 'log')
  }
  @arc4.abimethod()
  public verify_bool_bytes(a: Bool): bytes {
    return a.bytes
  }
  @arc4.abimethod()
  public verify_bool_from_bytes(a: bytes): Bool {
    return interpretAsArc4<Bool>(a)
  }
  @arc4.abimethod()
  public verify_bool_from_log(a: bytes): Bool {
    return interpretAsArc4<Bool>(a, 'log')
  }

  // TODO: recompile when puya-ts is updated
  @arc4.abimethod()
  public verify_emit(
    a: arc4.Str,
    b: arc4.Uint<512>,
    c: arc4.Uint64,
    d: arc4.DynamicBytes,
    e: arc4.Uint64,
    f: arc4.Bool,
    g: arc4.DynamicBytes,
    h: arc4.Str,
    m: arc4.Uint<64>,
    n: arc4.Uint<256>,
    o: arc4.UFixed<32, 8>,
    p: arc4.UFixed<256, 16>,
    q: arc4.Bool,
    r: bytes,
    s: bytes,
    t: bytes,
  ): void {
    const arc4_r = interpretAsArc4<arc4.StaticArray<arc4.Uint8, 3>>(r)
    const arc4_s = interpretAsArc4<arc4.DynamicArray<arc4.Uint16>>(s)
    const arc4_t = interpretAsArc4<arc4.Tuple<[arc4.Uint32, arc4.Uint64, arc4.Str]>>(t)

    emit(new SwappedArc4({ m, n, o, p, q, r: clone(arc4_r), s: clone(arc4_s), t: clone(arc4_t) }))
    emit('Swapped', a, b, c, d, e, f, g, h, m, n, o, p, q, arc4_r, arc4_s, arc4_t)
    emit(
      'Swapped(string,uint512,uint64,byte[],uint64,bool,byte[],string,uint64,uint256,ufixed32x8,ufixed256x16,bool,uint8[3],uint16[],(uint32,uint64,string))',
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      m,
      n,
      o,
      p,
      q,
      arc4_r,
      arc4_s,
      arc4_t,
    )
  }
}

class SwappedArc4 extends arc4.Struct<{
  m: arc4.Uint<64>
  n: arc4.Uint<256>
  o: arc4.UFixed<32, 8>
  p: arc4.UFixed<256, 16>
  q: arc4.Bool
  r: arc4.StaticArray<arc4.Uint8, 3>
  s: arc4.DynamicArray<arc4.Uint16>
  t: arc4.Tuple<[arc4.Uint32, arc4.Uint64, arc4.Str]>
}> {}
