[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [value-generators/arc4](../README.md) / Arc4ValueGenerator

# Class: Arc4ValueGenerator

Defined in: [src/value-generators/arc4.ts:7](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L7)

## Constructors

### new Arc4ValueGenerator()

> **new Arc4ValueGenerator**(): [`Arc4ValueGenerator`](Arc4ValueGenerator.md)

#### Returns

[`Arc4ValueGenerator`](Arc4ValueGenerator.md)

## Methods

### address()

> **address**(): `Address`

Defined in: [src/value-generators/arc4.ts:12](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L12)

Generate a random Algorand address.
@returns: A new, random Algorand address.

#### Returns

`Address`

***

### dynamicBytes()

> **dynamicBytes**(`n`): `DynamicBytes`

Defined in: [src/value-generators/arc4.ts:97](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L97)

Generate a random dynamic bytes of size `n` bits.

#### Parameters

##### n

`number`

#### Returns

`DynamicBytes`

***

### str()

> **str**(`n`): `Str`

Defined in: [src/value-generators/arc4.ts:109](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L109)

Generate a random dynamic string of size `n` bits.

#### Parameters

##### n

`number`

#### Returns

`Str`

***

### uintN128()

> **uintN128**(`minValue`, `maxValue`): `UintN128`

Defined in: [src/value-generators/arc4.ts:67](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L67)

Generate a random UintN128 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN128`

***

### uintN16()

> **uintN16**(`minValue`, `maxValue`): `UintN16`

Defined in: [src/value-generators/arc4.ts:37](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L37)

Generate a random UintN16 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN16`

***

### uintN256()

> **uintN256**(`minValue`, `maxValue`): `UintN256`

Defined in: [src/value-generators/arc4.ts:77](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L77)

Generate a random UintN256 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN256`

***

### uintN32()

> **uintN32**(`minValue`, `maxValue`): `UintN32`

Defined in: [src/value-generators/arc4.ts:47](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L47)

Generate a random UintN32 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN32`

***

### uintN512()

> **uintN512**(`minValue`, `maxValue`): `UintN`\<`512`\>

Defined in: [src/value-generators/arc4.ts:87](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L87)

Generate a random UintN512 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN`\<`512`\>

***

### uintN64()

> **uintN64**(`minValue`, `maxValue`): `UintN64`

Defined in: [src/value-generators/arc4.ts:57](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L57)

Generate a random UintN64 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN64`

***

### uintN8()

> **uintN8**(`minValue`, `maxValue`): `UintN8`

Defined in: [src/value-generators/arc4.ts:27](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L27)

Generate a random UintN8 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`UintN8`
