import { Bytes, FixedBytes } from './impl/primitives'

/** @internal */
export const UINT64_SIZE = 64
/** @internal */
export const UINT512_SIZE = 512
/** @internal */
export const MAX_UINT8 = 2 ** 8 - 1
/** @internal */
export const MAX_UINT16 = 2 ** 16 - 1
/** @internal */
export const MAX_UINT32 = 2 ** 32 - 1
/** @internal */
export const MAX_UINT64 = 2n ** 64n - 1n
/** @internal */
export const MAX_UINT128 = 2n ** 128n - 1n
/** @internal */
export const MAX_UINT256 = 2n ** 256n - 1n
/** @internal */
export const MAX_UINT512 = 2n ** 512n - 1n
/** @internal */
export const MAX_BYTES_SIZE = 4096
/** @internal */
export const MAX_LOG_SIZE = 1024
/** @internal */
export const MAX_ITEMS_IN_LOG = 32
/** @internal */
export const MAX_BOX_SIZE = 32768
/** @internal */
export const BITS_IN_BYTE = 8
/** @internal */
export const DEFAULT_ACCOUNT_MIN_BALANCE = 100_000
/** @internal */
export const DEFAULT_MAX_TXN_LIFE = 1_000
/** @internal */
export const DEFAULT_ASSET_CREATE_MIN_BALANCE = 1000_000
/** @internal */
export const DEFAULT_ASSET_OPT_IN_MIN_BALANCE = 10_000

/** @internal
 * from python code: list(b"\x85Y\xb5\x14x\xfd\x89\xc1vC\xd0]\x15\xa8\xaek\x10\xabG\xbbm\x8a1\x88\x11V\xe6\xbd;\xae\x95\xd1")
 */
export const DEFAULT_GLOBAL_GENESIS_HASH = FixedBytes(
  32,
  new Uint8Array([
    133, 89, 181, 20, 120, 253, 137, 193, 118, 67, 208, 93, 21, 168, 174, 107, 16, 171, 71, 187, 109, 138, 49, 136, 17, 86, 230, 189, 59,
    174, 149, 209,
  ]),
)

/** @internal
 * algorand encoded address of 32 zero bytes
 */
export const ZERO_ADDRESS = Bytes.fromBase32('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')

/** @internal
"\x09"  # pragma version 9
"\x81\x01"  # pushint 1
 */
export const ALWAYS_APPROVE_TEAL_PROGRAM = Bytes(new Uint8Array([0x09, 0x81, 0x01]))

/** @internal
 * bytes: program (logic) data prefix when signing
 */
export const LOGIC_DATA_PREFIX = Bytes('ProgData')

/** @internal
 * number: minimum transaction fee
 */
export const MIN_TXN_FEE = 1000

/** @internal */
export const ABI_RETURN_VALUE_LOG_PREFIX = Bytes.fromHex('151F7C75')

/** @internal */
export const UINT64_OVERFLOW_UNDERFLOW_MESSAGE = 'Uint64 overflow or underflow'
/** @internal */
export const BIGUINT_OVERFLOW_UNDERFLOW_MESSAGE = 'BigUint overflow or underflow'
/** @internal */
export const DEFAULT_TEMPLATE_VAR_PREFIX = 'TMPL_'

/** @internal */
export const APP_ID_PREFIX = 'appID'
/** @internal */
export const HASH_BYTES_LENGTH = 32
/** @internal */
export const ALGORAND_ADDRESS_BYTE_LENGTH = 36
/** @internal */
export const ALGORAND_CHECKSUM_BYTE_LENGTH = 4
/** @internal */
export const ALGORAND_ADDRESS_LENGTH = 58

/** @internal */
export const PROGRAM_TAG = 'Program'

/** @internal */
export const TRANSACTION_GROUP_MAX_SIZE = 16

/** @internal */
export enum OnApplicationComplete {
  NoOpOC = 0,
  OptInOC = 1,
  CloseOutOC = 2,
  ClearStateOC = 3,
  UpdateApplicationOC = 4,
  DeleteApplicationOC = 5,
}

/** @internal */
export const ConventionalRouting = {
  methodNames: {
    closeOutOfApplication: 'closeOutOfApplication',
    createApplication: 'createApplication',
    deleteApplication: 'deleteApplication',
    optInToApplication: 'optInToApplication',
    updateApplication: 'updateApplication',
  },
}
