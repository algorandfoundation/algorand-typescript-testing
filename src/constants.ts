import { Bytes } from './impl/primitives'

export const UINT64_SIZE = 64
export const UINT512_SIZE = 512
export const MAX_UINT8 = 2 ** 8 - 1
export const MAX_UINT16 = 2 ** 16 - 1
export const MAX_UINT32 = 2 ** 32 - 1
export const MAX_UINT64 = 2n ** 64n - 1n
export const MAX_UINT128 = 2n ** 128n - 1n
export const MAX_UINT256 = 2n ** 256n - 1n
export const MAX_UINT512 = 2n ** 512n - 1n
export const MAX_BYTES_SIZE = 4096
export const MAX_LOG_SIZE = 1024
export const MAX_ITEMS_IN_LOG = 32
export const MAX_BOX_SIZE = 32768
export const BITS_IN_BYTE = 8
export const DEFAULT_ACCOUNT_MIN_BALANCE = 100_000
export const DEFAULT_MAX_TXN_LIFE = 1_000
export const DEFAULT_ASSET_CREATE_MIN_BALANCE = 1000_000
export const DEFAULT_ASSET_OPT_IN_MIN_BALANCE = 10_000

// from python code: list(b"\x85Y\xb5\x14x\xfd\x89\xc1vC\xd0]\x15\xa8\xaek\x10\xabG\xbbm\x8a1\x88\x11V\xe6\xbd;\xae\x95\xd1")
export const DEFAULT_GLOBAL_GENESIS_HASH = Bytes(
  new Uint8Array([
    133, 89, 181, 20, 120, 253, 137, 193, 118, 67, 208, 93, 21, 168, 174, 107, 16, 171, 71, 187, 109, 138, 49, 136, 17, 86, 230, 189, 59,
    174, 149, 209,
  ]),
)

// algorand encoded address of 32 zero bytes
export const ZERO_ADDRESS = Bytes.fromBase32('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')

/**
"\x09"  # pragma version 9
"\x81\x01"  # pushint 1
 */
export const ALWAYS_APPROVE_TEAL_PROGRAM = Bytes(new Uint8Array([0x09, 0x81, 0x01]))

// bytes: program (logic) data prefix when signing
export const LOGIC_DATA_PREFIX = Bytes('ProgData')

//number: minimum transaction fee
export const MIN_TXN_FEE = 1000

export const ABI_RETURN_VALUE_LOG_PREFIX = Bytes.fromHex('151F7C75')

export const UINT64_OVERFLOW_UNDERFLOW_MESSAGE = 'Uint64 overflow or underflow'
export const BIGUINT_OVERFLOW_UNDERFLOW_MESSAGE = 'BigUint overflow or underflow'
export const DEFAULT_TEMPLATE_VAR_PREFIX = 'TMPL_'

export const APP_ID_PREFIX = 'appID'
export const HASH_BYTES_LENGTH = 32
export const ALGORAND_ADDRESS_BYTE_LENGTH = 36
export const ALGORAND_CHECKSUM_BYTE_LENGTH = 4
export const ALGORAND_ADDRESS_LENGTH = 58

export const PROGRAM_TAG = 'Program'

export const TRANSACTION_GROUP_MAX_SIZE = 16

export enum OnApplicationComplete {
  NoOpOC = 0,
  OptInOC = 1,
  CloseOutOC = 2,
  ClearStateOC = 3,
  UpdateApplicationOC = 4,
  DeleteApplicationOC = 5,
}
