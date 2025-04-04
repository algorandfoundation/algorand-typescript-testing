[**@algorandfoundation/algorand-typescript-testing**](../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../README.md) / [index](../README.md) / TestExecutionContext

# Class: TestExecutionContext

Defined in: [src/test-execution-context.ts:22](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L22)

The `TestExecutionContext` class provides a context for executing tests in an Algorand environment.
It manages various contexts such as contract, ledger, and transaction contexts, and provides utilities
for generating values, managing accounts, and handling logic signatures.

## Constructors

### Constructor

> **new TestExecutionContext**(`defaultSenderAddress`?): `TestExecutionContext`

Defined in: [src/test-execution-context.ts:39](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L39)

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

Defined in: [src/test-execution-context.ts:120](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L120)

Returns the active logic signature arguments.

##### Returns

`bytes`[]

***

### any

#### Get Signature

> **get** **any**(): [`ValueGenerator`](../../value-generators/classes/ValueGenerator.md)

Defined in: [src/test-execution-context.ts:93](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L93)

Returns the value generator.

##### Returns

[`ValueGenerator`](../../value-generators/classes/ValueGenerator.md)

***

### contract

#### Get Signature

> **get** **contract**(): [`ContractContext`](../../subcontexts/contract-context/classes/ContractContext.md)

Defined in: [src/test-execution-context.ts:66](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L66)

Returns the contract context.

##### Returns

[`ContractContext`](../../subcontexts/contract-context/classes/ContractContext.md)

***

### defaultSender

#### Get Signature

> **get** **defaultSender**(): `Account`

Defined in: [src/test-execution-context.ts:102](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L102)

Returns the default sender account.

##### Returns

`Account`

#### Set Signature

> **set** **defaultSender**(`val`): `void`

Defined in: [src/test-execution-context.ts:111](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L111)

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

Defined in: [src/test-execution-context.ts:75](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L75)

Returns the ledger context.

##### Returns

[`LedgerContext`](../../subcontexts/ledger-context/classes/LedgerContext.md)

***

### templateVars

#### Get Signature

> **get** **templateVars**(): `Record`\<`string`, `any`\>

Defined in: [src/test-execution-context.ts:129](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L129)

Returns the template variables.

##### Returns

`Record`\<`string`, `any`\>

***

### txn

#### Get Signature

> **get** **txn**(): [`TransactionContext`](../../subcontexts/transaction-context/classes/TransactionContext.md)

Defined in: [src/test-execution-context.ts:84](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L84)

Returns the transaction context.

##### Returns

[`TransactionContext`](../../subcontexts/transaction-context/classes/TransactionContext.md)

## Methods

### addApplicationSpy()

> **addApplicationSpy**\<`TContract`\>(`spy`): `void`

Defined in: [src/test-execution-context.ts:197](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L197)

Adds an application spy to the context.

#### Type Parameters

##### TContract

`TContract` *extends* `Contract`

#### Parameters

##### spy

[`ApplicationSpy`](ApplicationSpy.md)\<`TContract`\>

The application spy to add.

#### Returns

`void`

***

### executeLogicSig()

> **executeLogicSig**(`logicSig`, ...`args`): `boolean` \| `uint64`

Defined in: [src/test-execution-context.ts:140](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L140)

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

Defined in: [src/test-execution-context.ts:57](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L57)

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

### getCompiledAppEntry()

> **getCompiledAppEntry**(`contract`): `undefined` \| \{ `key`: `ConstructorFor`\<`BaseContract`\>; `value`: `uint64`; \}

Defined in: [src/test-execution-context.ts:166](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L166)

Gets a compiled application by contract.

#### Parameters

##### contract

`ConstructorFor`\<`BaseContract`\>

The contract class.

#### Returns

`undefined` \| \{ `key`: `ConstructorFor`\<`BaseContract`\>; `value`: `uint64`; \}

***

### getCompiledLogicSigEntry()

> **getCompiledLogicSigEntry**(`logicsig`): `undefined` \| \{ `key`: `ConstructorFor`\<`LogicSig`\>; `value`: `Account`; \}

Defined in: [src/test-execution-context.ts:207](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L207)

Gets a compiled logic signature.

#### Parameters

##### logicsig

`ConstructorFor`\<`LogicSig`\>

The logic signature class.

#### Returns

`undefined` \| \{ `key`: `ConstructorFor`\<`LogicSig`\>; `value`: `Account`; \}

***

### notifyApplicationSpies()

> **notifyApplicationSpies**(`itxn`): `void`

Defined in: [src/test-execution-context.ts:186](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L186)

#### Parameters

##### itxn

`ApplicationCallInnerTxnContext`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [src/test-execution-context.ts:230](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L230)

Reinitializes the execution context, clearing all state variables and resetting internal components.
Invoked between test cases to ensure isolation.

#### Returns

`void`

***

### setCompiledApp()

> **setCompiledApp**(`c`, `appId`): `void`

Defined in: [src/test-execution-context.ts:176](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L176)

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

### setCompiledLogicSig()

> **setCompiledLogicSig**(`c`, `account`): `void`

Defined in: [src/test-execution-context.ts:217](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L217)

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

Defined in: [src/test-execution-context.ts:156](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-execution-context.ts#L156)

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
