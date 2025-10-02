import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import type { uint64 } from '@algorandfoundation/algorand-typescript'
import { Bytes, Ec, Ecdsa, MimcConfigurations, op, VrfVerify } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import elliptic from 'elliptic'
import js_sha3 from 'js-sha3'
import js_sha512 from 'js-sha512'
import nacl from 'tweetnacl'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, describe, expect, vi } from 'vitest'
import { TestExecutionContext } from '../src'
import { LOGIC_DATA_PREFIX, MAX_BYTES_SIZE, PROGRAM_TAG } from '../src/constants'
import { BytesCls, Uint64Cls } from '../src/impl/primitives'
import { decodePublicKey } from '../src/impl/reference'
import { asBytes, asUint64, asUint8Array, concatUint8Arrays } from '../src/util'
import { getAvmResult, INITIAL_BALANCE_MICRO_ALGOS } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'
import { getPaddedBytes } from './util'

const MAX_ARG_LEN = 2048
const curveMap = {
  [Ecdsa.Secp256k1]: 'secp256k1',
  [Ecdsa.Secp256r1]: 'p256',
}

vi.mock('../src/impl/crypto', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const mod = await importOriginal<typeof import('../src/impl/crypto')>()
  return {
    ...mod,
    vrfVerify: vi.fn(mod.vrfVerify),
    mimc: vi.fn(mod.mimc),
    falconVerify: vi.fn(mod.falconVerify),
  }
})

