---
title: Transactions
---

# Transactions

The testing framework follows the Transaction definitions described in [`algorand-typescript` docs](https://algorandfoundation.github.io/puya-ts/documents/Algorand_TypeScript_Language_Guide.Types.html#group-transactions). This section focuses on _value generators_ and interactions with inner transactions, it also explains how the framework identifies _active_ transaction group during contract method/subroutine/logicsig invocation.

```ts
import * as algots from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'

// Create the context manager for snippets below
const ctx = new TestExecutionContext()
```

## Group Transactions

Refers to test implementation of transaction stubs available under `algots.gtxn.*` namespace. Available under [`TxnValueGenerator`](../classes/value-generators._internal_.TxnValueGenerator.html) instance accessible via `ctx.any.txn` property:

```ts
// Generate a random payment transaction
const payTxn = ctx.any.txn.payment({
  sender: ctx.any.account(), // Optional: Defaults to context's default sender if not provided
  receiver: ctx.any.account(), // Required
  amount: 1000000, // Required
})

// Generate a random asset transfer transaction
const assetTransferTxn = ctx.any.txn.assetTransfer({
  sender: ctx.any.account(), // Optional: Defaults to context's default sender if not provided
  assetReceiver: ctx.any.account(), // Required
  xferAsset: ctx.any.asset({ assetId: 1 }), // Required
  assetAmount: 1000, // Required
})

// Generate a random application call transaction
const appCallTxn = ctx.any.txn.applicationCall({
  appId: ctx.any.application(), // Required
  appArgs: [algots.Bytes('arg1'), algots.Bytes('arg2')], // Optional: Defaults to empty list if not provided
  accounts: [ctx.any.account()], // Optional: Defaults to empty list if not provided
  assets: [ctx.any.asset()], // Optional: Defaults to empty list if not provided
  apps: [ctx.any.application()], // Optional: Defaults to empty list if not provided
  approvalProgramPages: [algots.Bytes('approval_code')], // Optional: Defaults to empty list if not provided
  clearStateProgramPages: [algots.Bytes('clear_code')], // Optional: Defaults to empty list if not provided
  scratchSpace: { 0: algots.Bytes('scratch') }, // Optional: Defaults to empty dict if not provided
})

// Generate a random asset config transaction
const assetConfigTxn = ctx.any.txn.assetConfig({
  sender: ctx.any.account(), // Optional: Defaults to context's default sender if not provided
  configAsset: undefined, // Optional: If not provided, creates a new asset
  total: 1000000, // Required for new assets
  decimals: 0, // Required for new assets
  defaultFrozen: false, // Optional: Defaults to False if not provided
  unitName: algots.Bytes('UNIT'), // Optional: Defaults to empty string if not provided
  assetName: algots.Bytes('Asset'), // Optional: Defaults to empty string if not provided
  url: algots.Bytes('http://asset-url'), // Optional: Defaults to empty string if not provided
  metadataHash: algots.Bytes('metadata_hash'), // Optional: Defaults to empty bytes if not provided
  manager: ctx.any.account(), // Optional: Defaults to sender if not provided
  reserve: ctx.any.account(), // Optional: Defaults to zero address if not provided
  freeze: ctx.any.account(), // Optional: Defaults to zero address if not provided
  clawback: ctx.any.account(), // Optional: Defaults to zero address if not provided
})

// Generate a random key registration transaction
const keyRegTxn = ctx.any.txn.keyRegistration({
  sender: ctx.any.account(), // Optional: Defaults to context's default sender if not provided
  voteKey: algots.Bytes('vote_pk'), // Optional: Defaults to empty bytes if not provided
  selectionKey: algots.Bytes('selection_pk'), // Optional: Defaults to empty bytes if not provided
  voteFirst: 1, // Optional: Defaults to 0 if not provided
  voteLast: 1000, // Optional: Defaults to 0 if not provided
  voteKeyDilution: 10000, // Optional: Defaults to 0 if not provided
})

// Generate a random asset freeze transaction
const assetFreezeTxn = ctx.any.txn.assetFreeze({
  sender: ctx.any.account(), // Optional: Defaults to context's default sender if not provided
  freezeAsset: ctx.ledger.getAsset(algots.Uint64(1)), // Required
  freezeAccount: ctx.any.account(), // Required
  frozen: true, // Required
})
```

## Preparing for execution

When a smart contract instance (application) is interacted with on the Algorand network, it must be performed in relation to a specific transaction or transaction group where one or many transactions are application calls to target smart contract instances.

To emulate this behaviour, the `createScope` context manager is available on [`TransactionContext`](../classes/index._internal_.TransactionContext.html) instance that allows setting temporary transaction fields within a specific scope, passing in emulated transaction objects and identifying the active transaction index within the transaction group

```ts
import { arc4, Txn } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'

class SimpleContract extends arc4.Contract {
  @arc4.abimethod()
  checkSender(): arc4.Address {
    return new arc4.Address(Txn.sender)
  }
}

const ctx = new TestExecutionContext()

// Create a contract instance
const contract = ctx.contract.create(SimpleContract)

// Use active_txn_overrides to change the sender
const testSender = ctx.any.account()

ctx.txn.createScope([ctx.any.txn.applicationCall({ appId: contract, sender: testSender })]).execute(() => {
  // Call the contract method
  const result = contract.checkSender()
  expect(result).toEqual(testSender)
})

// Assert that the sender is the test_sender after exiting the
// transaction group context
expect(ctx.txn.lastActive.sender).toEqual(testSender)

// Assert the size of last transaction group
expect(ctx.txn.lastGroup.transactions.length).toEqual(1)
```

## Inner Transaction

Inner transactions are AVM transactions that are signed and executed by AVM applications (instances of deployed smart contracts or signatures).

When testing smart contracts, to stay consistent with AVM, the framework \_does not allow you to submit inner transactions outside of contract/subroutine invocation, but you can interact with and manage inner transactions using the test execution context as follows:

```ts
import { arc4, Asset, itxn, Txn, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'

class MyContract extends arc4.Contract {
  @arc4.abimethod()
  payViaItxn(asset: Asset) {
    itxn
      .payment({
        receiver: Txn.sender,
        amount: 1,
      })
      .submit()
  }
}

// setup context
const ctx = new TestExecutionContext()

// Create a contract instance
const contract = ctx.contract.create(MyContract)

// Generate a random asset
const asset = ctx.any.asset()

// Execute the contract method
contract.payViaItxn(asset)

// Access the last submitted inner transaction
const paymentTxn = ctx.txn.lastGroup.lastItxnGroup().getPaymentInnerTxn()

// Assert properties of the inner transaction
expect(paymentTxn.receiver).toEqual(ctx.txn.lastActive.sender)
expect(paymentTxn.amount).toEqual(1)

// Access all inner transactions in the last group
ctx.txn.lastGroup.itxnGroups.at(-1)?.itxns.forEach((itxn) => {
  // Perform assertions on each inner transaction
  expect(itxn.type).toEqual(TransactionType.Payment)
})

// Access a specific inner transaction group
const firstItxnGroup = ctx.txn.lastGroup.getItxnGroup(0)
const firstPaymentTxn = firstItxnGroup.getPaymentInnerTxn(0)
expect(firstPaymentTxn.type).toEqual(TransactionType.Payment)
```

In this example, we define a contract method `payViaItxn` that creates and submits an inner payment transaction. The test execution context automatically captures and stores the inner transactions submitted by the contract method.

Note that we don't need to wrap the execution in a `createScope` context manager because the method is decorated with `@arc4.abimethod`, which automatically creates a transaction group for the method. The `createScope` context manager is only needed when you want to create more complex transaction groups or patch transaction fields for various transaction-related opcodes in AVM.

To access the submitted inner transactions:

1. Use `ctx.txn.lastGroup.lastItxnGroup().getPaymentInnerTxn()` to access the last submitted inner transaction of a specific type, in this case payment transaction.
2. Iterate over all inner transactions in the last group using `ctx.txn.lastGroup.itxnGroups.at(-1)?.itxns`.
3. Access a specific inner transaction group using `ctx.txn.lastGroup.getItxnGroup(index)`.

These methods provide type validation and will raise an error if the requested transaction type doesn't match the actual type of the inner transaction.

## Pre-compiled contracts

If your contract needs to deploy other contracts then it's likely you will need access to the compiled approval and clear state programs. The `compile` method takes a contract class and returns the compiled byte code along with some basic schema information. You can use `ctx.setCompiledApp` method set up the mock result for `compile` call and `ApplicationSpy` for mocking subsequent calls to the compiled contract.

```ts
import { assert, compile, Contract, GlobalState, itxn, OnCompleteAction } from '@algorandfoundation/algorand-typescript'
import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { abimethod, decodeArc4, encodeArc4, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'

export class Hello extends Contract {
  greeting = GlobalState({ initialValue: '' })

  @abimethod({ name: 'helloCreate', onCreate: 'require' })
  create(greeting: string) {
    this.greeting.value = greeting
  }

  @abimethod({ allowActions: 'DeleteApplication' })
  delete() {}

  greet(name: string): string {
    return `${this.greeting.value} ${name}`
  }
}

export class HelloFactory extends Contract {
  test_compile_contract() {
    const compiled = compile(Hello)
    const helloApp = itxn
      .applicationCall({
        appArgs: [methodSelector(Hello.prototype.create), encodeArc4('hello')],
        approvalProgram: compiled.approvalProgram,
        clearStateProgram: compiled.clearStateProgram,
        globalNumBytes: 1,
      })
      .submit().createdApp

    const txn = itxn
      .applicationCall({
        appArgs: [methodSelector(Hello.prototype.greet), encodeArc4('world')],
        appId: helloApp,
      })
      .submit()
    const result = decodeArc4<string>(txn.lastLog, 'log')

    assert(result === 'hello world')

    itxn
      .applicationCall({
        appId: helloApp,
        appArgs: [methodSelector(Hello.prototype.delete)],
        onCompletion: OnCompleteAction.DeleteApplication,
      })
      .submit()
  }
}

describe('pre compiled app calls', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  it('should be able to compile and call a precompiled app', () => {
    // Arrange
    const helloApp = ctx.any.application()
    ctx.setCompiledApp(Hello, helloApp.id)

    const spy = new ApplicationSpy(Hello)
    spy.on.create((itxnContext) => {
      itxnContext.createdApp = helloApp
    })
    spy.on.greet((itxnContext) => {
      itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(1))}`)
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactory)

    // Act
    contract.test_compile_contract()
  })
})
```

## Strongly typed contract to contract

Assuming the contract you wish to compile extends the ARC4 `Contract` type, you can make use of `compileArc4` to produce a contract proxy object that makes it easy to invoke application methods with compile time type safety. You can use the same `ctx.setCompiledApp` method set up the mock result for `compile` call and `ApplicationSpy` for mocking subsequent calls to the compiled contract.

```ts
import { assert, Contract, GlobalState } from '@algorandfoundation/algorand-typescript'
import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { abimethod, compileArc4, decodeArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'

export class Hello extends Contract {
  greeting = GlobalState({ initialValue: '' })

  @abimethod({ name: 'helloCreate', onCreate: 'require' })
  create(greeting: string) {
    this.greeting.value = greeting
  }

  @abimethod({ allowActions: 'DeleteApplication' })
  delete() {}

  greet(name: string): string {
    return `${this.greeting.value} ${name}`
  }
}

export class HelloFactoryTyped extends Contract {
  test_compile_contract() {
    const compiled = compileArc4(Hello)

    const app = compiled.call.create({
      args: ['hello'],
    }).itxn.createdApp

    const result = compiled.call.greet({
      args: ['world'],
      appId: app,
    }).returnValue
    assert(result === 'hello world')

    compiled.call.delete({
      appId: app,
    })
  }
}

describe('pre compiled typed app calls', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('should be able to compile and call a precompiled app', () => {
    // Arrange
    const helloApp = ctx.any.application({})
    ctx.setCompiledApp(Hello, helloApp.id)

    const spy = new ApplicationSpy(Hello)
    spy.on.create((itxnContext) => {
      itxnContext.createdApp = helloApp
    })
    spy.on.greet((itxnContext) => {
      itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(1))}`)
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract()
  })
})
```

## Strongly typed ABI calls

If your use case does not require deploying another contract, and instead you are just calling methods then the `abiCall` method will allow you to do this in a strongly typed manner provided you have at bare minimum a compatible stub implementation of the target contract. You can use the same `ApplicationSpy` approach for mocking methods calls.

```ts
import type { Application } from '@algorandfoundation/algorand-typescript'
import { assert, Contract, GlobalState } from '@algorandfoundation/algorand-typescript'
import { ApplicationSpy, TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { abiCall, abimethod, decodeArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, it } from 'vitest'

export class Hello extends Contract {
  greeting = GlobalState({ initialValue: '' })

  @abimethod({ name: 'helloCreate', onCreate: 'require' })
  create(greeting: string) {
    this.greeting.value = greeting
  }

  @abimethod({ allowActions: 'DeleteApplication' })
  delete() {}

  greet(name: string): string {
    return `${this.greeting.value} ${name}`
  }
}

export class HelloFactoryTyped extends Contract {
  test_compile_contract(app: Application) {
    const result2 = abiCall(Hello.prototype.greet, {
      appId: app,
      args: ['abi'],
    }).returnValue

    assert(result2 === 'hello abi')
  }
}

describe('pre compiled typed app calls', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  it('should be able to compile and call a precompiled app', () => {
    // Arrange
    const helloApp = ctx.any.application({})

    const spy = new ApplicationSpy(Hello)
    spy.on.greet((itxnContext) => {
      itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(1))}`)
    })
    ctx.addApplicationSpy(spy)

    const contract = ctx.contract.create(HelloFactoryTyped)

    // Act
    contract.test_compile_contract(helloApp)
  })
})
```

## References

- [API](../modules/index.html) for more details on the test context manager and inner transactions related methods that perform implicit inner transaction type validation.
- [Examples](./examples.md) for more examples of smart contracts and associated tests that interact with inner transactions.
- [ApplicationSpy](./tg-application-spy.md) for detailed explanation on the usage of it

```ts
// test cleanup
ctx.reset()
```
