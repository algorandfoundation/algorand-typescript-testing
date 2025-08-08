[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [value-generators/arc4](../README.md) / Arc4ValueGenerator

# Class: Arc4ValueGenerator

Defined in: [src/value-generators/arc4.ts:7](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L7)

## Constructors

### Constructor

> **new Arc4ValueGenerator**(): `Arc4ValueGenerator`

#### Returns

`Arc4ValueGenerator`

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

### uint128()

> **uint128**(`minValue`, `maxValue`): `Uint128`

Defined in: [src/value-generators/arc4.ts:67](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L67)

Generate a random Uint128 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint128`

***

### uint16()

> **uint16**(`minValue`, `maxValue`): `Uint16`

Defined in: [src/value-generators/arc4.ts:37](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L37)

Generate a random Uint16 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint16`

***

### uint256()

> **uint256**(`minValue`, `maxValue`): `Uint256`

Defined in: [src/value-generators/arc4.ts:77](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L77)

Generate a random Uint256 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint256`

***

### uint32()

> **uint32**(`minValue`, `maxValue`): `Uint32`

Defined in: [src/value-generators/arc4.ts:47](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L47)

Generate a random Uint32 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint32`

***

### uint512()

> **uint512**(`minValue`, `maxValue`): `Uint`\<`512`\>

Defined in: [src/value-generators/arc4.ts:87](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L87)

Generate a random Uint512 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint`\<`512`\>

***

### uint64()

> **uint64**(`minValue`, `maxValue`): `Uint64`

Defined in: [src/value-generators/arc4.ts:57](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L57)

Generate a random Uint64 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint64`

***

### uint8()

> **uint8**(`minValue`, `maxValue`): `Uint8`

Defined in: [src/value-generators/arc4.ts:27](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/arc4.ts#L27)

Generate a random Uint8 within the specified range.

#### Parameters

##### minValue

`number` | `bigint`

##### maxValue

`number` | `bigint`

#### Returns

`Uint8`
