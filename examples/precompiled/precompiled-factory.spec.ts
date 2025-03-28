import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type { Str } from '@algorandfoundation/algorand-typescript/arc4'
import { decodeArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'
import { Hello, HelloTemplate, HelloTemplateCustomPrefix, LargeProgram, TerribleCustodialAccount } from './precompiled-apps.algo'
import { HelloFactory } from './precompiled-factory.algo'

describe('pre compiled app calls', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  it('should be able to compile and call a precompiled app', () => {
    // Arrange
    const helloApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(Hello, helloApp.id)

    const spy = new ApplicationSpy(Hello)
    spy.onAbiCall(Hello.prototype.create, (itxnContext) => {
      if (itxnContext.approvalProgram === helloApp.approvalProgram) {
        itxnContext.createdApp = helloApp
      }
    })
    spy.onAbiCall(Hello.prototype.greet, (itxnContext) => {
      if (itxnContext.appId === helloApp) {
        itxnContext.returnValue = `hello ${decodeArc4<Str>(itxnContext.args[0])}`
      }
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract()
  })

  it('should be able to compile with template vars and call a precompiled app', () => {
    // Arrange
    const helloTemplateApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(HelloTemplate, helloTemplateApp.id)

    const spy = new ApplicationSpy(HelloTemplate)
    spy.onAbiCall(HelloTemplate.prototype.create, (itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateApp
      }
    })
    spy.onAbiCall(HelloTemplate.prototype.greet, (itxnContext) => {
      if (itxnContext.appId === helloTemplateApp) {
        itxnContext.returnValue = `hey ${decodeArc4<Str>(itxnContext.args[0])}`
      }
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract_with_template()
  })

  it('should be able to compile with template vars and custom prefix', () => {
    // Arrange
    const helloTemplateCustomPrefixApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(HelloTemplateCustomPrefix, helloTemplateCustomPrefixApp.id)
    const spy = new ApplicationSpy(HelloTemplateCustomPrefix)
    spy.onAbiCall(HelloTemplateCustomPrefix.prototype.create, (itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateCustomPrefixApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateCustomPrefixApp
      }
    })
    spy.onAbiCall(HelloTemplateCustomPrefix.prototype.greet, (itxnContext) => {
      if (itxnContext.appId === helloTemplateCustomPrefixApp) {
        itxnContext.returnValue = `bonjour ${decodeArc4<Str>(itxnContext.args[0])}`
      }
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract_with_template_and_custom_prefix()
  })

  it('should be able to compile large program', () => {
    // Arrange
    const largeProgramApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(LargeProgram, largeProgramApp.id)

    const spy = new ApplicationSpy(LargeProgram)
    spy.onAbiCall('bareCreate', (itxnContext) => {
      if (itxnContext.approvalProgram === largeProgramApp.approvalProgram) {
        itxnContext.createdApp = largeProgramApp
      }
    })
    spy.onAbiCall(LargeProgram.prototype.getBigBytesLength, (itxnContext) => {
      if (itxnContext.appId === largeProgramApp) {
        itxnContext.returnValue = 4096
      }
    })
    ctx.addApplicationSpy(spy)

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
