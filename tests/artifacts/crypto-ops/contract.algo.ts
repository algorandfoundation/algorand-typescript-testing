import { arc4, bytes, Ecdsa, ensureBudget, op, OpUpFeeSource, uint64, VrfVerify } from '@algorandfoundation/algorand-typescript'

export class CryptoOpsContract extends arc4.Contract {
  @arc4.abimethod()
  public verify_sha256(a: bytes, pad_size: uint64): bytes {
    const paddedA = op.bzero(pad_size).concat(a)
    const result = op.sha256(paddedA)
    return result
  }

  @arc4.abimethod()
  public verify_sha3_256(a: bytes, pad_size: uint64): bytes {
    const paddedA = op.bzero(pad_size).concat(a)
    const result = op.sha3_256(paddedA)
    return result
  }

  @arc4.abimethod()
  public verify_keccak_256(a: bytes, pad_size: uint64): bytes {
    const paddedA = op.bzero(pad_size).concat(a)
    const result = op.keccak256(paddedA)
    return result
  }

  @arc4.abimethod()
  public verify_sha512_256(a: bytes, pad_size: uint64): bytes {
    const paddedA = op.bzero(pad_size).concat(a)
    const result = op.sha512_256(paddedA)
    return result
  }

  // TODO: return arc4.Bool to match python version when arc4 types are available
  @arc4.abimethod()
  public verify_ed25519verify(a: bytes, b: bytes, c: bytes): boolean {
    ensureBudget(1900, OpUpFeeSource.GroupCredit)
    const result = op.ed25519verify(a, b, c)
    return result
  }

  // TODO: return arc4.Bool to match python version when arc4 types are available
  @arc4.abimethod()
  public verify_ed25519verify_bare(a: bytes, b: bytes, c: bytes): boolean {
    ensureBudget(1900, OpUpFeeSource.GroupCredit)
    const result = op.ed25519verifyBare(a, b, c)
    return result
  }

  @arc4.abimethod()
  public verify_ecdsa_verify_k1(a: bytes, b: bytes, c: bytes, d: bytes, e: bytes): boolean {
    ensureBudget(3000, OpUpFeeSource.GroupCredit)
    const result_k1 = op.ecdsaVerify(Ecdsa.Secp256k1, a, b, c, d, e)
    return result_k1
  }

  @arc4.abimethod()
  public verify_ecdsa_verify_r1(a: bytes, b: bytes, c: bytes, d: bytes, e: bytes): boolean {
    ensureBudget(3000, OpUpFeeSource.GroupCredit)
    const result_r1 = op.ecdsaVerify(Ecdsa.Secp256r1, a, b, c, d, e)
    return result_r1
  }

  @arc4.abimethod()
  public verify_ecdsa_recover_k1(a: bytes, b: uint64, c: bytes, d: bytes): readonly [bytes, bytes] {
    ensureBudget(3000, OpUpFeeSource.GroupCredit)
    return op.ecdsaPkRecover(Ecdsa.Secp256k1, a, b, c, d)
  }

  @arc4.abimethod()
  public verify_ecdsa_recover_r1(a: bytes, b: uint64, c: bytes, d: bytes): readonly [bytes, bytes] {
    /**
     * Must fail, AVM does not support Secp256r1 for recover
     */
    ensureBudget(3000, OpUpFeeSource.GroupCredit)
    return op.ecdsaPkRecover(Ecdsa.Secp256r1, a, b, c, d)
  }

  @arc4.abimethod()
  public verify_ecdsa_decompress_k1(a: bytes): readonly [bytes, bytes] {
    ensureBudget(700, OpUpFeeSource.GroupCredit)
    return op.ecdsaPkDecompress(Ecdsa.Secp256k1, a)
  }

  @arc4.abimethod()
  public verify_ecdsa_decompress_r1(a: bytes): readonly [bytes, bytes] {
    ensureBudget(700, OpUpFeeSource.GroupCredit)
    return op.ecdsaPkDecompress(Ecdsa.Secp256r1, a)
  }

  @arc4.abimethod()
  public verify_vrf_verify(a: bytes, b: bytes, c: bytes): readonly [bytes, boolean] {
    ensureBudget(5700, OpUpFeeSource.GroupCredit)
    const result = op.vrfVerify(VrfVerify.VrfAlgorand, a, b, c)
    return result
  }
}
