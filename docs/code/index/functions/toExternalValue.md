[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / toExternalValue

# Function: toExternalValue()

## Call Signature

> **toExternalValue**(`val`): `bigint`

Defined in: [src/impl/primitives.ts:42](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/impl/primitives.ts#L42)

Converts internal Algorand type representations to their external primitive values.

### Parameters

#### val

`uint64`

A uint64 value to convert

### Returns

`bigint`

The uint64 value as a bigint

The biguint value as a bigint

The bytes value as a Uint8Array

The original string value unchanged

### Example

```ts
const uint64Val = Uint64(123n)
toExternalValue(uint64Val) // returns 123n

const bytesVal = Bytes.fromBase64("SGVsbG8=");
toExternalValue(bytesVal) // returns Uint8Array([72, 101, 108, 108, 111])
```

## Call Signature

> **toExternalValue**(`val`): `bigint`

Defined in: [src/impl/primitives.ts:43](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/impl/primitives.ts#L43)

Converts internal Algorand type representations to their external primitive values.

### Parameters

#### val

`biguint`

A uint64 value to convert

### Returns

`bigint`

The uint64 value as a bigint

The biguint value as a bigint

The bytes value as a Uint8Array

The original string value unchanged

### Example

```ts
const uint64Val = Uint64(123n)
toExternalValue(uint64Val) // returns 123n

const bytesVal = Bytes.fromBase64("SGVsbG8=");
toExternalValue(bytesVal) // returns Uint8Array([72, 101, 108, 108, 111])
```

## Call Signature

> **toExternalValue**(`val`): `Uint8Array`

Defined in: [src/impl/primitives.ts:44](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/impl/primitives.ts#L44)

Converts internal Algorand type representations to their external primitive values.

### Parameters

#### val

`bytes`

A uint64 value to convert

### Returns

`Uint8Array`

The uint64 value as a bigint

The biguint value as a bigint

The bytes value as a Uint8Array

The original string value unchanged

### Example

```ts
const uint64Val = Uint64(123n)
toExternalValue(uint64Val) // returns 123n

const bytesVal = Bytes.fromBase64("SGVsbG8=");
toExternalValue(bytesVal) // returns Uint8Array([72, 101, 108, 108, 111])
```

## Call Signature

> **toExternalValue**(`val`): `string`

Defined in: [src/impl/primitives.ts:45](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/impl/primitives.ts#L45)

Converts internal Algorand type representations to their external primitive values.

### Parameters

#### val

`string`

A uint64 value to convert

### Returns

`string`

The uint64 value as a bigint

The biguint value as a bigint

The bytes value as a Uint8Array

The original string value unchanged

### Example

```ts
const uint64Val = Uint64(123n)
toExternalValue(uint64Val) // returns 123n

const bytesVal = Bytes.fromBase64("SGVsbG8=");
toExternalValue(bytesVal) // returns Uint8Array([72, 101, 108, 108, 111])
```
