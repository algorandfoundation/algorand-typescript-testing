[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / ApplicationSpy

# Class: ApplicationSpy\<TContract\>

Defined in: [src/application-spy.ts:34](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L34)

## Type Parameters

### TContract

`TContract` *extends* `Contract` = `Contract`

## Constructors

### Constructor

> **new ApplicationSpy**\<`TContract`\>(`contract`?): `ApplicationSpy`\<`TContract`\>

Defined in: [src/application-spy.ts:46](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L46)

#### Parameters

##### contract?

`TContract` | `ConstructorFor`\<`TContract`\>

#### Returns

`ApplicationSpy`\<`TContract`\>

## Properties

### contract?

> `optional` **contract**: `TContract` \| `ConstructorFor`\<`TContract`\>

Defined in: [src/application-spy.ts:44](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L44)

***

### on

> `readonly` **on**: `_TypedApplicationSpyCallBacks`\<`TContract`\>

Defined in: [src/application-spy.ts:41](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L41)

The `on` property is a proxy that allows you to register callbacks for specific method signatures.
It dynamically creates methods based on the contract's methods.

## Methods

### notify()

> **notify**(`itxn`): `void`

Defined in: [src/application-spy.ts:52](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L52)

#### Parameters

##### itxn

`ApplicationCallInnerTxnContext`

#### Returns

`void`

***

### onAbiCall()

#### Call Signature

> **onAbiCall**(`methodSignature`, `callback`): `void`

Defined in: [src/application-spy.ts:80](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L80)

Registers a callback for a specific method signature.

##### Parameters

###### methodSignature

`bytes`

###### callback

`AppSpyCb`

##### Returns

`void`

#### Call Signature

> **onAbiCall**(`methodSignature`, `ocas`, `callback`): `void`

Defined in: [src/application-spy.ts:81](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L81)

Registers a callback for a specific method signature.

##### Parameters

###### methodSignature

`bytes`

###### ocas

`OnCompleteAction`[]

###### callback

`AppSpyCb`

##### Returns

`void`

***

### onBareCall()

#### Call Signature

> **onBareCall**(`callback`): `void`

Defined in: [src/application-spy.ts:62](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L62)

Registers a callback for a bare call (no arguments).

##### Parameters

###### callback

`AppSpyCb`

The callback to be executed when a bare call is detected.

##### Returns

`void`

#### Call Signature

> **onBareCall**(`ocas`, `callback`): `void`

Defined in: [src/application-spy.ts:63](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L63)

Registers a callback for a bare call (no arguments).

##### Parameters

###### ocas

`OnCompleteAction`[]

###### callback

`AppSpyCb`

The callback to be executed when a bare call is detected.

##### Returns

`void`
