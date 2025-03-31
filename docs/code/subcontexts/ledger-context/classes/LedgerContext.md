[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [subcontexts/ledger-context](../README.md) / LedgerContext

# Class: LedgerContext

Defined in: [src/subcontexts/ledger-context.ts:32](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L32)

## Constructors

### new LedgerContext()

> **new LedgerContext**(): [`LedgerContext`](LedgerContext.md)

#### Returns

[`LedgerContext`](LedgerContext.md)

## Properties

### accountDataMap

> **accountDataMap**: `AccountMap`\<`AccountData`\>

Defined in: [src/subcontexts/ledger-context.ts:37](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L37)

***

### appIdContractMap

> **appIdContractMap**: `Uint64Map`\<`BaseContract`\>

Defined in: [src/subcontexts/ledger-context.ts:36](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L36)

***

### appIdIter

> **appIdIter**: `Generator`\<`bigint`\>

Defined in: [src/subcontexts/ledger-context.ts:33](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L33)

***

### applicationDataMap

> **applicationDataMap**: `Uint64Map`\<`ApplicationData`\>

Defined in: [src/subcontexts/ledger-context.ts:35](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L35)

***

### assetDataMap

> **assetDataMap**: `Uint64Map`\<`Mutable`\<`Omit`\<`Asset`, `"id"` \| `"balance"` \| `"frozen"`\>\>\>

Defined in: [src/subcontexts/ledger-context.ts:38](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L38)

***

### assetIdIter

> **assetIdIter**: `Generator`\<`bigint`\>

Defined in: [src/subcontexts/ledger-context.ts:34](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L34)

***

### blocks

> **blocks**: `Uint64Map`\<`BlockData`\>

Defined in: [src/subcontexts/ledger-context.ts:40](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L40)

***

### globalData

> **globalData**: `GlobalData`

Defined in: [src/subcontexts/ledger-context.ts:41](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L41)

***

### onlineStake

> **onlineStake**: `number` = `0`

Defined in: [src/subcontexts/ledger-context.ts:42](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L42)

***

### voterDataMap

> **voterDataMap**: `AccountMap`\<`VoterData`\>

Defined in: [src/subcontexts/ledger-context.ts:39](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L39)

## Methods

### addAppIdContractMap()

> **addAppIdContractMap**(`appId`, `contract`): `void`

Defined in: [src/subcontexts/ledger-context.ts:50](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L50)

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

Defined in: [src/subcontexts/ledger-context.ts:377](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L377)

Checks if a box exists for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

##### key

`StubBytesCompat`

The key.

#### Returns

`boolean`

True if the box exists, false otherwise.

***

### deleteBox()

> **deleteBox**(`app`, `key`): `boolean`

Defined in: [src/subcontexts/ledger-context.ts:365](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L365)

Deletes a box for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

##### key

`StubBytesCompat`

The key.

#### Returns

`boolean`

True if the box was deleted, false otherwise.

***

### getAccount()

> **getAccount**(`address`): `Account`

Defined in: [src/subcontexts/ledger-context.ts:59](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L59)

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

Defined in: [src/subcontexts/ledger-context.ts:82](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L82)

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

Defined in: [src/subcontexts/ledger-context.ts:111](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L111)

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

Defined in: [src/subcontexts/ledger-context.ts:95](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L95)

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

Defined in: [src/subcontexts/ledger-context.ts:69](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L69)

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

Defined in: [src/subcontexts/ledger-context.ts:245](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L245)

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

Defined in: [src/subcontexts/ledger-context.ts:340](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L340)

Retrieves a box for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

##### key

`StubBytesCompat`

The key.

#### Returns

`Uint8Array`

The box data.

***

### getGlobalState()

> **getGlobalState**(`app`, `key`): \[`GlobalStateCls`\<`unknown`\>, `true`\] \| \[`undefined`, `false`\]

Defined in: [src/subcontexts/ledger-context.ts:259](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L259)

Retrieves global state for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

##### key

`StubBytesCompat`

The key.

#### Returns

\[`GlobalStateCls`\<`unknown`\>, `true`\] \| \[`undefined`, `false`\]

The global state and a boolean indicating if it was found.

***

### getLocalState()

> **getLocalState**(`app`, `account`, `key`): \[`undefined`, `false`\] \| \[`LocalStateForAccount`\<`unknown`\>, `true`\]

Defined in: [src/subcontexts/ledger-context.ts:294](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L294)

Retrieves local state for an application and account by key.

#### Parameters

##### app

The application.

`uint64` | `Application` | `BaseContract`

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

### patchAccountData()

> **patchAccountData**(`account`, `data`): `void`

Defined in: [src/subcontexts/ledger-context.ts:167](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L167)

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

Defined in: [src/subcontexts/ledger-context.ts:184](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L184)

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

Defined in: [src/subcontexts/ledger-context.ts:204](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L204)

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

Defined in: [src/subcontexts/ledger-context.ts:230](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L230)

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

Defined in: [src/subcontexts/ledger-context.ts:155](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L155)

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

Defined in: [src/subcontexts/ledger-context.ts:217](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L217)

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

Defined in: [src/subcontexts/ledger-context.ts:352](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L352)

Sets a box for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

##### key

`StubBytesCompat`

The key.

##### value

The box data.

`Uint8Array` | `StubBytesCompat`

#### Returns

`void`

***

### setGlobalState()

> **setGlobalState**(`app`, `key`, `value`): `void`

Defined in: [src/subcontexts/ledger-context.ts:274](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L274)

Sets global state for an application by key.

#### Parameters

##### app

The application.

`Application` | `BaseContract`

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

Defined in: [src/subcontexts/ledger-context.ts:316](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L316)

Sets local state for an application and account by key.

#### Type Parameters

• **T**

#### Parameters

##### app

The application.

`uint64` | `Application` | `BaseContract`

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

### updateAssetHolding()

> **updateAssetHolding**(`account`, `assetId`, `balance`?, `frozen`?): `void`

Defined in: [src/subcontexts/ledger-context.ts:141](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/subcontexts/ledger-context.ts#L141)

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
