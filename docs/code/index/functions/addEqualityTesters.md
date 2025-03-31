[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / addEqualityTesters

# Function: addEqualityTesters()

> **addEqualityTesters**(`params`): `void`

Defined in: [src/set-up.ts:159](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/set-up.ts#L159)

Adds custom equality testers for Algorand types to vitest's expect function.
This allows vitest to properly compare Algorand types such as uint64, biguint, and bytes
against JS native types such as number, bigint and Uint8Array, in tests.

## Parameters

### params

The parameters object

#### expect

`ExpectObj`

vitest's expect object to extend with custom equality testers

## Returns

`void`

## Example

```ts
import { beforeAll, expect } from 'vitest'
import { addEqualityTesters } from '@algorandfoundation/algorand-typescript-testing';

beforeAll(() => {
  addEqualityTesters({ expect });
});
```
