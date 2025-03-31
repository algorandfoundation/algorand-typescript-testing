[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [value-generators/txn](../README.md) / TxnValueGenerator

# Class: TxnValueGenerator

Defined in: [src/value-generators/txn.ts:16](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L16)

## Constructors

### new TxnValueGenerator()

> **new TxnValueGenerator**(): [`TxnValueGenerator`](TxnValueGenerator.md)

#### Returns

[`TxnValueGenerator`](TxnValueGenerator.md)

## Methods

### applicationCall()

> **applicationCall**(`fields`?): `ApplicationTransaction`

Defined in: [src/value-generators/txn.ts:22](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L22)

Generates a random application call transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Omit`\<`ApplicationTransactionFields`, `"appId"`\> & `object`\>

The fields for the application call transaction where `appId` value can be instance of Application or BaseContract.

#### Returns

`ApplicationTransaction`

- A random application call transaction.

***

### assetConfig()

> **assetConfig**(`fields`?): `AssetConfigTransaction`

Defined in: [src/value-generators/txn.ts:65](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L65)

Generates a random asset configuration transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Mutable`\<`Pick`\<`AssetConfigTxn`, keyof `AssetConfigTxn`\>\>\>

The fields for the asset configuration transaction.

#### Returns

`AssetConfigTransaction`

- A random asset configuration transaction.

***

### assetFreeze()

> **assetFreeze**(`fields`?): `AssetFreezeTransaction`

Defined in: [src/value-generators/txn.ts:83](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L83)

Generates a random asset freeze transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Mutable`\<`Pick`\<`AssetFreezeTxn`, keyof `AssetFreezeTxn`\>\>\>

The fields for the asset freeze transaction.

#### Returns

`AssetFreezeTransaction`

- A random asset freeze transaction.

***

### assetTransfer()

> **assetTransfer**(`fields`?): `AssetTransferTransaction`

Defined in: [src/value-generators/txn.ts:74](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L74)

Generates a random asset transfer transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Mutable`\<`Pick`\<`AssetTransferTxn`, keyof `AssetTransferTxn`\>\>\>

The fields for the asset transfer transaction.

#### Returns

`AssetTransferTransaction`

- A random asset transfer transaction.

***

### keyRegistration()

> **keyRegistration**(`fields`?): `KeyRegistrationTransaction`

Defined in: [src/value-generators/txn.ts:56](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L56)

Generates a random key registration transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Mutable`\<`Pick`\<`KeyRegistrationTxn`, keyof `KeyRegistrationTxn`\>\>\>

The fields for the key registration transaction.

#### Returns

`KeyRegistrationTransaction`

- A random key registration transaction.

***

### payment()

> **payment**(`fields`?): `PaymentTransaction`

Defined in: [src/value-generators/txn.ts:47](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/value-generators/txn.ts#L47)

Generates a random payment transaction with the specified fields.

#### Parameters

##### fields?

`Partial`\<`Mutable`\<`Pick`\<`PaymentTxn`, keyof `PaymentTxn`\>\>\>

The fields for the payment transaction.

#### Returns

`PaymentTransaction`

- A random payment transaction.
