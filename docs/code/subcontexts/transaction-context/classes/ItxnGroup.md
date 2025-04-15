[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/transaction-context](../README.md) / ItxnGroup

# Class: ItxnGroup

Defined in: [src/subcontexts/transaction-context.ts:485](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L485)

Represents a group of inner transactions.

## Constructors

### Constructor

> **new ItxnGroup**(`itxns`): `ItxnGroup`

Defined in: [src/subcontexts/transaction-context.ts:487](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L487)

#### Parameters

##### itxns

`InnerTxn`[]

#### Returns

`ItxnGroup`

## Properties

### itxns

> **itxns**: `InnerTxn`[] = `[]`

Defined in: [src/subcontexts/transaction-context.ts:486](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L486)

## Methods

### getApplicationCallInnerTxn()

> **getApplicationCallInnerTxn**(`index`?): `ApplicationCallInnerTxn`

Defined in: [src/subcontexts/transaction-context.ts:496](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L496)

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

Defined in: [src/subcontexts/transaction-context.ts:505](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L505)

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

Defined in: [src/subcontexts/transaction-context.ts:523](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L523)

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

Defined in: [src/subcontexts/transaction-context.ts:514](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L514)

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

Defined in: [src/subcontexts/transaction-context.ts:550](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L550)

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

Defined in: [src/subcontexts/transaction-context.ts:532](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L532)

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

Defined in: [src/subcontexts/transaction-context.ts:541](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/transaction-context.ts#L541)

Gets a payment inner transaction by index.

#### Parameters

##### index?

`StubUint64Compat`

The index of the transaction.

#### Returns

`PaymentInnerTxn`

The payment inner transaction.
