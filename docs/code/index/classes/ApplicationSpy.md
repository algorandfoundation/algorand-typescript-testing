[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / ApplicationSpy

# Class: ApplicationSpy\<TContract\>

Defined in: [src/application-spy.ts:33](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L33)

## Type Parameters

### TContract

`TContract` *extends* `Contract`

## Constructors

### Constructor

> **new ApplicationSpy**\<`TContract`\>(`contract`): `ApplicationSpy`\<`TContract`\>

Defined in: [src/application-spy.ts:45](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L45)

#### Parameters

##### contract

`TContract` | `ConstructorFor`\<`TContract`\>

#### Returns

`ApplicationSpy`\<`TContract`\>

## Properties

### contract

> **contract**: `TContract` \| `ConstructorFor`\<`TContract`\>

Defined in: [src/application-spy.ts:43](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L43)

***

### on

> `readonly` **on**: `_TypedApplicationSpyCallBacks`\<`TContract`\>

Defined in: [src/application-spy.ts:40](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L40)

The `on` property is a proxy that allows you to register callbacks for specific method signatures.
It dynamically creates methods based on the contract's methods.

## Methods

### notify()

> **notify**(`itxn`): `void`

Defined in: [src/application-spy.ts:51](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L51)

#### Parameters

##### itxn

`ApplicationCallInnerTxnContext`

#### Returns

`void`

***

### onBareCall()

> **onBareCall**(`callback`): `void`

Defined in: [src/application-spy.ts:61](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L61)

Registers a callback for a bare call (no arguments).

#### Parameters

##### callback

`AppSpyCb`\<\[\], `unknown`\>

The callback to be executed when a bare call is detected.

#### Returns

`void`
