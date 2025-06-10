import { MutableObject } from '@algorandfoundation/algorand-typescript'
import type { DeliberateAny } from '../typescript-helpers'
import type { TypeInfo } from './encoded-types'

type MutableObjectConstraint = Record<string, DeliberateAny>

export class MutableObjectImpl<T extends MutableObjectConstraint> extends (MutableObject<MutableObjectConstraint> as DeliberateAny) {
  typeInfo: TypeInfo
  genericArgs: Record<string, TypeInfo>

  constructor(typeInfo: TypeInfo | string, initial: T) {
    super(initial)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as Record<string, TypeInfo>
    Object.keys(this.genericArgs).forEach((key) => {
      Object.defineProperty(this, key, {
        value: initial[key],
        writable: true,
        enumerable: true,
      })
    })
  }
}
