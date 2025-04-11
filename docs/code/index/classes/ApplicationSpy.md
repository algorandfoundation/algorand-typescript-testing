[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / ApplicationSpy

# Class: ApplicationSpy\<TContract\>

Defined in: [src/application-spy.ts:32](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L32)

## Type Parameters

### TContract

`TContract` *extends* `Contract` = `Contract`

## Constructors

### Constructor

> **new ApplicationSpy**\<`TContract`\>(`contract`?): `ApplicationSpy`\<`TContract`\>

Defined in: [src/application-spy.ts:44](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L44)

#### Parameters

##### contract?

`TContract` | `ConstructorFor`\<`TContract`\>

#### Returns

`ApplicationSpy`\<`TContract`\>

## Properties

### contract?

> `optional` **contract**: `TContract` \| `ConstructorFor`\<`TContract`\>

Defined in: [src/application-spy.ts:42](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L42)

***

### on

> `readonly` **on**: `_TypedApplicationSpyCallBacks`\<`TContract`\>

Defined in: [src/application-spy.ts:39](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L39)

The `on` property is a proxy that allows you to register callbacks for specific method signatures.
It dynamically creates methods based on the contract's methods.

## Methods

### notify()

> **notify**(`itxn`): `void`

Defined in: [src/application-spy.ts:50](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L50)

#### Parameters

##### itxn

`ApplicationCallInnerTxnContext`

#### Returns

`void`

***

### onAbiCall()

> **onAbiCall**(`methodSignature`, `callback`): `void`

Defined in: [src/application-spy.ts:69](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L69)

Registers a callback for a specific method signature.

#### Parameters

##### methodSignature

`bytes`

##### callback

`AppSpyCb`

#### Returns

`void`

***

### onBareCall()

> **onBareCall**(`callback`): `void`

Defined in: [src/application-spy.ts:60](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L60)

Registers a callback for a bare call (no arguments).

#### Parameters

##### callback

`AppSpyCb`

The callback to be executed when a bare call is detected.

#### Returns

`void`
