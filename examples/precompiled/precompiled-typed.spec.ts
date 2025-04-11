import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { decodeArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'
import {
  Hello,
  HelloTemplate,
  HelloTemplateCustomPrefix,
  LargeProgram,
  ReceivesReferenceTypes,
  ReceivesTxns,
} from './precompiled-apps.algo'
import { HelloFactoryTyped } from './precompiled-typed.algo'

describe('pre compiled typed app calls', () => {
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
    spy.on.create((itxnContext) => {
      if (itxnContext.approvalProgram === helloApp.approvalProgram) {
        itxnContext.createdApp = helloApp
      }
    })
    spy.on.greet((itxnContext) => {
      if (itxnContext.appId === helloApp) {
        itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(1))}`)
      }
    })

    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

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
    spy.on.create((itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateApp
      }
    })
    spy.on.greet((itxnContext) => {
      if (itxnContext.appId === helloTemplateApp) {
        itxnContext.setReturnValue(`hey ${decodeArc4<string>(itxnContext.appArgs(1))}`)
      }
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract_with_template()
  })

  it('should be able to compile with template vars and custom prefix', () => {
    // Arrange
    const helloTemplateApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(HelloTemplateCustomPrefix, helloTemplateApp.id)
    const spy = new ApplicationSpy(HelloTemplateCustomPrefix)
    spy.on.create((itxnContext) => {
      if (itxnContext.approvalProgram === helloTemplateApp.approvalProgram) {
        itxnContext.createdApp = helloTemplateApp
      }
    })
    spy.on.greet((itxnContext) => {
      if (itxnContext.appId === helloTemplateApp) {
        itxnContext.setReturnValue(`bonjour ${decodeArc4<string>(itxnContext.appArgs(1))}`)
      }
    })

    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

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
    spy.onBareCall((itxnContext) => {
      if (itxnContext.approvalProgram === largeProgramApp.approvalProgram) {
        itxnContext.createdApp = largeProgramApp
      }
    })
    spy.on.getBigBytesLength((itxnContext) => {
      if (itxnContext.appId === largeProgramApp) {
        itxnContext.setReturnValue(4096)
      }
    })

    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract_large()
  })

  it('should be able to call contract with transactions', () => {
    // Arrange
    const receivesTxnsApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(ReceivesTxns, receivesTxnsApp.id)
    const spy = new ApplicationSpy(ReceivesTxns)
    spy.onBareCall((itxnContext) => {
      if (itxnContext.approvalProgram === receivesTxnsApp.approvalProgram) {
        itxnContext.createdApp = receivesTxnsApp
      }
    })
    spy.on.receivesAnyTxn((itxnContext) => {
      if (itxnContext.appId === receivesTxnsApp) {
        itxnContext.setReturnValue(1)
      }
    })

    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_call_contract_with_transactions()
  })

  it('should be able to call contract with reference types', () => {
    // Arrange
    const receivesReferenceTypesApp = ctx.any.application({
      approvalProgram: ctx.any.bytes(),
    })
    ctx.setCompiledApp(ReceivesReferenceTypes, receivesReferenceTypesApp.id)
    const spy = new ApplicationSpy(ReceivesReferenceTypes)
    spy.onBareCall((itxnContext) => {
      if (itxnContext.approvalProgram === receivesReferenceTypesApp.approvalProgram) {
        itxnContext.createdApp = receivesReferenceTypesApp
      }
    })
    spy.on.receivesReferenceTypes((itxnContext) => {
      if (itxnContext.appId === receivesReferenceTypesApp) {
        itxnContext.appendLog(itxnContext.apps(1).address.bytes)
        itxnContext.appendLog(itxnContext.accounts(1).bytes)
        itxnContext.appendLog(itxnContext.assets(0).name)
      }
    })

    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act

    contract.test_call_contract_with_reference_types()
  })
})
