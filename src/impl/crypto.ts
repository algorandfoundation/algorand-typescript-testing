import type { bytes, gtxn, MimcConfigurations, op, VrfVerify } from '@algorandfoundation/algorand-typescript'
import { Ecdsa, OnCompleteAction } from '@algorandfoundation/algorand-typescript'
import elliptic from 'elliptic'
import js_sha256 from 'js-sha256'
import js_sha3 from 'js-sha3'
import js_sha512 from 'js-sha512'
import nacl from 'tweetnacl'
import { LOGIC_DATA_PREFIX, PROGRAM_TAG } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError, NotImplementedError } from '../errors'
import { asBytes, asBytesCls, asUint8Array, concatUint8Arrays } from '../util'
import type { StubBytesCompat, StubUint64Compat } from './primitives'
import { Bytes, BytesCls, Uint64Cls } from './primitives'

/** @internal */
export const sha256 = (a: StubBytesCompat): bytes<32> => {
  const bytesA = BytesCls.fromCompat(a)
  const hashArray = js_sha256.sha256.create().update(bytesA.asUint8Array()).digest()
  const hashBytes = Bytes(new Uint8Array(hashArray), { length: 32 })
  return hashBytes
}

/** @internal */
export const sha3_256 = (a: StubBytesCompat): bytes<32> => {
  const bytesA = BytesCls.fromCompat(a)
  const hashArray = js_sha3.sha3_256.create().update(bytesA.asUint8Array()).digest()
  const hashBytes = Bytes(new Uint8Array(hashArray), { length: 32 })
  return hashBytes
}

/** @internal */
export const keccak256 = (a: StubBytesCompat): bytes<32> => {
  const bytesA = BytesCls.fromCompat(a)
  const hashArray = js_sha3.keccak256.create().update(bytesA.asUint8Array()).digest()
  const hashBytes = Bytes(new Uint8Array(hashArray), { length: 32 })
  return hashBytes
}

/** @internal */
export const sha512_256 = (a: StubBytesCompat): bytes<32> => {
  const bytesA = BytesCls.fromCompat(a)
  const hashArray = js_sha512.sha512_256.create().update(bytesA.asUint8Array()).digest()
  const hashBytes = Bytes(new Uint8Array(hashArray), { length: 32 })
  return hashBytes
}

/** @internal */
export const ed25519verifyBare = (a: StubBytesCompat, b: StubBytesCompat, c: StubBytesCompat): boolean => {
  const bytesA = BytesCls.fromCompat(a)
  const bytesB = BytesCls.fromCompat(b)
  const bytesC = BytesCls.fromCompat(c)
  return nacl.sign.detached.verify(bytesA.asUint8Array(), bytesB.asUint8Array(), bytesC.asUint8Array())
}

/** @internal */
export const ed25519verify = (a: StubBytesCompat, b: StubBytesCompat, c: StubBytesCompat): boolean => {
  const txn = lazyContext.activeGroup.activeTransaction as gtxn.ApplicationCallTxn
  const programBytes = asBytesCls(txn.onCompletion == OnCompleteAction.ClearState ? txn.clearStateProgram : txn.approvalProgram)

  const logicSig = concatUint8Arrays(asUint8Array(PROGRAM_TAG), programBytes.asUint8Array())
  const logicSigAddress = js_sha512.sha512_256.array(logicSig)

  const addressBytes = Bytes(logicSigAddress)
  const data = LOGIC_DATA_PREFIX.concat(addressBytes).concat(asBytes(a))
  return ed25519verifyBare(data, b, c)
}

/** @internal */
export const ecdsaVerify = (
  v: Ecdsa,
  a: StubBytesCompat,
  b: StubBytesCompat,
  c: StubBytesCompat,
  d: StubBytesCompat,
  e: StubBytesCompat,
): boolean => {
  const dataBytes = BytesCls.fromCompat(a)
  const sigRBytes = BytesCls.fromCompat(b)
  const sigSBytes = BytesCls.fromCompat(c)
  const pubkeyXBytes = BytesCls.fromCompat(d)
  const pubkeyYBytes = BytesCls.fromCompat(e)

  const publicKey = BytesCls.fromCompat(new Uint8Array([0x04]))
    .concat(pubkeyXBytes)
    .concat(pubkeyYBytes)

  const ecdsa = new elliptic.ec(curveMap[v])
  const keyPair = ecdsa.keyFromPublic(publicKey.asUint8Array())
  return keyPair.verify(dataBytes.asUint8Array(), { r: sigRBytes.asUint8Array(), s: sigSBytes.asUint8Array() })
}

/** @internal */
export const ecdsaPkRecover = (
  v: Ecdsa,
  a: StubBytesCompat,
  b: StubUint64Compat,
  c: StubBytesCompat,
  d: StubBytesCompat,
): readonly [bytes<32>, bytes<32>] => {
  if (v !== Ecdsa.Secp256k1) {
    throw new InternalError(`Unsupported ECDSA curve: ${v}`)
  }
  const dataBytes = BytesCls.fromCompat(a)
  const rBytes = BytesCls.fromCompat(c)
  const sBytes = BytesCls.fromCompat(d)
  const recoveryId = Uint64Cls.fromCompat(b)

  const ecdsa = new elliptic.ec(curveMap[v])
  const pubKey = ecdsa.recoverPubKey(
    dataBytes.asUint8Array(),
    { r: rBytes.asUint8Array(), s: sBytes.asUint8Array() },
    recoveryId.asNumber(),
  )

  const x = pubKey.getX().toArray('be')
  const y = pubKey.getY().toArray('be')
  return [Bytes(x, { length: 32 }), Bytes(y, { length: 32 })]
}

/** @internal */
export const ecdsaPkDecompress = (v: Ecdsa, a: StubBytesCompat): readonly [bytes<32>, bytes<32>] => {
  const bytesA = BytesCls.fromCompat(a)

  const ecdsa = new elliptic.ec(curveMap[v])
  const keyPair = ecdsa.keyFromPublic(bytesA.asUint8Array())
  const pubKey = keyPair.getPublic()

  const x = pubKey.getX().toArray('be')
  const y = pubKey.getY().toArray('be')
  return [Bytes(x, { length: 32 }), Bytes(y, { length: 32 })]
}

/** @internal */
export const vrfVerify = (_s: VrfVerify, _a: StubBytesCompat, _b: StubBytesCompat, _c: StubBytesCompat): readonly [bytes<64>, boolean] => {
  throw new NotImplementedError('vrfVerify')
}

/** @internal */
export const EllipticCurve = new Proxy({} as typeof op.EllipticCurve, {
  get: (_target, prop) => {
    throw new NotImplementedError(`EllipticCurve.${prop.toString()}`)
  },
})

/** @internal */
export const mimc = (_c: MimcConfigurations, _a: StubBytesCompat): bytes => {
  throw new NotImplementedError('mimc')
}

/** @internal */
export const falconVerify = (_a: StubBytesCompat, _b: StubBytesCompat, _c: StubBytesCompat): boolean => {
  throw new NotImplementedError('falconVerify')
}

const curveMap = {
  [Ecdsa.Secp256k1]: 'secp256k1',
  [Ecdsa.Secp256r1]: 'p256',
}
