[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / ApplicationSpy

# Class: ApplicationSpy\<TContract\>

Defined in: [src/application-spy.ts:15](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L15)

## Type Parameters

### TContract

`TContract` *extends* `Contract`

## Constructors

### Constructor

> **new ApplicationSpy**\<`TContract`\>(`contract`): `ApplicationSpy`\<`TContract`\>

Defined in: [src/application-spy.ts:26](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L26)

#### Parameters

##### contract

`TContract` | `ConstructorFor`\<`TContract`\>

#### Returns

`ApplicationSpy`\<`TContract`\>

## Properties

### contract

> **contract**: `TContract` \| `ConstructorFor`\<`TContract`\>

Defined in: [src/application-spy.ts:19](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L19)

## Accessors

### abiCallHooks

#### Get Signature

> **get** **abiCallHooks**(): `BytesMap`\<(`innerTxnContext`) => `void`[]\>

Defined in: [src/application-spy.ts:22](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L22)

##### Returns

`BytesMap`\<(`innerTxnContext`) => `void`[]\>

## Methods

### onAbiCall()

> **onAbiCall**\<`TContract`, `TMethod`\>(`methodSignature`, `callback`): `void`

Defined in: [src/application-spy.ts:49](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/application-spy.ts#L49)

Registers a callback for a specific method signature.

#### Type Parameters

##### TContract

`TContract` *extends* `Contract`

The type of the contract being spied on.

##### TMethod

`TMethod` *extends* `"bareCreate"` \| `InstanceMethod`\<`TContract`\>

The type of the method being spied on.

#### Parameters

##### methodSignature

`TMethod`

The method signature to spy on.

##### callback

(`itxnContext`) => `void`

The callback function to execute when the method is called.

#### Returns

`void`
