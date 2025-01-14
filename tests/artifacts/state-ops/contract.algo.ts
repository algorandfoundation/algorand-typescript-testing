import {
  Account,
  Application,
  arc4,
  assert,
  Asset,
  BaseContract,
  Bytes,
  bytes,
  Global,
  GlobalState,
  itxn,
  LocalState,
  op,
  TransactionType,
  Txn,
  Uint64,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { Address, Bool, Byte, DynamicBytes, Str, UintN128, UintN64 } from '@algorandfoundation/algorand-typescript/arc4'

function get_1st_ref_index(): uint64 {
  return op.btoi(Txn.applicationArgs(1))
}

export class StateAssetHoldingContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_asset_holding_get(a: Account, b: Asset): uint64 {
    const [balance, _val] = op.AssetHolding.assetBalance(a, b)
    return balance
  }

  @arc4.abimethod()
  public verify_asset_frozen_get(a: Account, b: Asset): boolean {
    const [frozen, _val] = op.AssetHolding.assetFrozen(a, b)
    return frozen
  }
}

export class StateAssetParamsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_asset_params_get_total(a: Asset): uint64 {
    const [value, exists] = op.AssetParams.assetTotal(a)
    const [value_index, exists_index] = op.AssetParams.assetTotal(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_decimals(a: Asset): uint64 {
    const [value, exists] = op.AssetParams.assetDecimals(a)
    const [value_index, exists_index] = op.AssetParams.assetDecimals(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_default_frozen(a: Asset): boolean {
    const [value, exists] = op.AssetParams.assetDefaultFrozen(a)
    const [value_index, exists_index] = op.AssetParams.assetDefaultFrozen(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_unit_name(a: Asset): bytes {
    const [value, exists] = op.AssetParams.assetUnitName(a)
    const [value_index, exists_index] = op.AssetParams.assetUnitName(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_name(a: Asset): bytes {
    const [value, exists] = op.AssetParams.assetName(a)
    const [value_index, exists_index] = op.AssetParams.assetName(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_url(a: Asset): bytes {
    const [value, exists] = op.AssetParams.assetUrl(a)
    const [value_index, exists_index] = op.AssetParams.assetUrl(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_metadata_hash(a: Asset): bytes {
    const [value, exists] = op.AssetParams.assetMetadataHash(a)
    const [value_index, exists_index] = op.AssetParams.assetMetadataHash(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_asset_params_get_manager(a: Asset): Address {
    const [value, exists] = op.AssetParams.assetManager(a)
    const [value_index, exists_index] = op.AssetParams.assetManager(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }

  @arc4.abimethod()
  public verify_asset_params_get_reserve(a: Asset): Address {
    const [value, exists] = op.AssetParams.assetReserve(a)
    const [value_index, exists_index] = op.AssetParams.assetReserve(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }

  @arc4.abimethod()
  public verify_asset_params_get_freeze(a: Asset): Address {
    const [value, exists] = op.AssetParams.assetFreeze(a)
    const [value_index, exists_index] = op.AssetParams.assetFreeze(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }

  @arc4.abimethod()
  public verify_asset_params_get_clawback(a: Asset): Address {
    const [value, exists] = op.AssetParams.assetClawback(a)
    const [value_index, exists_index] = op.AssetParams.assetClawback(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }

  @arc4.abimethod()
  public verify_asset_params_get_creator(a: Asset): Address {
    const [value, exists] = op.AssetParams.assetCreator(a)
    const [value_index, exists_index] = op.AssetParams.assetCreator(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }
}

export class StateAppParamsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_app_params_get_approval_program(a: Application): bytes {
    const [value, exists] = op.AppParams.appApprovalProgram(a)
    const [value_index, exists_index] = op.AppParams.appApprovalProgram(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_clear_state_program(a: Application): bytes {
    const [value, exists] = op.AppParams.appClearStateProgram(a)
    const [value_index, exists_index] = op.AppParams.appClearStateProgram(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_global_num_uint(a: Application): uint64 {
    const [value, exists] = op.AppParams.appGlobalNumUint(a)
    const [value_index, exists_index] = op.AppParams.appGlobalNumUint(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_global_num_byte_slice(a: Application): uint64 {
    const [value, exists] = op.AppParams.appGlobalNumByteSlice(a)
    const [value_index, exists_index] = op.AppParams.appGlobalNumByteSlice(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_local_num_uint(a: Application): uint64 {
    const [value, exists] = op.AppParams.appLocalNumUint(a)
    const [value_index, exists_index] = op.AppParams.appLocalNumUint(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_local_num_byte_slice(a: Application): uint64 {
    const [value, exists] = op.AppParams.appLocalNumByteSlice(a)
    const [value_index, exists_index] = op.AppParams.appLocalNumByteSlice(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_extra_program_pages(a: Application): uint64 {
    const [value, exists] = op.AppParams.appExtraProgramPages(a)
    const [value_index, exists_index] = op.AppParams.appExtraProgramPages(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return value
  }

  @arc4.abimethod()
  public verify_app_params_get_creator(a: Application): Address {
    const [value, exists] = op.AppParams.appCreator(a)
    const [value_index, exists_index] = op.AppParams.appCreator(get_1st_ref_index())
    assert(value === value_index, 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }

  @arc4.abimethod()
  public verify_app_params_get_address(a: Application): Address {
    const [value, exists] = op.AppParams.appAddress(a)
    const [value_index, exists_index] = op.AppParams.appAddress(get_1st_ref_index())
    assert(value.bytes.toString() === value_index.bytes.toString(), 'expected value by index to match')
    assert(exists === exists_index, 'expected exists by index to match')
    return new Address(value)
  }
}

export class StateAppGlobalExContract extends arc4.Contract {
  globalUint64 = GlobalState({ key: Bytes('global_uint64'), initialValue: Uint64(2) })
  globalBytes = GlobalState({ key: Bytes('global_bytes'), initialValue: Bytes('dummy_bytes') })
  global_uint64_explicit = GlobalState({ initialValue: Uint64(2) })
  global_bytes_explicit = GlobalState({ initialValue: Bytes('dummy_bytes') })
  globalArc4Bytes = GlobalState({ key: Bytes('global_arc4_bytes'), initialValue: new DynamicBytes('dummy_arc4_bytes') })
  global_arc4_bytes_explicit = GlobalState({ initialValue: new DynamicBytes('dummy_arc4_bytes') })
}

export class StateAppGlobalContract extends arc4.Contract {
  globalUint64 = GlobalState<uint64>({ key: Bytes('global_uint64') })
  globalBytes = GlobalState<bytes>({ key: Bytes('global_bytes') })

  @arc4.abimethod()
  verify_get_bytes(a: bytes): bytes {
    const value = op.AppGlobal.getBytes(a)
    return value
  }

  @arc4.abimethod()
  verify_get_uint64(a: bytes): uint64 {
    const value = op.AppGlobal.getUint64(a)
    return value
  }

  @arc4.abimethod()
  verify_get_ex_bytes(a: Application, b: bytes): readonly [bytes, boolean] {
    return op.AppGlobal.getExBytes(a, b)
  }

  @arc4.abimethod()
  verify_get_ex_uint64(a: Application, b: bytes): readonly [uint64, boolean] {
    return op.AppGlobal.getExUint64(a, b)
  }

  @arc4.abimethod()
  verify_put_uint64(a: bytes, b: uint64): void {
    op.AppGlobal.put(a, b)
  }

  @arc4.abimethod()
  verify_put_bytes(a: bytes, b: bytes): void {
    op.AppGlobal.put(a, b)
  }

  @arc4.abimethod()
  verify_delete(a: bytes): void {
    op.AppGlobal.delete(a)
  }
}

export class StateAppLocalExContract extends arc4.Contract {
  localUint64 = LocalState<uint64>({ key: 'local_uint64' })
  localBytes = LocalState<bytes>({ key: 'local_bytes' })
  localArc4Bytes = LocalState<DynamicBytes>({ key: 'local_arc4_bytes' })

  @arc4.abimethod({ allowActions: ['OptIn'] })
  opt_in(): void {
    this.localBytes(Global.creatorAddress).value = Bytes('dummy_bytes_from_external_contract')
    this.localUint64(Global.creatorAddress).value = Uint64(99)
    this.localArc4Bytes(Global.creatorAddress).value = new DynamicBytes('dummy_arc4_bytes')
  }
}

export class StateAppLocalContract extends arc4.Contract {
  localUint64 = LocalState<uint64>({ key: 'local_uint64' })
  localBytes = LocalState<bytes>({ key: 'local_bytes' })

  @arc4.abimethod({ allowActions: ['OptIn'] })
  opt_in() {
    this.localBytes(Global.creatorAddress).value = Bytes('dummy_bytes')
    this.localUint64(Global.creatorAddress).value = Uint64(999)
  }

  @arc4.abimethod()
  verify_get_bytes(a: Account, b: bytes): bytes {
    const value = op.AppLocal.getBytes(a, b)
    return value
  }

  @arc4.abimethod()
  verify_get_uint64(a: Account, b: bytes): uint64 {
    const value = op.AppLocal.getUint64(a, b)
    return value
  }

  @arc4.abimethod()
  verify_get_ex_bytes(a: Account, b: Application, c: bytes): bytes {
    const [value, _val] = op.AppLocal.getExBytes(a, b, c)
    return value
  }

  @arc4.abimethod()
  verify_get_ex_uint64(a: Account, b: Application, c: bytes): uint64 {
    const [value, _val] = op.AppLocal.getExUint64(a, b, c)
    return value
  }

  @arc4.abimethod()
  verify_delete(a: Account, b: bytes): void {
    op.AppLocal.delete(a, b)
  }

  @arc4.abimethod()
  verify_exists(a: Account, b: bytes): boolean {
    const [_value, exists] = op.AppLocal.getExUint64(a, 0, b)
    return exists
  }

  @arc4.abimethod()
  verify_put_uint64(a: Account, b: bytes, c: uint64): void {
    op.AppLocal.put(a, b, c)
  }

  @arc4.abimethod()
  verify_put_bytes(a: Account, b: bytes, c: bytes): void {
    op.AppLocal.put(a, b, c)
  }
}

export class ITxnOpsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_itxn_ops() {
    op.ITxnCreate.begin()
    op.ITxnCreate.setTypeEnum(TransactionType.ApplicationCall)
    op.ITxnCreate.setOnCompletion(arc4.OnCompleteAction.DeleteApplication)
    op.ITxnCreate.setApprovalProgram(Bytes.fromHex('068101'))

    // pages essentially appends
    op.ITxnCreate.setApprovalProgramPages(Bytes.fromHex('068101'))
    op.ITxnCreate.setClearStateProgram(Bytes.fromHex('068101'))
    op.ITxnCreate.setFee(op.Global.minTxnFee)
    op.ITxnCreate.next()
    op.ITxnCreate.setTypeEnum(TransactionType.Payment)
    op.ITxnCreate.setReceiver(op.Global.creatorAddress)
    op.ITxnCreate.setAmount(Uint64(1000))
    op.ITxnCreate.submit()

    assert(op.ITxn.receiver === op.Global.creatorAddress)
    assert(op.ITxn.amount === Uint64(1000))
    assert(op.ITxn.typeEnum === TransactionType.Payment)

    assert(op.GITxn.typeEnum(0) === TransactionType.ApplicationCall)
    assert(op.GITxn.typeEnum(1) === TransactionType.Payment)
  }
}

const APPROVE = Bytes('\x09\x81\x01')
export class ItxnDemoContract extends BaseContract {
  name = GlobalState({ initialValue: Bytes() })

  public approvalProgram(): boolean {
    if (Txn.numAppArgs) {
      switch (Txn.applicationArgs(0)) {
        case Bytes('test1'):
          this.test1()
          break
        case Bytes('test2'):
          this.test2()
          break
        case Bytes('test3'):
        case Bytes('test4'):
          break
      }
    }
    return true
  }

  private test1() {
    this.name.value = Bytes('AST1')

    const assetParams = itxn.assetConfig({
      total: 1000,
      assetName: this.name.value,
      unitName: 'unit',
      decimals: 3,
      manager: Global.currentApplicationAddress,
      reserve: Global.currentApplicationAddress,
    })

    this.name.value = Bytes('AST2')
    const asset1_txn = assetParams.submit()
    assetParams.set({
      assetName: this.name.value,
    })
    const asset2_txn = assetParams.submit()

    assert(asset1_txn.assetName === Bytes('AST1'), 'asset1_txn is correct')
    assert(asset2_txn.assetName === Bytes('AST2'), 'asset2_txn is correct')
    assert(asset1_txn.createdAsset.name === Bytes('AST1'), 'created asset 1 is correct')
    assert(asset2_txn.createdAsset.name === Bytes('AST2'), 'created asset 2 is correct')

    const appCreateParams = itxn.applicationCall({
      approvalProgram: Bytes.fromHex('098101'),
      clearStateProgram: Bytes.fromHex('098101'),
      fee: 0,
    })

    assetParams.set({
      assetName: 'AST3',
    })

    const [appCreateTxn, asset3_txn] = itxn.submitGroup(appCreateParams, assetParams)

    assert(appCreateTxn.appId, 'app is created')
    assert(asset3_txn.assetName === Bytes('AST3'), 'asset3_txn is correct')

    appCreateParams.set({
      note: '3rd',
    })
    assetParams.set({
      note: '3rd',
    })
    itxn.submitGroup(appCreateParams, assetParams)
  }

  private test2() {
    let createAppParams: itxn.ApplicationCallItxnParams
    if (Txn.numAppArgs) {
      const args = [Bytes('1'), Bytes('2')] as const
      createAppParams = itxn.applicationCall({
        approvalProgram: APPROVE,
        clearStateProgram: APPROVE,
        appArgs: args,
        onCompletion: arc4.OnCompleteAction.NoOp,
        note: 'with args param set',
      })
    } else {
      createAppParams = itxn.applicationCall({
        approvalProgram: APPROVE,
        clearStateProgram: APPROVE,
        appArgs: [Bytes('3'), '4', Bytes('5')],
        note: 'no args param set',
      })
    }
    const createAppTxn = createAppParams.submit()
    assert(createAppTxn.appArgs(0) === Bytes('1'), 'correct args used 1')
    assert(createAppTxn.appArgs(1) === Bytes('2'), 'correct args used 2')
    assert(createAppTxn.note === Bytes('with args param set'))
  }
}

export class GlobalStateContract extends arc4.Contract {
  // Implicit key state variables
  implicitKeyArc4UintN64 = GlobalState({ initialValue: new UintN64(1337) })
  implicitKeyArc4Str = GlobalState({ initialValue: new Str('Hello') })
  implicitKeyArc4Byte = GlobalState({ initialValue: new Byte(0) })
  implicitKeyArc4Bool = GlobalState({ initialValue: new Bool(true) })
  implicitKeyArc4Address = GlobalState({ initialValue: new Address(Global.creatorAddress) })
  implicitKeyArc4UintN128 = GlobalState({ initialValue: new UintN128(2n ** 100n) })
  implicitKeyArc4DynamicBytes = GlobalState({ initialValue: new DynamicBytes('dynamic bytes') })

  // Explicit key state variables
  arc4UintN64 = GlobalState({ initialValue: new UintN64(1337), key: 'explicit_key_arc4_uintn64' })
  arc4Str = GlobalState({ initialValue: new Str('Hello'), key: 'explicit_key_arc4_str' })
  arc4Byte = GlobalState({ initialValue: new Byte(0), key: 'explicit_key_arc4_byte' })
  arc4Bool = GlobalState({ initialValue: new Bool(true), key: 'explicit_key_arc4_bool' })
  arc4Address = GlobalState({ initialValue: new Address(Global.creatorAddress), key: 'explicit_key_arc4_address' })
  arc4UintN128 = GlobalState({ initialValue: new UintN128(2n ** 100n), key: 'explicit_key_arc4_uintn128' })
  arc4DynamicBytes = GlobalState({ initialValue: new DynamicBytes('dynamic bytes'), key: 'explicit_key_arc4_dynamic_bytes' })

  // Getter methods for implicit key state variables
  @arc4.abimethod()
  get_implicit_key_arc4_uintn64(): UintN64 {
    return this.implicitKeyArc4UintN64.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_str(): Str {
    return this.implicitKeyArc4Str.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_byte(): Byte {
    return this.implicitKeyArc4Byte.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_bool(): arc4.Bool {
    return this.implicitKeyArc4Bool.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_address(): Address {
    return this.implicitKeyArc4Address.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_uintn128(): UintN128 {
    return this.implicitKeyArc4UintN128.value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_dynamic_bytes(): DynamicBytes {
    return this.implicitKeyArc4DynamicBytes.value
  }

  // Getter methods for explicit key state variables
  @arc4.abimethod()
  get_arc4_uintn64(): UintN64 {
    return this.arc4UintN64.value
  }

  @arc4.abimethod()
  get_arc4_str(): Str {
    return this.arc4Str.value
  }

  @arc4.abimethod()
  get_arc4_byte(): Byte {
    return this.arc4Byte.value
  }

  @arc4.abimethod()
  get_arc4_bool(): arc4.Bool {
    return this.arc4Bool.value
  }

  @arc4.abimethod()
  get_arc4_address(): Address {
    return this.arc4Address.value
  }

  @arc4.abimethod()
  get_arc4_uintn128(): UintN128 {
    return this.arc4UintN128.value
  }

  @arc4.abimethod()
  get_arc4_dynamic_bytes(): DynamicBytes {
    return this.arc4DynamicBytes.value
  }

  // Setter methods for implicit key state variables
  @arc4.abimethod()
  set_implicit_key_arc4_uintn64(value: UintN64) {
    this.implicitKeyArc4UintN64.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_str(value: Str) {
    this.implicitKeyArc4Str.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_byte(value: Byte) {
    this.implicitKeyArc4Byte.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_bool(value: Bool) {
    this.implicitKeyArc4Bool.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_address(value: Address) {
    this.implicitKeyArc4Address.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_uintn128(value: UintN128) {
    this.implicitKeyArc4UintN128.value = value
  }

  @arc4.abimethod()
  set_implicit_key_arc4_dynamic_bytes(value: DynamicBytes) {
    this.implicitKeyArc4DynamicBytes.value = value
  }

  // Setter methods for explicit key state variables
  @arc4.abimethod()
  set_arc4_uintn64(value: UintN64) {
    this.arc4UintN64.value = value
  }

  @arc4.abimethod()
  set_arc4_str(value: Str) {
    this.arc4Str.value = value
  }

  @arc4.abimethod()
  set_arc4_byte(value: Byte) {
    this.arc4Byte.value = value
  }

  @arc4.abimethod()
  set_arc4_bool(value: Bool) {
    this.arc4Bool.value = value
  }

  @arc4.abimethod()
  set_arc4_address(value: Address) {
    this.arc4Address.value = value
  }

  @arc4.abimethod()
  set_arc4_uintn128(value: UintN128) {
    this.arc4UintN128.value = value
  }

  @arc4.abimethod()
  set_arc4_dynamic_bytes(value: DynamicBytes) {
    this.arc4DynamicBytes.value = value
  }
}

export class LocalStateContract extends arc4.Contract {
  // Implicit key state variables
  implicitKeyArc4UintN64 = LocalState<UintN64>()
  implicitKeyArc4Str = LocalState<Str>()
  implicitKeyArc4Byte = LocalState<Byte>()
  implicitKeyArc4Bool = LocalState<Bool>()
  implicitKeyArc4Address = LocalState<Address>()
  implicitKeyArc4UintN128 = LocalState<UintN128>()
  implicitKeyArc4DynamicBytes = LocalState<DynamicBytes>()

  // Explicit key state variables
  arc4UintN64 = LocalState<UintN64>({ key: 'explicit_key_arc4_uintn64' })
  arc4Str = LocalState<Str>({ key: 'explicit_key_arc4_str' })
  arc4Byte = LocalState<Byte>({ key: 'explicit_key_arc4_byte' })
  arc4Bool = LocalState<Bool>({ key: 'explicit_key_arc4_bool' })
  arc4Address = LocalState<Address>({ key: 'explicit_key_arc4_address' })
  arc4UintN128 = LocalState<UintN128>({ key: 'explicit_key_arc4_uintn128' })
  arc4DynamicBytes = LocalState<DynamicBytes>({ key: 'explicit_key_arc4_dynamic_bytes' })

  @arc4.abimethod({ allowActions: ['OptIn'] })
  opt_in(): void {
    this.implicitKeyArc4UintN64(Global.creatorAddress).value = new UintN64(1337)
    this.implicitKeyArc4Str(Global.creatorAddress).value = new Str('Hello')
    this.implicitKeyArc4Byte(Global.creatorAddress).value = new Byte(0)
    this.implicitKeyArc4Bool(Global.creatorAddress).value = new Bool(true)
    this.implicitKeyArc4Address(Global.creatorAddress).value = new Address(Global.creatorAddress)
    this.implicitKeyArc4UintN128(Global.creatorAddress).value = new UintN128(2n ** 100n)
    this.implicitKeyArc4DynamicBytes(Global.creatorAddress).value = new DynamicBytes('dynamic bytes')

    this.arc4UintN64(Global.creatorAddress).value = new UintN64(1337)
    this.arc4Str(Global.creatorAddress).value = new Str('Hello')
    this.arc4Byte(Global.creatorAddress).value = new Byte(0)
    this.arc4Bool(Global.creatorAddress).value = new Bool(true)
    this.arc4Address(Global.creatorAddress).value = new Address(Global.creatorAddress)
    this.arc4UintN128(Global.creatorAddress).value = new UintN128(2n ** 100n)
    this.arc4DynamicBytes(Global.creatorAddress).value = new DynamicBytes('dynamic bytes')
  }

  // Getter methods for implicit key state variables
  @arc4.abimethod()
  get_implicit_key_arc4_uintn64(a: Account): UintN64 {
    return this.implicitKeyArc4UintN64(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_str(a: Account): Str {
    return this.implicitKeyArc4Str(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_byte(a: Account): Byte {
    return this.implicitKeyArc4Byte(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_bool(a: Account): Bool {
    return this.implicitKeyArc4Bool(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_address(a: Account): Address {
    return this.implicitKeyArc4Address(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_uintn128(a: Account): UintN128 {
    return this.implicitKeyArc4UintN128(a).value
  }

  @arc4.abimethod()
  get_implicit_key_arc4_dynamic_bytes(a: Account): DynamicBytes {
    return this.implicitKeyArc4DynamicBytes(a).value
  }

  // Getter methods for explicit key state variables
  @arc4.abimethod()
  get_arc4_uintn64(a: Account): arc4.UintN64 {
    return this.arc4UintN64(a).value
  }

  @arc4.abimethod()
  get_arc4_str(a: Account): Str {
    return this.arc4Str(a).value
  }

  @arc4.abimethod()
  get_arc4_byte(a: Account): Byte {
    return this.arc4Byte(a).value
  }

  @arc4.abimethod()
  get_arc4_bool(a: Account): Bool {
    return this.arc4Bool(a).value
  }

  @arc4.abimethod()
  get_arc4_address(a: Account): Address {
    return this.arc4Address(a).value
  }

  @arc4.abimethod()
  get_arc4_uintn128(a: Account): UintN128 {
    return this.arc4UintN128(a).value
  }

  @arc4.abimethod()
  get_arc4_dynamic_bytes(a: Account): DynamicBytes {
    return this.arc4DynamicBytes(a).value
  }
}
