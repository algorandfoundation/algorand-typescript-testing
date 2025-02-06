[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / DeferredAppCall

# Class: DeferredAppCall\<TParams, TReturn\>

Defined in: [src/subcontexts/transaction-context.ts:60](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L60)

Represents a deferred application call.

## Type Parameters

• **TParams** *extends* `unknown`[]

• **TReturn**

## Constructors

### new DeferredAppCall()

> **new DeferredAppCall**\<`TParams`, `TReturn`\>(`appId`, `txns`, `method`, `abiMetadata`, `args`): [`DeferredAppCall`](DeferredAppCall.md)\<`TParams`, `TReturn`\>

Defined in: [src/subcontexts/transaction-context.ts:61](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L61)

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

[`DeferredAppCall`](DeferredAppCall.md)\<`TParams`, `TReturn`\>

## Properties

### txns

> `readonly` **txns**: `Transaction`[]

Defined in: [src/subcontexts/transaction-context.ts:63](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L63)

## Methods

### submit()

> **submit**(): `TReturn`

Defined in: [src/subcontexts/transaction-context.ts:73](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L73)

Submits the deferred application call.

#### Returns

`TReturn`

The result of the application call.
