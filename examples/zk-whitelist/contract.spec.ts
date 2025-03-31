import { arc4, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it } from 'vitest'
import ZkWhitelistContract from './contract.algo'

const ABI_RETURN_VALUE_LOG_PREFIX = Bytes.fromHex('151F7C75')

describe('ZK Whitelist', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('should be able to add address to whitelist', () => {
    // Arrange
    const contract = ctx.contract.create(ZkWhitelistContract)
    contract.create(ctx.any.arc4.str(10))

    const address = new arc4.Address(ctx.defaultSender)
    const proof = new arc4.DynamicArray<arc4.Address>(new arc4.Address(Bytes(new Uint8Array(Array(32).fill(0)))))

    const dummyVerifierApp = ctx.any.application({ appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes.fromHex('80'))] })
    ctx.setTemplateVar('VERIFIER_APP_ID', dummyVerifierApp.id)

    // Act
    const result = contract.addAddressToWhitelist(address, proof)

    // Assert
    expect(result.native).toEqual('')
    expect(contract.whiteList(ctx.defaultSender).value).toEqual(true)
  })

  it('returns error message if proof verification fails', () => {
    // Arrange
    const contract = ctx.contract.create(ZkWhitelistContract)
    contract.create(ctx.any.arc4.str(10))

    const address = ctx.any.arc4.address()
    const proof = new arc4.DynamicArray<arc4.Address>(new arc4.Address(Bytes(new Uint8Array(Array(32).fill(0)))))
    const dummyVerifierApp = ctx.any.application({ appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(''))] })
    ctx.setTemplateVar('VERIFIER_APP_ID', dummyVerifierApp.id)

    // Act
    const result = contract.addAddressToWhitelist(address, proof)

    // Assert
    expect(result.native).toEqual('Proof verification failed')
  })

  it('returns true if address is already in whitelist', () => {
    // Arrange
    const contract = ctx.contract.create(ZkWhitelistContract)
    contract.create(ctx.any.arc4.str(10))

    const dummyAccount = ctx.any.account({ optedApplications: [ctx.ledger.getApplicationForContract(contract)] })
    contract.whiteList(dummyAccount).value = true

    // Act
    const result = contract.isOnWhitelist(new arc4.Address(dummyAccount))

    // Assert
    expect(result.native).toBe(true)
  })

  it('returns false if address is not in whitelist', () => {
    // Arrange
    const contract = ctx.contract.create(ZkWhitelistContract)
    contract.create(ctx.any.arc4.str(10))

    const dummyAccount = ctx.any.account({ optedApplications: [ctx.ledger.getApplicationForContract(contract)] })
    contract.whiteList(dummyAccount).value = false

    // Act
    const result = contract.isOnWhitelist(new arc4.Address(dummyAccount))

    // Assert
    expect(result.native).toBe(false)
  })
})
