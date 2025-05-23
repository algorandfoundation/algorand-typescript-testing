[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / ItxnGroup

# Class: ItxnGroup

Defined in: [src/subcontexts/transaction-context.ts:496](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L496)

Represents a group of inner transactions.

## Constructors

### Constructor

> **new ItxnGroup**(`itxns`): `ItxnGroup`

Defined in: [src/subcontexts/transaction-context.ts:498](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L498)

#### Parameters

##### itxns

`InnerTxn`[]

#### Returns

`ItxnGroup`

## Properties

### itxns

> **itxns**: `InnerTxn`[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:497](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L497)

## Methods

### getApplicationCallInnerTxn()

> **getApplicationCallInnerTxn**(`index`?): `ApplicationCallInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:507](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L507)

Gets an application inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`ApplicationCallInnerTxn`

The application inner transaction.

***

### getAssetConfigInnerTxn()

> **getAssetConfigInnerTxn**(`index`?): `AssetConfigInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:516](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L516)

Gets an asset configuration inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetConfigInnerTxn`

The asset configuration inner transaction.

***

### getAssetFreezeInnerTxn()

> **getAssetFreezeInnerTxn**(`index`?): `AssetFreezeInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:534](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L534)

Gets an asset freeze inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetFreezeInnerTxn`

The asset freeze inner transaction.

***

### getAssetTransferInnerTxn()

> **getAssetTransferInnerTxn**(`index`?): `AssetTransferInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:525](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L525)

Gets an asset transfer inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`AssetTransferInnerTxn`

The asset transfer inner transaction.

***

### getInnerTxn()

> **getInnerTxn**(`index`?): `InnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:561](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L561)

Gets an inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`InnerTxn`

The inner transaction.

***

### getKeyRegistrationInnerTxn()

> **getKeyRegistrationInnerTxn**(`index`?): `KeyRegistrationInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:543](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L543)

Gets a key registration inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`KeyRegistrationInnerTxn`

The key registration inner transaction.

***

### getPaymentInnerTxn()

> **getPaymentInnerTxn**(`index`?): `PaymentInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:552](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L552)

Gets a payment inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`PaymentInnerTxn`

The payment inner transaction.
