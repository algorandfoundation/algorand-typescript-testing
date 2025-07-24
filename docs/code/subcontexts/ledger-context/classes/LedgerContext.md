[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/ledger-context](../README.md) / LedgerContext

# Class: LedgerContext

Defined in: [src/subcontexts/ledger-context.ts:33](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L33)

## Constructors

### Constructor

> **new LedgerContext**(): `LedgerContext`

#### Returns

`LedgerContext`

## Properties

### accountDataMap

> **accountDataMap**: `AccountMap`\<`AccountData`\>

Defined in: [src/subcontexts/ledger-context.ts:38](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L38)

***

### appIdContractMap

> **appIdContractMap**: `Uint64Map`\<`BaseContract`\>

Defined in: [src/subcontexts/ledger-context.ts:37](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L37)

***

### appIdIter

> **appIdIter**: `Generator`\<`bigint`, `any`, `any`\>

Defined in: [src/subcontexts/ledger-context.ts:34](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L34)

***

### applicationDataMap

> **applicationDataMap**: `Uint64Map`\<`ApplicationData`\>

Defined in: [src/subcontexts/ledger-context.ts:36](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L36)

***

### assetDataMap

> **assetDataMap**: `Uint64Map`\<`Mutable`\<`Omit`\<`Asset`, `"id"` \| `"balance"` \| `"frozen"`\>\>\>

Defined in: [src/subcontexts/ledger-context.ts:39](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L39)

***

### assetIdIter

> **assetIdIter**: `Generator`\<`bigint`, `any`, `any`\>

Defined in: [src/subcontexts/ledger-context.ts:35](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L35)

***

### blocks

> **blocks**: `Uint64Map`\<`BlockData`\>

Defined in: [src/subcontexts/ledger-context.ts:41](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L41)

***

### globalData

> **globalData**: `GlobalData`

Defined in: [src/subcontexts/ledger-context.ts:42](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L42)

***

### onlineStake

> **onlineStake**: `number` = `0`

Defined in: [src/subcontexts/ledger-context.ts:43](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L43)

***

### voterDataMap

> **voterDataMap**: `AccountMap`\<`VoterData`\>

Defined in: [src/subcontexts/ledger-context.ts:40](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L40)

## Methods

### addAppIdContractMap()

> **addAppIdContractMap**(`appId`, `contract`): `void`

Defined in: [src/subcontexts/ledger-context.ts:51](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L51)

**`Internal`**

Adds a contract to the application ID contract map.

#### Parameters

##### appId

`StubUint64Compat`

The application ID.

##### contract

`BaseContract`

The contract to add.

#### Returns

`void`

***

### boxExists()

> **boxExists**(`app`, `key`): `boolean`

Defined in: [src/subcontexts/ledger-context.ts:411](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L411)

Checks if a box exists for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

#### Returns

`boolean`

True if the box exists, false otherwise.

***

### deleteBox()

> **deleteBox**(`app`, `key`): `boolean`

Defined in: [src/subcontexts/ledger-context.ts:398](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L398)

Deletes a box for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

#### Returns

`boolean`

True if the box was deleted, false otherwise.

***

### getAccount()

> **getAccount**(`address`): `Account`

Defined in: [src/subcontexts/ledger-context.ts:60](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L60)

Retrieves an account by address.

#### Parameters

##### address

The account address.

`StubBytesCompat` | `Account`

#### Returns

`Account`

The account.

***

### getApplication()

> **getApplication**(`applicationId`): `Application`

Defined in: [src/subcontexts/ledger-context.ts:83](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L83)

Retrieves an application by application ID.

#### Parameters

##### applicationId

`StubUint64Compat`

The application ID.

#### Returns

`Application`

The application.

#### Throws

If the application is unknown.

***

### getApplicationForApprovalProgram()

> **getApplicationForApprovalProgram**(`approvalProgram`): `undefined` \| `Application`

Defined in: [src/subcontexts/ledger-context.ts:112](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L112)

Retrieves an application for a given approval program.

#### Parameters

##### approvalProgram

The approval program.

`undefined` | `bytes` | readonly `bytes`[]

#### Returns

`undefined` \| `Application`

The application or undefined if not found.

***

### getApplicationForContract()

> **getApplicationForContract**(`contract`): `Application`

Defined in: [src/subcontexts/ledger-context.ts:96](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L96)

Retrieves an application for a given contract.

#### Parameters

##### contract

`BaseContract`

The contract.

#### Returns

`Application`

The application.

#### Throws

If the contract is unknown.

***

### getAsset()

> **getAsset**(`assetId`): `Asset`

Defined in: [src/subcontexts/ledger-context.ts:70](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L70)

Retrieves an asset by asset ID.

#### Parameters

##### assetId

`StubUint64Compat`

The asset ID.

#### Returns

`Asset`

The asset.

#### Throws

If the asset is unknown.

***

### getBlockData()

> **getBlockData**(`index`): `BlockData`

Defined in: [src/subcontexts/ledger-context.ts:246](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L246)

Retrieves block data by index.

#### Parameters

##### index

`StubUint64Compat`

The block index.

#### Returns

`BlockData`

The block data.

#### Throws

If the block is not set.

***

### getBox()

> **getBox**(`app`, `key`): `Uint8Array`

Defined in: [src/subcontexts/ledger-context.ts:341](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L341)

Retrieves a box for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

#### Returns

`Uint8Array`

The box data.

***

### getGlobalState()

