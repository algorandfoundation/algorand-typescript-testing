import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { decodeArc4, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
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

    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector(Hello.prototype.create), (itxnContext) => {
      if (itxnContext.approvalProgram === helloApp.approvalProgram) {
        itxnContext.createdApp = helloApp
      }
    })
    spy.onAbiCall(methodSelector('greet(string)string'), (itxnContext) => {
      if (itxnContext.appId === helloApp) {
        itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(1))}`)
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

    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector(HelloTemplate.prototype.create), (itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateApp
      }
    })
    spy.onAbiCall(methodSelector('greet(string)string'), (itxnContext) => {
      if (itxnContext.appId === helloTemplateApp) {
        itxnContext.setReturnValue(`hey ${decodeArc4<string>(itxnContext.appArgs(1))}`)
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
    const spy = new ApplicationSpy()
    spy.onAbiCall(methodSelector('create()void'), (itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateCustomPrefixApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateCustomPrefixApp
      }
    })
    spy.onAbiCall(methodSelector('greet(string)string'), (itxnContext) => {
      if (itxnContext.appId === helloTemplateCustomPrefixApp) {
        itxnContext.setReturnValue(`bonjour ${decodeArc4<string>(itxnContext.appArgs(1))}`)
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

    const spy = new ApplicationSpy()
    spy.onBareCall((itxnContext) => {
      if (itxnContext.approvalProgram === largeProgramApp.approvalProgram) {
        itxnContext.createdApp = largeProgramApp
      }
    })
    spy.onAbiCall(methodSelector(LargeProgram.prototype.getBigBytesLength), (itxnContext) => {
      if (itxnContext.appId === largeProgramApp) {
        itxnContext.setReturnValue(4096)
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
