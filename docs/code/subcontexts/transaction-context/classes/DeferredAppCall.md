[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / DeferredAppCall

# Class: DeferredAppCall\<TParams, TReturn\>

Defined in: [src/subcontexts/transaction-context.ts:59](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L59)

Represents a deferred application call.

## Type Parameters

### TParams

`TParams` *extends* `unknown`[]

### TReturn

`TReturn`

## Constructors

### Constructor

> **new DeferredAppCall**\<`TParams`, `TReturn`\>(`appId`, `txns`, `method`, `abiMetadata`, `args`): `DeferredAppCall`\<`TParams`, `TReturn`\>

Defined in: [src/subcontexts/transaction-context.ts:60](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L60)

#### Parameters

##### appId

`uint64`

##### txns

`Transaction`[]

##### method

(...`args`) => `TReturn`

##### abiMetadata

`AbiMetadata`

##### args

`TParams`

#### Returns

`DeferredAppCall`\<`TParams`, `TReturn`\>

## Properties

### txns

> `readonly` **txns**: `Transaction`[]

Defined in: [src/subcontexts/transaction-context.ts:62](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L62)

## Methods

### submit()

> **submit**(): `TReturn`

Defined in: [src/subcontexts/transaction-context.ts:72](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L72)

Submits the deferred application call.

#### Returns

`TReturn`

The result of the application call.
