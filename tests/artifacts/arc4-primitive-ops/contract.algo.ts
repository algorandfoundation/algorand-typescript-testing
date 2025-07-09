import type { bytes } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, clone, emit } from '@algorandfoundation/algorand-typescript'
import type { Bool, UFixedNxM } from '@algorandfoundation/algorand-typescript/arc4'
import { Byte, Contract, interpretAsArc4, Str, UintN } from '@algorandfoundation/algorand-typescript/arc4'

export class Arc4PrimitiveOpsContract extends Contract {
  @arc4.abimethod()
  public verify_uintn_uintn_eq(a: bytes, b: bytes): boolean {
    const aBiguint = BigUint(a)
    const bBiguint = BigUint(b)
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN === bUintN
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
    const aUintN = new UintN<64>(aBiguint)
    const bUintN = new UintN<64>(bBiguint)
    return aUintN !== bUintN
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
    return interpretAsArc4<UintN<32>>(a)
  }
  @arc4.abimethod()
  public verify_biguintn_from_bytes(a: bytes): UintN<256> {
    return interpretAsArc4<UintN<256>>(a)
  }
  @arc4.abimethod()
  public verify_byte_from_bytes(a: bytes): Byte {
    return interpretAsArc4<Byte>(a)
  }
  @arc4.abimethod()
  public verify_uintn_from_log(a: bytes): UintN<32> {
    return interpretAsArc4<UintN<32>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_biguintn_from_log(a: bytes): UintN<256> {
    return interpretAsArc4<UintN<256>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_byte_from_log(a: bytes): Byte {
    return interpretAsArc4<Byte>(a, 'log')
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
    return interpretAsArc4<UFixedNxM<32, 8>>(a)
  }
  @arc4.abimethod()
  public verify_bigufixednxm_from_bytes(a: bytes): UFixedNxM<256, 16> {
    return interpretAsArc4<UFixedNxM<256, 16>>(a)
  }
  @arc4.abimethod()
  public verify_ufixednxm_from_log(a: bytes): UFixedNxM<32, 8> {
    return interpretAsArc4<UFixedNxM<32, 8>>(a, 'log')
  }
  @arc4.abimethod()
  public verify_bigufixednxm_from_log(a: bytes): UFixedNxM<256, 16> {
    return interpretAsArc4<UFixedNxM<256, 16>>(a, 'log')
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
    b: arc4.UintN<512>,
    c: arc4.UintN64,
    d: arc4.DynamicBytes,
    e: arc4.UintN64,
    f: arc4.Bool,
    g: arc4.DynamicBytes,
    h: arc4.Str,
    m: arc4.UintN<64>,
    n: arc4.UintN<256>,
    o: arc4.UFixedNxM<32, 8>,
    p: arc4.UFixedNxM<256, 16>,
    q: arc4.Bool,
    r: bytes,
    s: bytes,
    t: bytes,
  ): void {
    const arc4_r = interpretAsArc4<arc4.StaticArray<arc4.UintN8, 3>>(r)
    const arc4_s = interpretAsArc4<arc4.DynamicArray<arc4.UintN16>>(s)
    const arc4_t = interpretAsArc4<arc4.Tuple<[arc4.UintN32, arc4.UintN64, arc4.Str]>>(t)

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
  m: arc4.UintN<64>
  n: arc4.UintN<256>
  o: arc4.UFixedNxM<32, 8>
  p: arc4.UFixedNxM<256, 16>
  q: arc4.Bool
  r: arc4.StaticArray<arc4.UintN8, 3>
  s: arc4.DynamicArray<arc4.UintN16>
  t: arc4.Tuple<[arc4.UintN32, arc4.UintN64, arc4.Str]>
}> {}
