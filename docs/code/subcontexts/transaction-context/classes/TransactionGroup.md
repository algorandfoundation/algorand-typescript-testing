[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / TransactionGroup

# Class: TransactionGroup

Defined in: [src/subcontexts/transaction-context.ts:233](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L233)

Represents a group of transactions.

## Constructors

### new TransactionGroup()

> **new TransactionGroup**(`transactions`, `activeTransactionIndex`?): [`TransactionGroup`](TransactionGroup.md)

Defined in: [src/subcontexts/transaction-context.ts:240](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L240)

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

Defined in: [src/subcontexts/transaction-context.ts:234](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L234)

***

### constructingItxnGroup

> **constructingItxnGroup**: `InnerTxnFields`[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:238](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L238)

***

### itxnGroups

> **itxnGroups**: [`ItxnGroup`](ItxnGroup.md)[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:237](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L237)

***

### latestTimestamp

> **latestTimestamp**: `number`

Defined in: [src/subcontexts/transaction-context.ts:235](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L235)

***

### transactions

> **transactions**: `Transaction`[]

Defined in: [src/subcontexts/transaction-context.ts:236](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L236)

## Accessors

### activeApplicationId

#### Get Signature

> **get** **activeApplicationId**(): `uint64`

Defined in: [src/subcontexts/transaction-context.ts:263](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L263)

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

Defined in: [src/subcontexts/transaction-context.ts:254](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L254)

Gets the active transaction.

##### Returns

`Transaction`

The active transaction.

***

### constructingItxn

#### Get Signature

> **get** **constructingItxn**(): `InnerTxnFields`

Defined in: [src/subcontexts/transaction-context.ts:273](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L273)

##### Returns

`InnerTxnFields`

## Methods

### addInnerTransactionGroup()

> **addInnerTransactionGroup**(...`itxns`): `void`

Defined in: [src/subcontexts/transaction-context.ts:312](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L312)

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

Defined in: [src/subcontexts/transaction-context.ts:337](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L337)

**`Internal`**

Appends a new inner transaction to the current group.

#### Returns

`void`

#### Throws

If there is no inner transaction group being constructed.

***

### beginInnerTransactionGroup()

> **beginInnerTransactionGroup**(): `void`

Defined in: [src/subcontexts/transaction-context.ts:321](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L321)

**`Internal`**

Begins a new inner transaction group.

#### Returns

`void`

#### Throws

If there is already an inner transaction group being constructed or the active transaction is not an application call.

***

### getApplicationTransaction()

> **getApplicationTransaction**(`index`?): `ApplicationTransaction`

Defined in: [src/subcontexts/transaction-context.ts:394](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L394)

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

Defined in: [src/subcontexts/transaction-context.ts:403](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L403)

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

Defined in: [src/subcontexts/transaction-context.ts:421](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L421)

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

Defined in: [src/subcontexts/transaction-context.ts:412](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L412)

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

Defined in: [src/subcontexts/transaction-context.ts:376](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L376)

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

Defined in: [src/subcontexts/transaction-context.ts:430](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L430)

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

Defined in: [src/subcontexts/transaction-context.ts:439](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L439)

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

Defined in: [src/subcontexts/transaction-context.ts:293](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L293)

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

Defined in: [src/subcontexts/transaction-context.ts:284](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L284)

Gets the scratch space of the active transaction.

#### Returns

(`bytes` \| `uint64`)[]

The scratch space.

***

### getTransaction()

> **getTransaction**(`index`?): `Transaction`

Defined in: [src/subcontexts/transaction-context.ts:448](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L448)

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

Defined in: [src/subcontexts/transaction-context.ts:366](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L366)

Gets the last inner transaction group.

#### Returns

[`ItxnGroup`](ItxnGroup.md)

The last inner transaction group.

***

### patchActiveTransactionFields()

> **patchActiveTransactionFields**(`fields`): `void`

Defined in: [src/subcontexts/transaction-context.ts:301](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L301)

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

Defined in: [src/subcontexts/transaction-context.ts:349](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L349)

**`Internal`**

Submits the current inner transaction group.

#### Returns

`void`

#### Throws

If there is no inner transaction group being constructed or the group exceeds the maximum size.
