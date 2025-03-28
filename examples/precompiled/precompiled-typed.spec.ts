import type { Application, gtxn } from '@algorandfoundation/algorand-typescript'
import { OnCompleteAction } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'
import {
  Hello,
  HelloStubbed,
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
    const helloApp = ctx.any.application({})
    ctx.setCompiledAppProxy(Hello, {
      call: {
        create: (_) => ({
          itxn: ctx.any.txn.applicationCall({
            createdApp: helloApp,
          }),
        }),
        greet: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(Hello.prototype.greet), ...args!.args],
          }),
          returnValue: `hello ${args!.args[0]}`,
        }),
        delete: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(Hello.prototype.delete)],
            onCompletion: OnCompleteAction.DeleteApplication,
          }),
        }),
      },
    })

    ctx.setAbiCallResponse(Hello.prototype.greet, (args) => ({
      itxn: ctx.any.txn.applicationCall({
        appId: args!.appId as Application,
        appArgs: [methodSelector(Hello.prototype.greet), ...args!.args],
      }),
      returnValue: `hello ${args!.args[0]}`,
    }))

    ctx.setAbiCallResponse(HelloStubbed.prototype.greet, (args) => ({
      itxn: ctx.any.txn.applicationCall({
        appId: args!.appId as Application,
        appArgs: [methodSelector(HelloStubbed.prototype.greet), ...args!.args],
      }),
      returnValue: `hello stubbed`,
    }))

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract()
  })

  it('should be able to compile with template vars and call a precompiled app', () => {
    // Arrange
    const helloTemplateApp = ctx.any.application({})
    ctx.setCompiledAppProxy(HelloTemplate, {
      call: {
        create: (_) => ({
          itxn: ctx.any.txn.applicationCall({
            createdApp: helloTemplateApp,
          }),
        }),
        greet: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(HelloTemplate.prototype.greet), ...args!.args],
          }),
          returnValue: `hey ${args!.args[0]}`,
        }),
        delete: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(HelloTemplate.prototype.delete)],
            onCompletion: OnCompleteAction.DeleteApplication,
          }),
        }),
      },
    })

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract_with_template()
  })

  it('should be able to compile with template vars and custom prefix', () => {
    // Arrange
    const helloTemplateApp = ctx.any.application({})
    ctx.setCompiledAppProxy(HelloTemplateCustomPrefix, {
      call: {
        create: (_) => ({
          itxn: ctx.any.txn.applicationCall({
            createdApp: helloTemplateApp,
          }),
        }),
        greet: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(HelloTemplateCustomPrefix.prototype.greet), ...args!.args],
          }),
          returnValue: `bonjour ${args!.args[0]}`,
        }),
        delete: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(HelloTemplateCustomPrefix.prototype.delete)],
            onCompletion: OnCompleteAction.DeleteApplication,
          }),
        }),
      },
    })

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract_with_template_and_custom_prefix()
  })

  it('should be able to compile large program', () => {
    // Arrange
    const largeProgramApp = ctx.any.application({})
    ctx.setCompiledAppProxy(LargeProgram, {
      call: {
        getBigBytesLength: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(LargeProgram.prototype.getBigBytesLength)],
          }),
          returnValue: 4096,
        }),
        delete: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(LargeProgram.prototype.delete)],
            onCompletion: OnCompleteAction.DeleteApplication,
          }),
        }),
      },
      bareCreate: () => ({
        createdApp: largeProgramApp,
      }),
    })

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract_large()
  })

  it('should be able to call contract with transactions', () => {
    // Arrange
    const receivesTxnsApp = ctx.any.application({})
    ctx.setCompiledAppProxy(ReceivesTxns, {
      bareCreate: () => ({
        createdApp: receivesTxnsApp,
      }),
      call: {
        receivesAnyTxn: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(ReceivesTxns.prototype.receivesAnyTxn), ...args!.args],
          }),
          returnValue: 1,
        }),
        receivesAssetConfig: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(ReceivesTxns.prototype.receivesAssetConfig), ...args!.args],
          }),
          returnValue: (args!.args[0] as unknown as gtxn.AssetConfigTxn).txnId,
        }),
        receivesAssetConfigAndPay: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(ReceivesTxns.prototype.receivesAssetConfigAndPay), ...args!.args],
          }),
        }),
      },
    })

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_call_contract_with_transactions()
  })

  it('should be able to call contract with reference types', () => {
    // Arrange
    const receivesReferenceTypesApp = ctx.any.application({})

    ctx.setCompiledAppProxy(ReceivesReferenceTypes, {
      bareCreate: () => ({
        createdApp: receivesReferenceTypesApp,
      }),
      call: {
        receivesReferenceTypes: (args) => ({
          itxn: ctx.any.txn.applicationCall({
            appId: args!.appId as Application,
            appArgs: [methodSelector(ReceivesReferenceTypes.prototype.receivesReferenceTypes), ...args!.args],
            appLogs: [args!.args[0].address.bytes, args!.args[1].bytes, args!.args[2].name],
          }),
        }),
      },
    })

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act

    contract.test_call_contract_with_reference_types()
  })
})