> **getGlobalState**(`app`, `key`): \[`GlobalStateCls`\<`unknown`\>, `true`\] \| \[`undefined`, `false`\]

Defined in: [src/subcontexts/ledger-context.ts:260](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L260)

Retrieves global state for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

#### Returns

\[`GlobalStateCls`\<`unknown`\>, `true`\] \| \[`undefined`, `false`\]

The global state and a boolean indicating if it was found.

***

### getLocalState()

> **getLocalState**(`app`, `account`, `key`): \[`undefined`, `false`\] \| \[`LocalStateForAccount`\<`unknown`\>, `true`\]

Defined in: [src/subcontexts/ledger-context.ts:295](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L295)

Retrieves local state for an application and account by key.

#### Parameters

##### app

The application.

`uint64` | `BaseContract` | `Application`

##### account

`Account`

The account.

##### key

`StubBytesCompat`

The key.

#### Returns

\[`undefined`, `false`\] \| \[`LocalStateForAccount`\<`unknown`\>, `true`\]

The local state and a boolean indicating if it was found.

***

### getMaterialisedBox()

> **getMaterialisedBox**\<`T`\>(`app`, `key`): `undefined` \| `T`

Defined in: [src/subcontexts/ledger-context.ts:358](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L358)

**`Internal`**

Retrieves a materialised box for an application by key.

#### Type Parameters

##### T

`T`

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

#### Returns

`undefined` \| `T`

The materialised box data if exists or undefined.

***

### patchAccountData()

> **patchAccountData**(`account`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:168](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L168)

Patches account data with the provided partial data.

#### Parameters

##### account

`Account`

The account.

##### data

`Partial`\<`Omit`\<`AccountData`, `"account"`\>\> & `Partial`\<`PickPartial`\<`AccountData`, `"account"`\>\>

The partial account data.

#### Returns

`void`

***

### patchApplicationData()

> **patchApplicationData**(`app`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:185](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L185)

Patches application data with the provided partial data.

#### Parameters

##### app

`Application`

The application.

##### data

`Partial`\<`Omit`\<`ApplicationData`, `"application"`\>\> & `Partial`\<`PickPartial`\<`ApplicationData`, `"application"`\>\>

The partial application data.

#### Returns

`void`

***

### patchAssetData()

> **patchAssetData**(`asset`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:205](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L205)

Patches asset data with the provided partial data.

#### Parameters

##### asset

`Asset`

##### data

`Partial`\<`Mutable`\<`Omit`\<`Asset`, `"id"` \| `"balance"` \| `"frozen"`\>\>\>

The partial asset data.

#### Returns

`void`

***

### patchBlockData()

> **patchBlockData**(`index`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:231](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L231)

Patches block data with the provided partial data.

#### Parameters

##### index

`StubUint64Compat`

The block index.

##### data

`Partial`\<`BlockData`\>

The partial block data.

#### Returns

`void`

***

### patchGlobalData()

> **patchGlobalData**(`data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:156](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L156)

Patches global data with the provided partial data.

#### Parameters

##### data

`Partial`\<`GlobalData`\>

The partial global data.

#### Returns

`void`

***

### patchVoterData()

> **patchVoterData**(`account`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:218](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L218)

Patches voter data with the provided partial data.

#### Parameters

##### account

`Account`

The account.

##### data

`Partial`\<`VoterData`\>

The partial voter data.

#### Returns

`void`

***

### setBox()

> **setBox**(`app`, `key`, `value`): `void`

Defined in: [src/subcontexts/ledger-context.ts:370](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L370)

Sets a box for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

##### value

The box data.

`Uint8Array`\<`ArrayBufferLike`\> | `StubBytesCompat`

#### Returns

`void`

***

### setGlobalState()

> **setGlobalState**(`app`, `key`, `value`): `void`

Defined in: [src/subcontexts/ledger-context.ts:275](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L275)

Sets global state for an application by key.

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

##### value

The value (optional).

`undefined` | `StubBytesCompat` | `StubUint64Compat`

#### Returns

`void`

***

### setLocalState()

> **setLocalState**\<`T`\>(`app`, `account`, `key`, `value`): `void`

Defined in: [src/subcontexts/ledger-context.ts:317](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L317)

Sets local state for an application and account by key.

#### Type Parameters

##### T

`T`

#### Parameters

##### app

The application.

`uint64` | `BaseContract` | `Application`

##### account

`Account`

The account.

##### key

`StubBytesCompat`

The key.

##### value

The value (optional).

`undefined` | `T`

#### Returns

`void`

***

### setMatrialisedBox()

> **setMatrialisedBox**\<`TValue`\>(`app`, `key`, `value`): `void`

Defined in: [src/subcontexts/ledger-context.ts:386](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L386)

**`Internal`**

Cache the materialised box for an application by key.

#### Type Parameters

##### TValue

`TValue`

#### Parameters

##### app

The application.

`BaseContract` | `Application`

##### key

`StubBytesCompat`

The key.

##### value

The box data.

`undefined` | `TValue`

#### Returns

`void`

***

### updateAssetHolding()

> **updateAssetHolding**(`account`, `assetId`, `balance`?, `frozen`?): `void`

Defined in: [src/subcontexts/ledger-context.ts:142](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L142)

Update asset holdings for account, only specified values will be updated.
AccountType will also be opted-in to asset

#### Parameters

##### account

`Account`

##### assetId

`StubUint64Compat` | `Asset`

##### balance?

`StubUint64Compat`

##### frozen?

`boolean`

#### Returns

`void`
