// Sometimes only an 'any' will do. Don't use this just to be lazy though
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type DeliberateAny = any
export type AnyFunction = (...args: DeliberateAny[]) => DeliberateAny
export type ConstructorFor<T, TArgs extends DeliberateAny[] = DeliberateAny[]> = new (...args: TArgs) => T
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type KeyIsFunction<TKey extends keyof TObj, TObj> = TKey extends DeliberateAny
  ? TObj[TKey] extends AnyFunction
    ? TKey
    : never
  : never
export type KeyIsNotFunction<TKey extends keyof TObj, TObj> = TKey extends DeliberateAny
  ? TObj[TKey] extends AnyFunction
    ? never
    : TKey
  : never
export type ObjectKeys<T> = KeyIsNotFunction<keyof T, T>
export type FunctionKeys<T> = KeyIsFunction<keyof T, T>

export function instanceOfAny<T extends Array<{ new (...args: DeliberateAny[]): DeliberateAny }>>(
  x: unknown,
  ...types: T
): x is InstanceType<T[number]> {
  return types.some((t) => x instanceof t)
}

export interface IConstructor<T> {
  new (...args: DeliberateAny[]): T
}

export type PickPartial<T, K extends keyof T> = { [P in K]: Partial<T[P]> }

export const nameOfType = (x: unknown) => {
  if (typeof x === 'object') {
    if (x === null) return 'Null'
    if (x === undefined) return 'undefined'
    if ('constructor' in x) {
      return x.constructor.name
    }
  }
  return typeof x
}

export type Overloads<T> = T extends {
  (...args: infer P1): infer R1
  (...args: infer P2): infer R2
}
  ? ((...args: P1) => R1) | ((...args: P2) => R2)
  : never
