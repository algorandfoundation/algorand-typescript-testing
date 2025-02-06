[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [value-generators/avm](../README.md) / AvmValueGenerator

# Class: AvmValueGenerator

Defined in: [src/value-generators/avm.ts:31](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L31)

## Extended by

- [`ValueGenerator`](../../classes/ValueGenerator.md)

## Constructors

### new AvmValueGenerator()

> **new AvmValueGenerator**(): [`AvmValueGenerator`](AvmValueGenerator.md)

#### Returns

[`AvmValueGenerator`](AvmValueGenerator.md)

## Methods

### account()

> **account**(`input`?): `Account`

Defined in: [src/value-generators/avm.ts:95](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L95)

Generates a random account with the specified context data.

#### Parameters

##### input?

`AccountContextData`

The context data for the account.

#### Returns

`Account`

- A random account.

***

### application()

> **application**(`input`?): `Application`

Defined in: [src/value-generators/avm.ts:153](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L153)

Generates a random application with the specified context data.

#### Parameters

##### input?

`ApplicationContextData`

The context data for the application.

#### Returns

`Application`

- A random application.

***

### asset()

> **asset**(`input`?): `Asset`

Defined in: [src/value-generators/avm.ts:133](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L133)

Generates a random asset with the specified context data.

#### Parameters

##### input?

`AssetContextData`

The context data for the asset.

#### Returns

`Asset`

- A random asset.

***

### biguint()

> **biguint**(`minValue`?): `biguint`

Defined in: [src/value-generators/avm.ts:58](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L58)

Generates a random biguint value within the specified range.

#### Parameters

##### minValue?

`StubBigUintCompat` = `0n`

The minimum value (inclusive).

#### Returns

`biguint`

- A random biguint value.

***

### bytes()

> **bytes**(`length`?): `bytes`

Defined in: [src/value-generators/avm.ts:72](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L72)

Generates a random bytes of the specified length.

#### Parameters

##### length?

`number` = `MAX_BYTES_SIZE`

The length of the bytes.

#### Returns

`bytes`

- A random bytes.

***

### string()

> **string**(`length`?): `string`

Defined in: [src/value-generators/avm.ts:81](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L81)

Generates a random string of the specified length.

#### Parameters

##### length?

`number` = `11`

The length of the string.

#### Returns

`string`

- A random string.

***

### uint64()

> **uint64**(`minValue`?, `maxValue`?): `uint64`

Defined in: [src/value-generators/avm.ts:38](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/avm.ts#L38)

Generates a random uint64 value within the specified range.

#### Parameters

##### minValue?

`StubUint64Compat` = `0n`

The minimum value (inclusive).

##### maxValue?

`StubUint64Compat` = `MAX_UINT64`

The maximum value (inclusive).

#### Returns

`uint64`

- A random uint64 value.
