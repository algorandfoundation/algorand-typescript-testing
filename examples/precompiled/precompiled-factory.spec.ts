import { arc4, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, it } from 'vitest'
import { Hello, HelloTemplate, HelloTemplateCustomPrefix, LargeProgram, TerribleCustodialAccount } from './precompiled-apps.algo'
import { HelloFactory } from './precompiled-factory.algo'

const MAX_BYTES_SIZE = 4096
const ABI_RETURN_VALUE_LOG_PREFIX = Bytes.fromHex('151F7C75')

describe('pre compiled app calls', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  it('should be able to compile and call a precompiled app', () => {
    // Arrange
    const helloApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(20),
      appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(new arc4.Str('hello world').bytes)],
    })
    ctx.setCompiledApp(Hello, helloApp.id)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract()
  })

  it('should be able to compile with template vars and call a precompiled app', () => {
    // Arrange
    const helloTemplateApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(20),
      appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(new arc4.Str('hey world').bytes)],
    })
    ctx.setCompiledApp(HelloTemplate, helloTemplateApp.id)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract_with_template()
  })

  it('should be able to compile with template vars and custom prefix', () => {
    // Arrange
    const helloTemplateCustomPrefixApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(20),
      appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(new arc4.Str('bonjour world').bytes)],
    })
    ctx.setCompiledApp(HelloTemplateCustomPrefix, helloTemplateCustomPrefixApp.id)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract_with_template_and_custom_prefix()
  })

  it('should be able to compile large program', () => {
    // Arrange
    const largeProgramApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(20),
      appLogs: [ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(MAX_BYTES_SIZE))],
    })
    ctx.setCompiledApp(LargeProgram, largeProgramApp.id)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract_large()
  })

  it('should be able to compile logic sig', () => {
    // Arrange
    const terribleCustodialAccount = ctx.any.account()
    ctx.setCompiledLogicSig(TerribleCustodialAccount, terribleCustodialAccount)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_logic_sig(terribleCustodialAccount.bytes)
  })
})
