[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / AssertError

# Class: AssertError

Defined in: [src/errors.ts:22](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/errors.ts#L22)

Raised when an assertion fails

## Extends

- [`AvmError`](AvmError.md)

## Constructors

### new AssertError()

> **new AssertError**(`message`): [`AssertError`](AssertError.md)

Defined in: [src/errors.ts:23](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/errors.ts#L23)

#### Parameters

##### message

`string`

#### Returns

[`AssertError`](AssertError.md)

#### Overrides

[`AvmError`](AvmError.md).[`constructor`](AvmError.md#constructors)

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

[`AvmError`](AvmError.md).[`cause`](AvmError.md#cause)

***

### message

> **message**: `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

[`AvmError`](AvmError.md).[`message`](AvmError.md#message-1)

***

### name

> **name**: `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`AvmError`](AvmError.md).[`name`](AvmError.md#name)

***

### stack?

> `optional` **stack**: `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

[`AvmError`](AvmError.md).[`stack`](AvmError.md#stack)

***

### prepareStackTrace()?

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Defined in: node\_modules/@types/node/globals.d.ts:143

Optional override for formatting stack traces

#### Parameters

##### err

`Error`

##### stackTraces

`CallSite`[]

#### Returns

`any`

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[`AvmError`](AvmError.md).[`prepareStackTrace`](AvmError.md#preparestacktrace)

***

### stackTraceLimit

> `static` **stackTraceLimit**: `number`

Defined in: node\_modules/@types/node/globals.d.ts:145

#### Inherited from

[`AvmError`](AvmError.md).[`stackTraceLimit`](AvmError.md#stacktracelimit)

## Methods

### captureStackTrace()

> `static` **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Defined in: node\_modules/@types/node/globals.d.ts:136

Create .stack property on a target object

#### Parameters

##### targetObject

`object`

##### constructorOpt?

`Function`

#### Returns

`void`

#### Inherited from

[`AvmError`](AvmError.md).[`captureStackTrace`](AvmError.md#capturestacktrace)
