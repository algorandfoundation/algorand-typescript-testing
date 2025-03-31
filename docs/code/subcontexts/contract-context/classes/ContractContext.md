[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/contract-context](../README.md) / ContractContext

# Class: ContractContext

Defined in: [src/subcontexts/contract-context.ts:138](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/contract-context.ts#L138)

Provides a context for creating contracts and registering created contract instances
with test execution context.

## Constructors

### new ContractContext()

> **new ContractContext**(): [`ContractContext`](ContractContext.md)

#### Returns

[`ContractContext`](ContractContext.md)

## Methods

### create()

> **create**\<`T`\>(`type`, ...`args`): `T`

Defined in: [src/subcontexts/contract-context.ts:150](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/contract-context.ts#L150)

Creates a new contract instance and register the created instance with test execution context.

#### Type Parameters

• **T** *extends* `BaseContract`

Type of contract extending BaseContract

#### Parameters

##### type

`IConstructor`\<`T`\>

The contract class constructor

##### args

...`any`[]

Constructor arguments for the contract

#### Returns

`T`

Proxied instance of the contract

#### Example

```ts
const ctx = new TestExecutionContext();
const contract = ctx.contract.create(MyContract);
```

***

### createMethodCallTxns()

> `static` **createMethodCallTxns**\<`TParams`\>(`contract`, `abiMetadata`, ...`args`): `Transaction`[]

Defined in: [src/subcontexts/contract-context.ts:172](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/contract-context.ts#L172)

**`Internal`**

Creates an array of transactions for calling a contract method.

#### Type Parameters

• **TParams** *extends* `unknown`[]

Array of parameter types

#### Parameters

##### contract

`BaseContract`

The contract instance

##### abiMetadata

ABI metadata for the method

`undefined` | `AbiMetadata`

##### args

...`TParams`

Method arguments

#### Returns

`Transaction`[]

Array of transactions needed to execute the method

#### Example

```ts
const txns = ContractContext.createMethodCallTxns(
  myContract,
  methodAbiMetadata,
  arg1,
  arg2
);
```
