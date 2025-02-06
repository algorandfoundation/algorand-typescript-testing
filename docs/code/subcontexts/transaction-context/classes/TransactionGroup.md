[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / TransactionGroup

# Class: TransactionGroup

Defined in: [src/subcontexts/transaction-context.ts:224](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L224)

Represents a group of transactions.

## Constructors

### new TransactionGroup()

> **new TransactionGroup**(`transactions`, `activeTransactionIndex`?): [`TransactionGroup`](TransactionGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:231](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L231)

#### Parameters

##### transactions

`Transaction`[]

##### activeTransactionIndex?

`number`

#### Returns

[`TransactionGroup`](TransactionGroup.md)

## Properties

### activeTransactionIndex

> **activeTransactionIndex**: `number`

Defined in: [src/subcontexts/transaction-context.ts:225](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L225)

***

### constructingItxnGroup

> **constructingItxnGroup**: `InnerTxnFields`[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:229](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L229)

***

### itxnGroups

> **itxnGroups**: [`ItxnGroup`](ItxnGroup.md)[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:228](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L228)

***

### latestTimestamp

> **latestTimestamp**: `number`

Defined in: [src/subcontexts/transaction-context.ts:226](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L226)

***

### transactions

> **transactions**: `Transaction`[]

Defined in: [src/subcontexts/transaction-context.ts:227](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L227)

## Accessors

### activeApplicationId

#### Get Signature

> **get** **activeApplicationId**(): `uint64`

Defined in: [src/subcontexts/transaction-context.ts:254](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L254)

Gets the active application ID.

##### Throws

If there are no transactions in the group or the active transaction is not an application call.

##### Returns

`uint64`

The active application ID.

***

### activeTransaction

#### Get Signature

> **get** **activeTransaction**(): `Transaction`

Defined in: [src/subcontexts/transaction-context.ts:245](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L245)

Gets the active transaction.

##### Returns

`Transaction`

The active transaction.

***

### constructingItxn

#### Get Signature

> **get** **constructingItxn**(): `InnerTxnFields`

Defined in: [src/subcontexts/transaction-context.ts:263](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L263)

##### Returns

`InnerTxnFields`

## Methods

### addInnerTransactionGroup()

> **addInnerTransactionGroup**(...`itxns`): `void`

Defined in: [src/subcontexts/transaction-context.ts:302](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L302)

**`Internal`**

Adds a group of inner transactions.

#### Parameters

##### itxns

...`InnerTxn`[]

The inner transactions.

#### Returns

`void`

***

### appendInnerTransactionGroup()

> **appendInnerTransactionGroup**(): `void`

Defined in: [src/subcontexts/transaction-context.ts:327](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L327)

**`Internal`**

Appends a new inner transaction to the current group.

#### Returns

`void`

#### Throws

If there is no inner transaction group being constructed.

***

### beginInnerTransactionGroup()

> **beginInnerTransactionGroup**(): `void`

Defined in: [src/subcontexts/transaction-context.ts:311](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L311)

**`Internal`**

Begins a new inner transaction group.

#### Returns

`void`

#### Throws

If there is already an inner transaction group being constructed or the active transaction is not an application call.

***

### getApplicationTransaction()

> **getApplicationTransaction**(`index`?): `ApplicationTransaction`

Defined in: [src/subcontexts/transaction-context.ts:384](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L384)

Gets an application transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`ApplicationTransaction`

The application transaction.

***

### getAssetConfigTransaction()

> **getAssetConfigTransaction**(`index`?): `AssetConfigTransaction`

Defined in: [src/subcontexts/transaction-context.ts:393](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L393)

Gets an asset configuration transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetConfigTransaction`

The asset configuration transaction.

***

### getAssetFreezeTransaction()

> **getAssetFreezeTransaction**(`index`?): `AssetFreezeTransaction`

Defined in: [src/subcontexts/transaction-context.ts:411](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L411)

Gets an asset freeze transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetFreezeTransaction`

The asset freeze transaction.

***

### getAssetTransferTransaction()

> **getAssetTransferTransaction**(`index`?): `AssetTransferTransaction`

Defined in: [src/subcontexts/transaction-context.ts:402](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L402)

Gets an asset transfer transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetTransferTransaction`

The asset transfer transaction.

***

### getItxnGroup()

> **getItxnGroup**(`index`?): [`ItxnGroup`](ItxnGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:366](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L366)

Gets an inner transaction group by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the group. If not provided, the last group is returned.

#### Returns

[`ItxnGroup`](ItxnGroup.md)

The inner transaction group.

#### Throws

If the index is invalid or there are no previous inner transactions.

***

### getKeyRegistrationTransaction()

> **getKeyRegistrationTransaction**(`index`?): `KeyRegistrationTransaction`

Defined in: [src/subcontexts/transaction-context.ts:420](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L420)

Gets a key registration transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`KeyRegistrationTransaction`

The key registration transaction.

***

### getPaymentTransaction()

> **getPaymentTransaction**(`index`?): `PaymentTransaction`

Defined in: [src/subcontexts/transaction-context.ts:429](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L429)

Gets a payment transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`PaymentTransaction`

The payment transaction.

***

### getScratchSlot()

> **getScratchSlot**(`index`): `bytes` \| `uint64`

Defined in: [src/subcontexts/transaction-context.ts:283](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L283)

Gets the scratch slot of the active transaction.

#### Parameters

##### index

`StubUint64Compat`

The index of the scratch slot.

#### Returns

`bytes` \| `uint64`

The scratch slot value.

***

### getScratchSpace()

> **getScratchSpace**(): (`bytes` \| `uint64`)[]

Defined in: [src/subcontexts/transaction-context.ts:274](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L274)

Gets the scratch space of the active transaction.

#### Returns

(`bytes` \| `uint64`)[]

The scratch space.

***

### getTransaction()

> **getTransaction**(`index`?): `Transaction`

Defined in: [src/subcontexts/transaction-context.ts:438](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L438)

Gets a transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`Transaction`

The transaction.

***

### lastItxnGroup()

> **lastItxnGroup**(): [`ItxnGroup`](ItxnGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:356](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L356)

Gets the last inner transaction group.

#### Returns

[`ItxnGroup`](ItxnGroup.md)

The last inner transaction group.

***

### patchActiveTransactionFields()

> **patchActiveTransactionFields**(`fields`): `void`

Defined in: [src/subcontexts/transaction-context.ts:291](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L291)

Patches the fields of the active transaction.

#### Parameters

##### fields

`AllTransactionFields`

The fields to patch.

#### Returns

`void`

***

### submitInnerTransactionGroup()

> **submitInnerTransactionGroup**(): `void`

Defined in: [src/subcontexts/transaction-context.ts:339](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L339)

**`Internal`**

Submits the current inner transaction group.

#### Returns

`void`

#### Throws

If there is no inner transaction group being constructed or the group exceeds the maximum size.
