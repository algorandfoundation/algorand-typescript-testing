---
title: State Management
---

# State Management

`algorand-typescript-testing` provides tools to test state-related abstractions in Algorand smart contracts. This guide covers global state, local state, boxes, and scratch space management.

```ts
import * as algots from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'

// Create the context manager for snippets below
const ctx = new TestExecutionContext()
```

## Global State

Global state is represented as instance attributes on `algots.Contract` and `algots.arc4.Contract` classes.

```ts
class MyContract extends algots.arc4.Contract {
  stateA = algots.GlobalState<algots.uint64>({ key: 'globalStateA' })
  stateB = algots.GlobalState({ initialValue: algots.Uint64(1), key: 'globalStateB' })
}

// In your test
const contract = ctx.contract.create(MyContract)
contract.stateA.value = algots.Uint64(10)
contract.stateB.value = algots.Uint64(20)
```

## GlobalMap

`GlobalMap` provides a key-value mapping stored in global state. Keys are prefixed with either an explicit `keyPrefix` or the attribute name by default.

**Note**: _Contracts using `GlobalMap` must specify adequate [`stateTotals`](https://algorandfoundation.github.io/puya-ts/language-guide/program-structure/#contract-options) to allocate enough global storage slots for the application on creation._

```ts
@algots.contract({ stateTotals: { globalUints: 5, globalBytes: 5 } })
class MyContract extends algots.arc4.Contract {
  // Implicit key prefix (derived from attribute name)
  counters = algots.GlobalMap<algots.uint64, algots.arc4.Uint64>()

  // Explicit key prefix
  labels = algots.GlobalMap<algots.uint64, algots.arc4.Str>({ keyPrefix: 'my_labels' })

  @algots.arc4.abimethod()
  setCounter(key: algots.uint64, value: algots.arc4.Uint64): void {
    this.counters(key).value = value
  }

  @algots.arc4.abimethod()
  getCounter(key: algots.uint64): algots.arc4.Uint64 {
    return this.counters(key).value
  }
}

// In your test
const contract = ctx.contract.create(MyContract)

// Set and get values
contract.setCounter(algots.Uint64(1), new algots.arc4.Uint64(42))
expect(contract.getCounter(algots.Uint64(1))).toEqual(new algots.arc4.Uint64(42))

// Check key prefix
expect(contract.counters.keyPrefix).toEqual('counters')
expect(contract.labels.keyPrefix).toEqual('my_labels')

// Check existence and delete
expect(contract.counters(algots.Uint64(1)).hasValue).toBe(true)
contract.counters(algots.Uint64(1)).delete()
expect(contract.counters(algots.Uint64(1)).hasValue).toBe(false)
```

## Local State

Local state is defined similarly to global state, but accessed using account addresses as keys.

```ts
class MyContract extends algots.arc4.Contract {
  localStateA = algots.LocalState<algots.uint64>({ key: 'localStateA' })
}

// In your test
const contract = ctx.contract.create(MyContract)
const account = ctx.any.account()
contract.localStateA(account).value = algots.Uint64(10)
```

## LocalMap

`LocalMap` provides a key-value mapping stored in local state, scoped per account. Like `GlobalMap`, keys are prefixed with either an explicit `keyPrefix` or the attribute name.

**Note**: _Contracts using `LocalMap` must specify adequate [`stateTotals`](https://algorandfoundation.github.io/puya-ts/language-guide/program-structure/#contract-options) to allocate enough local storage slots for the application on creation._

```ts
@algots.contract({ stateTotals: { localUints: 5, localBytes: 5 } })
class MyContract extends algots.arc4.Contract {
  scores = algots.LocalMap<algots.uint64, algots.arc4.Uint64>()

  @algots.arc4.abimethod({ allowActions: ['OptIn'] })
  opt_in(): void {}

  @algots.arc4.abimethod()
  setScore(account: algots.Account, key: algots.uint64, value: algots.arc4.Uint64): void {
    this.scores(key, account).value = value
  }

  @algots.arc4.abimethod()
  getScore(account: algots.Account, key: algots.uint64): algots.arc4.Uint64 {
    return this.scores(key, account).value
  }
}

// In your test
const contract = ctx.contract.create(MyContract)
const account1 = ctx.defaultSender
const account2 = ctx.any.account()

// Set values per account
contract.setScore(account1, algots.Uint64(1), new algots.arc4.Uint64(100))
contract.setScore(account2, algots.Uint64(1), new algots.arc4.Uint64(200))

// Each account has independent state
expect(contract.getScore(account1, algots.Uint64(1))).toEqual(new algots.arc4.Uint64(100))
expect(contract.getScore(account2, algots.Uint64(1))).toEqual(new algots.arc4.Uint64(200))

// Check existence and delete
expect(contract.scores(algots.Uint64(1), account1).hasValue).toBe(true)
contract.scores(algots.Uint64(1), account1).delete()
expect(contract.scores(algots.Uint64(1), account1).hasValue).toBe(false)
```

## Boxes

The framework supports various Box abstractions available in `algorand-typescript`.

```ts
class MyContract extends algots.arc4.Contract {
  box: algots.Box<algots.uint64> | undefined
  boxMap = algots.BoxMap<algots.bytes, algots.uint64>({ keyPrefix: 'boxMap' })

  @algots.arc4.abimethod()
  someMethod(keyA: algots.bytes, keyB: algots.bytes, keyC: algots.bytes) {
    this.box = algots.Box<algots.uint64>({ key: keyA })
    this.box.value = algots.Uint64(1)
    this.boxMap.set(keyB, algots.Uint64(1))
    this.boxMap.set(keyC, algots.Uint64(2))
  }
}

// In your test
const contract = ctx.contract.create(MyContract)
const keyA = algots.Bytes('keyA')
const keyB = algots.Bytes('keyB')
const keyC = algots.Bytes('keyC')

contract.someMethod(keyA, keyB, keyC)

// Access boxes
const boxContent = ctx.ledger.getBox(contract, keyA)
expect(ctx.ledger.boxExists(contract, keyA)).toBe(true)

// Set box content manually
ctx.ledger.setBox(contract, keyA, algots.op.itob(algots.Uint64(1)))
```

## Scratch Space

Scratch space is represented as a list of 256 slots for each transaction.

```ts
@algots.contract({ scratchSlots: [1, 2, { from: 3, to: 20 }] })
class MyContract extends algots.Contract {
  approvalProgram(): boolean {
    algots.op.Scratch.store(1, algots.Uint64(5))
    algots.assert(algots.op.Scratch.loadUint64(1) === algots.Uint64(5))
    return true
  }
}

// In your test
const contract = ctx.contract.create(MyContract)
const result = contract.approvalProgram()

expect(result).toBe(true)
const scratchSpace = ctx.txn.lastGroup.getScratchSpace()
expect(scratchSpace[1]).toEqual(5)
```

For more detailed information, explore the example contracts in the `examples/` directory, the [coverage](./coverage.md) page, and the [API documentation](../modules/index.html).

```ts
// Test cleanup
ctx.reset()
```