describe('crypto op codes', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/crypto-ops/contract.algo.ts', { CryptoOpsContract: {} })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  afterEach(() => {
    ctx.reset()
  })

  describe('sha256', async () => {
    test.for([
      ['', 0],
      ['0'.repeat(MAX_ARG_LEN - 14), 0],
      ['abc', 0],
      ['abc', MAX_BYTES_SIZE - 3],
    ])('should return the correct sha256 hash', async ([a, padSize], { appClientCryptoOpsContract: appClient }) => {
      const avmResult = (await getAvmResult({ appClient }, 'verify_sha256', asUint8Array(a as string), padSize))!
      const paddedA = getPaddedBytes(padSize as number, a as string)
      const result = op.sha256(paddedA)
      expect(result).toEqual(avmResult)
    })
  })

  describe('sha3_256', async () => {
    test.for([
      ['', 0],
      ['0'.repeat(MAX_ARG_LEN - 14), 0],
      ['abc', 0],
      ['abc', MAX_BYTES_SIZE - 3],
    ])('should return the correct sha3_256 hash', async ([a, padSize], { appClientCryptoOpsContract: appClient }) => {
      const avmResult = (await getAvmResult({ appClient }, 'verify_sha3_256', asUint8Array(a as string), padSize))!
      const paddedA = getPaddedBytes(padSize as number, a as string)
      const result = op.sha3_256(paddedA)
      expect(result).toEqual(avmResult)
    })
  })

  describe('keccak256', async () => {
    test.for([
      ['', 0],
      ['0'.repeat(MAX_ARG_LEN - 14), 0],
      ['abc', 0],
      ['abc', MAX_BYTES_SIZE - 3],
    ])('should return the correct keccak256 hash', async ([a, padSize], { appClientCryptoOpsContract: appClient }) => {
      const avmResult = await getAvmResult({ appClient }, 'verify_keccak_256', asUint8Array(a as string), padSize)

      const paddedA = getPaddedBytes(padSize as number, a as string)
      const result = op.keccak256(paddedA)
      expect(result).toEqual(avmResult)
      expect(result.length.valueOf()).toBe(32n)
    })
  })

  describe('sha512_256', async () => {
    test.for([
      ['', 0],
      ['0'.repeat(MAX_ARG_LEN - 14), 0],
      ['abc', 0],
      ['abc', MAX_BYTES_SIZE - 3],
    ])('should return the correct sha512_256 hash', async ([a, padSize], { appClientCryptoOpsContract: appClient }) => {
      const avmResult = await getAvmResult({ appClient }, 'verify_sha512_256', asUint8Array(a as string), padSize)

      const paddedA = getPaddedBytes(padSize as number, a as string)
      const result = op.sha512_256(paddedA)
      expect(result).toEqual(avmResult)
      expect(result.length.valueOf()).toBe(32n)
    })
  })

  describe('ed25519verifyBare', async () => {
    test('should return true for valid signature', async ({ appClientCryptoOpsContract: appClient }) => {
      const keyPair = nacl.sign.keyPair()
      const message = 'Test message for ed25519 verification'
      const signature = nacl.sign.detached(asUint8Array(message), keyPair.secretKey)

      const avmResult = await getAvmResult(
        { appClient, sendParams: { staticFee: AlgoAmount.Algos(2000) } },
        'verify_ed25519verify_bare',
        asUint8Array(message),
        signature,
        keyPair.publicKey,
      )
      const result = op.ed25519verifyBare(asBytes(message), Bytes(signature), Bytes(keyPair.publicKey))
      expect(result).toEqual(avmResult)
    })
  })

  describe('ed25519verify', async () => {
    test('should return true for valid signature', async ({ appFactoryCryptoOpsContract }) => {
      const app = await appFactoryCryptoOpsContract.deploy({})
      const approval = app.result.compiledApproval!
      const appCallTxn = ctx.any.txn.applicationCall({
        approvalProgram: Bytes(approval.compiledBase64ToBytes),
      })

      const message = Bytes('Test message for ed25519 verification')
      const account = await localnetFixture.context.generateAccount({
        initialFunds: AlgoAmount.MicroAlgos(INITIAL_BALANCE_MICRO_ALGOS + 100_000),
      })

      const publicKey = decodePublicKey(account.addr.toString())
      const logicSig = concatUint8Arrays(asUint8Array(PROGRAM_TAG), approval.compiledBase64ToBytes)
      const logicSigAddress = js_sha512.sha512_256.array(logicSig)
      const parts = concatUint8Arrays(new Uint8Array(logicSigAddress), asUint8Array(message))
      const toBeSigned = concatUint8Arrays(asUint8Array(LOGIC_DATA_PREFIX), parts)
      const signature = nacl.sign.detached(toBeSigned, account.sk)

      const avmResult = await getAvmResult(
        {
          appClient: app.appClient,
          sendParams: {
            staticFee: AlgoAmount.Algos(2000),
          },
        },
        'verify_ed25519verify',
        asUint8Array(message),
        signature,
        publicKey,
      )

      ctx.txn.createScope([appCallTxn]).execute(() => {
        const result = op.ed25519verify(message, Bytes(signature), Bytes(publicKey))
        expect(result).toEqual(avmResult)
      })
    })
    test('should throw error when no active txn group', async () => {
      expect(() => op.ed25519verify(Bytes(''), op.bzero(64), op.bzero(32))).toThrow('no active txn group')
    })
  })

  describe('ecdsaVerify', async () => {
    test('should be able to verify k1 signature', async ({ appClientCryptoOpsContract: appClient }) => {
      const messageHash = Bytes.fromHex('f809fd0aa0bb0f20b354c6b2f86ea751957a4e262a546bd716f34f69b9516ae1', { length: 32 })
      const sigR = Bytes.fromHex('f7f913754e5c933f3825d3aef22e8bf75cfe35a18bede13e15a6e4adcfe816d2', { length: 32 })
      const sigS = Bytes.fromHex('0b5599159aa859d79677f33280848ae4c09c2061e8b5881af8507f8112966754', { length: 32 })
      const pubkeyX = Bytes.fromHex('a710244d62747aa8db022ddd70617240adaf881b439e5f69993800e614214076', { length: 32 })
      const pubkeyY = Bytes.fromHex('48d0d337704fe2c675909d2c93f7995e199156f302f63c74a8b96827b28d777b', { length: 32 })

      const avmResult = await getAvmResult(
        {
          appClient,
          sendParams: {
            staticFee: AlgoAmount.Algos(5000),
          },
        },
        'verify_ecdsa_verify_k1',
        asUint8Array(messageHash),
        asUint8Array(sigR),
        asUint8Array(sigS),
        asUint8Array(pubkeyX),
        asUint8Array(pubkeyY),
      )
      const result = op.ecdsaVerify(Ecdsa.Secp256k1, messageHash, sigR, sigS, pubkeyX, pubkeyY)

      expect(result).toEqual(avmResult)
    })
    test('should be able to verify r1 signature', async ({ appClientCryptoOpsContract: appClient }) => {
      const messageHash = Bytes.fromHex('f809fd0aa0bb0f20b354c6b2f86ea751957a4e262a546bd716f34f69b9516ae1', { length: 32 })
      const sigR = Bytes.fromHex('18d96c7cda4bc14d06277534681ded8a94828eb731d8b842e0da8105408c83cf', { length: 32 })
      const sigS = Bytes.fromHex('7d33c61acf39cbb7a1d51c7126f1718116179adebd31618c4604a1f03b5c274a', { length: 32 })
      const pubkeyX = Bytes.fromHex('f8140e3b2b92f7cbdc8196bc6baa9ce86cf15c18e8ad0145d50824e6fa890264', { length: 32 })
      const pubkeyY = Bytes.fromHex('bd437b75d6f1db67155a95a0da4b41f2b6b3dc5d42f7db56238449e404a6c0a3', { length: 32 })

      const avmResult = await getAvmResult(
        {
          appClient,
          sendParams: {
            staticFee: AlgoAmount.Algos(5000),
          },
        },
        'verify_ecdsa_verify_r1',
        asUint8Array(messageHash),
        asUint8Array(sigR),
        asUint8Array(sigS),
        asUint8Array(pubkeyX),
        asUint8Array(pubkeyY),
      )
      const result = op.ecdsaVerify(Ecdsa.Secp256r1, messageHash, sigR, sigS, pubkeyX, pubkeyY)

      expect(result).toEqual(avmResult)
    })
  })

  describe('ecdsaPkRecover', async () => {
    test('should be able to recover k1 public key', async ({ appClientCryptoOpsContract: appClient }) => {
      const testData = generateEcdsaTestData(Ecdsa.Secp256k1)
      const a = testData.data
      const b = testData.recoveryId
      const c = testData.r
      const d = testData.s
      const avmResult = await getAvmResult<uint64[][]>(
        { appClient, sendParams: { staticFee: AlgoAmount.Algos(5000) } },

        'verify_ecdsa_recover_k1',
        asUint8Array(a),
        b.asNumber(),
        asUint8Array(c),
        asUint8Array(d),
      )

      const result = op.ecdsaPkRecover(Ecdsa.Secp256k1, a, asUint64(b), c, d)

      expect(result[0]).toEqual(avmResult[0])
      expect(result[1]).toEqual(avmResult[1])
    })

    test('should throw unsupported error when trying to recover r1 public key', async ({ appClientCryptoOpsContract: appClient }) => {
      const testData = generateEcdsaTestData(Ecdsa.Secp256r1)
      const a = testData.data
      const b = testData.recoveryId
      const c = testData.r
      const d = testData.s
      await expect(
        getAvmResult(
          {
            appClient,
            sendParams: {
              staticFee: AlgoAmount.Algos(5000),
            },
          },
          'verify_ecdsa_recover_r1',
          asUint8Array(a),
          b.asNumber(),
          asUint8Array(c),
          asUint8Array(d),
        ),
      ).rejects.toThrow('unsupported curve')

      expect(() => op.ecdsaPkRecover(Ecdsa.Secp256r1, a, asUint64(b), c, d)).toThrow('Unsupported ECDSA curve')
    })
  })

  describe('ecdsaPkDecompress', async () => {
    test('should be able to decompress k1 public key', async ({ appClientCryptoOpsContract: appClient }) => {
      const v = Ecdsa.Secp256k1
      const testData = generateEcdsaTestData(v)
      const ecdsa = new elliptic.ec(curveMap[v])
      const keyPair = ecdsa.keyFromPublic(asUint8Array(testData.pubkeyX.concat(testData.pubkeyY)))
      const pubKeyArray = new Uint8Array(keyPair.getPublic(true, 'array'))
      const avmResult = await getAvmResult<uint64[][]>(
        { appClient, sendParams: { staticFee: AlgoAmount.Algos(3000) } },
        'verify_ecdsa_decompress_k1',
        pubKeyArray,
      )

      const result = op.ecdsaPkDecompress(v, Bytes(pubKeyArray))

      expect(asUint8Array(result[0])).toEqual(new Uint8Array(avmResult[0]))
      expect(asUint8Array(result[1])).toEqual(new Uint8Array(avmResult[1]))
    })
  })

  describe('vrfVerify', async () => {
    const a = Bytes.fromHex('528b9e23d93d0e020a119d7ba213f6beb1c1f3495a217166ecd20f5a70e7c2d7')
    const b = Bytes.fromHex(
      '372a3afb42f55449c94aaa5f274f26543e77e8d8af4babee1a6fbc1c0391aa9e6e0b8d8d7f4ed045d5b517fea8ad3566025ae90d2f29f632e38384b4c4f5b9eb741c6e446b0f540c1b3761d814438b04',
      { length: 80 },
    )

    const c = Bytes.fromHex('3a2740da7a0788ebb12a52154acbcca1813c128ca0b249e93f8eb6563fee418d', { length: 32 })

    test('should throw not available error', async () => {
      const mockedVrfVerify = op.vrfVerify as Mock<typeof op.vrfVerify>
      // restore to original stub implemention which should throw not available error
      mockedVrfVerify.mockRestore()
      expect(() => op.vrfVerify(VrfVerify.VrfAlgorand, asBytes(a), b, c)).toThrow('vrfVerify is not available in test context')
    })

    test('should return mocked result', async ({ appClientCryptoOpsContract: appClient }) => {
      const avmResult = await getAvmResult<[Uint8Array, boolean]>(
        { appClient, sendParams: { staticFee: AlgoAmount.Algos(6000) } },
        'verify_vrf_verify',
        asUint8Array(a),
        asUint8Array(b),
        asUint8Array(c),
      )
      const mockedVrfVerify = op.vrfVerify as Mock<typeof op.vrfVerify>
      mockedVrfVerify.mockReturnValue([Bytes(new Uint8Array(avmResult[0]), { length: 64 }), avmResult[1]])
      const result = op.vrfVerify(VrfVerify.VrfAlgorand, asBytes(a), b, c)

      expect(asUint8Array(result[0])).toEqual(new Uint8Array(avmResult[0]))
      expect(result[1]).toEqual(avmResult[1])
    })
  })

  describe('mimc', async () => {
    const a = encodingUtil.bigIntToUint8Array(1234567890n, 32)

    test('should throw not available error', async () => {
      const mockedMimc = op.mimc as Mock<typeof op.mimc>
      // restore to original stub implemention which should throw not available error
      mockedMimc.mockRestore()
      expect(() => op.mimc(MimcConfigurations.BN254Mp110, Bytes(a))).toThrow('mimc is not available in test context')
    })

    test('should return mocked result', async ({ appClientCryptoOpsContract: appClient }) => {
      const avmResult = await getAvmResult<Uint8Array>(
        { appClient, sendParams: { staticFee: AlgoAmount.Algos(6000) } },
        'verify_mimc',
        asUint8Array(a),
      )
      const mockedMimc = op.mimc as Mock<typeof op.mimc>
      mockedMimc.mockReturnValue(Bytes(avmResult, { length: 32 }))
      const result = op.mimc(MimcConfigurations.BN254Mp110, Bytes(a))

      expect(result).toEqual(avmResult)
    })
  })

  describe('EllipticCurve', async () => {
    test('should throw not available error', async () => {
      expect(() => op.EllipticCurve.add(Ec.BN254g2, Bytes(''), Bytes(''))).toThrow('EllipticCurve.add is not available in test context')
      expect(() => op.EllipticCurve.mapTo(Ec.BN254g2, Bytes(''))).toThrow('EllipticCurve.mapTo is not available in test context')
      expect(() => op.EllipticCurve.pairingCheck(Ec.BN254g2, Bytes(''), Bytes(''))).toThrow(
        'EllipticCurve.pairingCheck is not available in test context',
      )
      expect(() => op.EllipticCurve.scalarMul(Ec.BN254g2, Bytes(''), Bytes(''))).toThrow(
        'EllipticCurve.scalarMul is not available in test context',
      )
      expect(() => op.EllipticCurve.scalarMulMulti(Ec.BN254g2, Bytes(''), Bytes(''))).toThrow(
        'EllipticCurve.scalarMulMulti is not available in test context',
      )
      expect(() => op.EllipticCurve.subgroupCheck(Ec.BN254g2, Bytes(''))).toThrow(
        'EllipticCurve.subgroupCheck is not available in test context',
      )
    })
  })

  describe('falconVerify', async () => {
    const a = Bytes.fromHex('528b9e23d93d0e020a119d7ba213f6beb1c1f3495a217166ecd20f5a70e7c2d7')
    const b = op.bzero(1232)
    const c = op.bzero(1793)

    test('should throw not available error', async () => {
      const mockedFalconVerify = op.falconVerify as Mock<typeof op.falconVerify>
      // restore to original stub implemention which should throw not available error
      mockedFalconVerify.mockRestore()
      expect(() => op.falconVerify(a, b, c)).toThrow('falconVerify is not available in test context')
    })

    test('should return mocked result', () => {
      const mockedFalconVerify = op.falconVerify as Mock<typeof op.falconVerify>
      mockedFalconVerify.mockReturnValue(true)
      const result = op.falconVerify(a, b, c)
      expect(result).toBe(true)
    })
  })
})

const generateEcdsaTestData = (v: Ecdsa) => {
  const ecdsa = new elliptic.ec(curveMap[v])
  const keyPair = ecdsa.genKeyPair()
  const pk = keyPair.getPublic('array')
  const data = BytesCls.fromCompat('test data for ecdsa')
  const messageHash = js_sha3.keccak256.create().update(data.asUint8Array()).digest()
  const signature = keyPair.sign(messageHash)
  const recoveryId = 0 // Recovery ID is typically 0 or 1

  return {
    data: Bytes(new Uint8Array(messageHash), { length: 32 }),
    r: Bytes(new Uint8Array(signature.r.toArray('be', 32)), { length: 32 }),
    s: Bytes(new Uint8Array(signature.s.toArray('be', 32)), { length: 32 }),
    recoveryId: Uint64Cls.fromCompat(recoveryId),
    pubkeyX: Bytes(new Uint8Array(pk.slice(0, 32))),
    pubkeyY: Bytes(new Uint8Array(pk.slice(32))),
  }
}
