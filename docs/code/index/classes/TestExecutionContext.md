[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / TestExecutionContext

# Class: TestExecutionContext

Defined in: [src/test-execution-context.ts:29](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L29)

The `TestExecutionContext` class provides a context for executing tests in an Algorand environment.
It manages various contexts such as contract, ledger, and transaction contexts, and provides utilities
for generating values, managing accounts, and handling logic signatures.

## Constructors

### Constructor

> **new TestExecutionContext**(`defaultSenderAddress`?): `TestExecutionContext`

Defined in: [src/test-execution-context.ts:54](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L54)

Creates an instance of `TestExecutionContext`.

#### Parameters

##### defaultSenderAddress?

`bytes`

The default sender address.

#### Returns

`TestExecutionContext`

## Accessors

### activeLogicSigArgs

#### Get Signature

> **get** **activeLogicSigArgs**(): `bytes`[]

Defined in: [src/test-execution-context.ts:135](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L135)

Returns the active logic signature arguments.

##### Returns

`bytes`[]

***

### any

#### Get Signature

> **get** **any**(): [`ValueGenerator`](../../value-generators/classes/ValueGenerator.md)

Defined in: [src/test-execution-context.ts:108](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L108)

Returns the value generator.

##### Returns

[`ValueGenerator`](../../value-generators/classes/ValueGenerator.md)

***

### contract

#### Get Signature

> **get** **contract**(): [`ContractContext`](../../subcontexts/contract-context/classes/ContractContext.md)

Defined in: [src/test-execution-context.ts:81](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L81)

Returns the contract context.

##### Returns

[`ContractContext`](../../subcontexts/contract-context/classes/ContractContext.md)

***

### defaultSender

#### Get Signature

> **get** **defaultSender**(): `Account`

Defined in: [src/test-execution-context.ts:117](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L117)

Returns the default sender account.

##### Returns

`Account`

#### Set Signature

> **set** **defaultSender**(`val`): `void`

Defined in: [src/test-execution-context.ts:126](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L126)

Sets the default sender account.

##### Parameters

###### val

The default sender account.

`bytes` | `Account`

##### Returns

`void`

***

### ledger

#### Get Signature

> **get** **ledger**(): [`LedgerContext`](../../subcontexts/ledger-context/classes/LedgerContext.md)

Defined in: [src/test-execution-context.ts:90](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L90)

Returns the ledger context.

##### Returns

[`LedgerContext`](../../subcontexts/ledger-context/classes/LedgerContext.md)

***

### templateVars

#### Get Signature

> **get** **templateVars**(): `Record`\<`string`, `any`\>

Defined in: [src/test-execution-context.ts:144](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L144)

Returns the template variables.

##### Returns

`Record`\<`string`, `any`\>

***

### txn

#### Get Signature

> **get** **txn**(): [`TransactionContext`](../../subcontexts/transaction-context/classes/TransactionContext.md)

Defined in: [src/test-execution-context.ts:99](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L99)

Returns the transaction context.

##### Returns

[`TransactionContext`](../../subcontexts/transaction-context/classes/TransactionContext.md)

## Methods

### executeLogicSig()

> **executeLogicSig**(`logicSig`, ...`args`): `boolean` \| `uint64`

Defined in: [src/test-execution-context.ts:155](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L155)

Executes a logic signature with the given arguments.

#### Parameters

##### logicSig

`LogicSig`

The logic signature to execute.

##### args

...`bytes`[]

The arguments for the logic signature.

#### Returns

`boolean` \| `uint64`

***

### exportLogs()

> **exportLogs**\<`T`\>(`appId`, ...`decoding`): `DecodedLogs`\<`T`\>

Defined in: [src/test-execution-context.ts:72](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L72)

Exports logs for a given application ID and decoding.

#### Type Parameters

##### T

`T` *extends* `LogDecoding`[]

#### Parameters

##### appId

`uint64`

The application ID.

##### decoding

...`T`

The log decoding.

#### Returns

`DecodedLogs`\<`T`\>

***

### getAbiCallResponse()

> **getAbiCallResponse**\<`TArgs`, `TReturn`\>(`method`): `undefined` \| \[`InstanceMethod`\<`Contract`, `any`[], `any`\>, (`args`) => \{ `itxn`: `ApplicationCallInnerTxn`; \} \| \{ `itxn`: `ApplicationCallInnerTxn`; `returnValue`: `any`; \}\]

Defined in: [src/test-execution-context.ts:237](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L237)

Gets an ABI call response for a given method.

#### Type Parameters

##### TArgs

`TArgs` *extends* `any`[]

##### TReturn

`TReturn`

#### Parameters

##### method

`InstanceMethod`\<`Contract`, `TArgs`, `TReturn`\>

The method to get the ABI call response for.

#### Returns

`undefined` \| \[`InstanceMethod`\<`Contract`, `any`[], `any`\>, (`args`) => \{ `itxn`: `ApplicationCallInnerTxn`; \} \| \{ `itxn`: `ApplicationCallInnerTxn`; `returnValue`: `any`; \}\]

***

### getCompiledApp()

> **getCompiledApp**(`contract`): `undefined` \| \[`ConstructorFor`\<`BaseContract`\>, `uint64`\]

Defined in: [src/test-execution-context.ts:181](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L181)

Gets a compiled application by contract.

#### Parameters

##### contract

`ConstructorFor`\<`BaseContract`\>

The contract class.

#### Returns

`undefined` \| \[`ConstructorFor`\<`BaseContract`\>, `uint64`\]

***

### getCompiledAppProxy()

> **getCompiledAppProxy**\<`TContract`\>(`contract`): `undefined` \| \[`ConstructorFor`\<`Contract`\>, `Partial`\<`Application` & `PickPartial`\<`ContractProxy`\<`Contract`\>, `"call"` \| `"bareCreate"`\>\>\]

Defined in: [src/test-execution-context.ts:206](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L206)

Gets a compiled application proxy by contract.

#### Type Parameters

##### TContract

`TContract` *extends* `Contract`

#### Parameters

##### contract

`ConstructorFor`\<`TContract`\>

The contract class.

#### Returns

`undefined` \| \[`ConstructorFor`\<`Contract`\>, `Partial`\<`Application` & `PickPartial`\<`ContractProxy`\<`Contract`\>, `"call"` \| `"bareCreate"`\>\>\]

***

### getCompiledLogicSig()

> **getCompiledLogicSig**(`logicsig`): `undefined` \| \[`ConstructorFor`\<`LogicSig`\>, `Account`\]

Defined in: [src/test-execution-context.ts:268](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L268)

Gets a compiled logic signature.

#### Parameters

##### logicsig

`ConstructorFor`\<`LogicSig`\>

The logic signature class.

#### Returns

`undefined` \| \[`ConstructorFor`\<`LogicSig`\>, `Account`\]

***

### reset()

> **reset**(): `void`

Defined in: [src/test-execution-context.ts:291](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L291)

Reinitializes the execution context, clearing all state variables and resetting internal components.
Invoked between test cases to ensure isolation.

#### Returns

`void`

***

### setAbiCallResponse()

> **setAbiCallResponse**\<`TArgs`, `TReturn`\>(`method`, `call`): `void`

Defined in: [src/test-execution-context.ts:247](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L247)

Sets an ABI call response for a given method.

#### Type Parameters

##### TArgs

`TArgs` *extends* `any`[]

##### TReturn

`TReturn`

#### Parameters

##### method

`InstanceMethod`\<`Contract`, `TArgs`, `TReturn`\>

The method to set the ABI call response for.

##### call

(`args`) => `TypedApplicationCallResponse`\<`TReturn`\>

The mock call function.

#### Returns

`void`

***

### setCompiledApp()

> **setCompiledApp**(`c`, `appId`): `void`

Defined in: [src/test-execution-context.ts:191](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L191)

Sets a compiled application.

#### Parameters

##### c

`ConstructorFor`\<`BaseContract`\>

The contract class.

##### appId

`uint64`

The application ID.

#### Returns

`void`

***

### setCompiledAppProxy()

> **setCompiledAppProxy**\<`TContract`\>(`c`, `compiledProxy`): `void`

Defined in: [src/test-execution-context.ts:216](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L216)

Sets a compiled application proxy.

#### Type Parameters

##### TContract

`TContract` *extends* `Contract`

#### Parameters

##### c

`ConstructorFor`\<`TContract`\>

The contract class.

##### compiledProxy

`Partial`\<`Application` & `PickPartial`\<`ContractProxy`\<`TContract`\>, `"call"` \| `"bareCreate"`\>\>

The compiled proxy.

#### Returns

`void`

***

### setCompiledLogicSig()

> **setCompiledLogicSig**(`c`, `account`): `void`

Defined in: [src/test-execution-context.ts:278](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L278)

Sets a compiled logic signature.

#### Parameters

##### c

`ConstructorFor`\<`LogicSig`\>

The logic signature class.

##### account

`Account`

The account associated with the logic signature.

#### Returns

`void`

***

### setTemplateVar()

> **setTemplateVar**(`name`, `value`, `prefix`?): `void`

Defined in: [src/test-execution-context.ts:171](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L171)

Sets a template variable.

#### Parameters

##### name

`string`

The name of the template variable.

##### value

`any`

The value of the template variable.

##### prefix?

`string`

The prefix for the template variable.

#### Returns

`void`
