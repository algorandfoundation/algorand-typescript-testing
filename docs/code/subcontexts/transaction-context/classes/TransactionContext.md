[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / TransactionContext

# Class: TransactionContext

Defined in: [src/subcontexts/transaction-context.ts:82](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L82)

Manages transaction contexts and groups.

## Constructors

### new TransactionContext()

> **new TransactionContext**(): [`TransactionContext`](TransactionContext.md)

#### Returns

[`TransactionContext`](TransactionContext.md)

## Properties

### groups

> `readonly` **groups**: [`TransactionGroup`](TransactionGroup.md)[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:83](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L83)

## Accessors

### activeGroup

#### Get Signature

> **get** **activeGroup**(): [`TransactionGroup`](TransactionGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:139](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L139)

Gets the active transaction group.

##### Throws

If there is no active transaction group.

##### Returns

[`TransactionGroup`](TransactionGroup.md)

The active transaction group.

***

### lastActive

#### Get Signature

> **get** **lastActive**(): `Transaction`

Defined in: [src/subcontexts/transaction-context.ts:162](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L162)

Gets the last active transaction.

##### Returns

`Transaction`

The last active transaction.

***

### lastGroup

#### Get Signature

> **get** **lastGroup**(): [`TransactionGroup`](TransactionGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:151](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L151)

Gets the last transaction group.

##### Throws

If there are no transaction groups.

##### Returns

[`TransactionGroup`](TransactionGroup.md)

The last transaction group.

## Methods

### appendLog()

> **appendLog**(`value`): `void`

Defined in: [src/subcontexts/transaction-context.ts:172](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L172)

**`Internal`**

Appends a log to the active transaction.

#### Parameters

##### value

`StubBytesCompat`

The log value.

#### Returns

`void`

#### Throws

If the active transaction is not an application call.

***

### createScope()

> **createScope**(`group`, `activeTransactionIndex`?): `ExecutionScope`

Defined in: [src/subcontexts/transaction-context.ts:92](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L92)

Creates a new execution scope for a group of transactions.

#### Parameters

##### group

(`Transaction` \| [`DeferredAppCall`](DeferredAppCall.md)\<`any`[], `any`\>)[]

The group of transactions or deferred application calls.

##### activeTransactionIndex?

`number`

The index of the active transaction.

#### Returns

`ExecutionScope`

The execution scope.

***

### deferAppCall()

> **deferAppCall**\<`TContract`, `TParams`, `TReturn`\>(`contract`, `method`, `methodName`, ...`args`): [`DeferredAppCall`](DeferredAppCall.md)\<`TParams`, `TReturn`\>

Defined in: [src/subcontexts/transaction-context.ts:188](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L188)

Defers an application call.

#### Type Parameters

• **TContract** *extends* `Contract`

• **TParams** *extends* `unknown`[]

• **TReturn**

#### Parameters

##### contract

`TContract`

The contract.

##### method

(...`args`) => `TReturn`

The method to call.

##### methodName

`FunctionKeys`\<`TContract`\>

The name of the method.

##### args

...`TParams`

The arguments for the method.

#### Returns

[`DeferredAppCall`](DeferredAppCall.md)\<`TParams`, `TReturn`\>

The deferred application call.

***

### ensureScope()

> **ensureScope**(`group`, `activeTransactionIndex`?): `ExecutionScope`

Defined in: [src/subcontexts/transaction-context.ts:123](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L123)

**`Internal`**

Ensures that a scope is created for the given group of transactions.

#### Parameters

##### group

`Transaction`[]

The group of transactions.

##### activeTransactionIndex?

`number`

The index of the active transaction.

#### Returns

`ExecutionScope`

The execution scope.

***

### exportLogs()

> **exportLogs**\<`T`\>(`appId`, ...`decoding`): `DecodedLogs`\<`T`\>

Defined in: [src/subcontexts/transaction-context.ts:206](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L206)

Exports logs for the given application ID.

#### Type Parameters

• **T** *extends* `LogDecoding`[]

#### Parameters

##### appId

`uint64`

The application ID.

##### decoding

...`T`

The log decoding.

#### Returns

`DecodedLogs`\<`T`\>

The decoded logs.
