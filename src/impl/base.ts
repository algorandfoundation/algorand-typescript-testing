import type { bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { internal, Uint64 } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import type { TypeInfo } from '../encoders'

export abstract class BytesBackedCls {
  #value: bytes
  // #typeInfo: GenericTypeInfo | undefined

  get bytes() {
    return this.#value
  }
  constructor(value: bytes, _typeInfo?: TypeInfo) {
    this.#value = value
    // this.#typeInfo = typeInfo
  }

  static fromBytes<T extends BytesBackedCls>(
    this: { new (v: bytes, typeInfo?: TypeInfo): T },
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo?: TypeInfo,
  ) {
    return new this(internal.primitives.BytesCls.fromCompat(value).asAlgoTs(), typeInfo)
  }
}

export abstract class Uint64BackedCls {
  #value: uint64

  get uint64() {
    return this.#value
  }

  constructor(value: uint64) {
    this.#value = value
  }

  static fromBytes<T extends Uint64BackedCls>(this: { new (v: uint64): T }, value: internal.primitives.StubBytesCompat | Uint8Array) {
    const uint8ArrayValue = value instanceof Uint8Array ? value : internal.primitives.BytesCls.fromCompat(value).asUint8Array()
    const uint64Value = Uint64(encodingUtil.uint8ArrayToBigInt(uint8ArrayValue))
    return new this(uint64Value)
  }
}
