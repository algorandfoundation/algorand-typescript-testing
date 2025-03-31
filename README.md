# Algorand TypeScript Testing

[![docs-repository](https://img.shields.io/badge/url-repository-74dfdc?logo=github&style=flat.svg)](https://github.com/algorandfoundation/algorand-typescript-testing/)
[![learn-AlgoKit](https://img.shields.io/badge/learn-AlgoKit-74dfdc?logo=algorand&mac=flat.svg)](https://developer.algorand.org/algokit/)
[![github-stars](https://img.shields.io/github/stars/algorandfoundation/algorand-typescript-testing?color=74dfdc&logo=star&style=flat)](https://github.com/algorandfoundation/algorand-typescript-testing)
[![visitor-badge](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Falgorandfoundation%2Falgorand-typescript-testing&countColor=%2374dfdc&style=flat)](https://github.com/algorandfoundation/algorand-typescript-testing/)

`algorand-typescript-testing` is a companion package to [Algorand Typescript](https://github.com/algorandfoundation/puya-ts/tree/main/packages/algo-ts) that enables efficient unit testing of Algorand TypeScript smart contracts in an offline environment. This package emulates key AVM behaviors without requiring a network connection, offering fast and reliable testing capabilities with a familiar TypeScript interface.

The `algorand-typescript-testing` package provides:

- A simple interface for fast and reliable unit testing
- An offline testing environment that simulates core AVM functionality
- A familiar TypeScript experience, compatible with testing frameworks like [vitest](https://vitest.dev/), and [jest](https://jestjs.io/)

## Quick Start

`algorand-typescript` is a prerequisite for `algorand-typescript-testing`, providing stubs and type annotations for Algorand TypeScript syntax. It enhances code completion and type checking when writing smart contracts. Note that this code isn't directly executable in standard Node.js environment; it's compiled by `puya-ts` into TEAL for Algorand Network deployment.

Traditionally, testing Algorand smart contracts involved deployment on sandboxed networks and interacting with live instances. While robust, this approach can be inefficient and lacks versatility for testing Algorand TypeScript code.

Enter `algorand-typescript-testing`: it leverages TypeScript's rich testing ecosystem for unit testing without network deployment. This enables rapid iteration and granular logic testing.

> **NOTE**: While `algorand-typescript-testing` offers valuable unit testing capabilities, it's not a replacement for comprehensive testing. Use it alongside other test types, particularly those running against the actual Algorand Network, for thorough contract validation.

### Prerequisites

- Python 3.12 or later
- [Algorand Python](https://github.com/algorandfoundation/puya)
- Node.js 20.x or later
- [Algorand TypeScript](https://github.com/algorandfoundation/puya-ts)

### Installation

`algorand-typescript-testing` is distributed via [npm](https://www.npmjs.com/package/@algorandfoundation/algorand-typescript-testing/). Install the package using `npm`:

```bash
npm i @algorandfoundation/algorand-typescript-testing
```

### Testing your first contract

Let's write a simple contract and test it using the `algorand-typescript-testing` framework.

#### Configuring vitest

If you are using [vitest](https://vitest.dev/) with [@rollup/plugin-typescript](https://www.npmjs.com/package/@rollup/plugin-typescript) plugin, configure `puyaTsTransformer` as a `before` stage transformer of the `typescript` plugin in `vitest.config.mts` file.

```typescript
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'vitest/config'
import { puyaTsTransformer } from '@algorandfoundation/algorand-typescript-testing/vitest-transformer'

export default defineConfig({
  esbuild: {},
  test: {
    setupFiles: 'vitest.setup.ts',
  },
  plugins: [
    typescript({
      transformers: {
        before: [puyaTsTransformer],
      },
    }),
  ],
})
```

`algorand-typescript-testing` package also exposes additional equality testers which enables the smart contract developers to write terser test by avoiding type casting in assertions. It can setup in `beforeAll` hook point in the setup file, `vitest.setup.ts`.

```typescript
import { beforeAll, expect } from 'vitest'
import { addEqualityTesters } from '@algorandfoundation/algorand-typescript-testing'

beforeAll(() => {
  addEqualityTesters({ expect })
})
```

#### Configuring jest

If you are using [jest](https://jestjs.io/) with [ts-jest](https://www.npmjs.com/package/ts-jest), [@jest/globals](https://www.npmjs.com/package/@jest/globals) and [ts-node](https://www.npmjs.com/package/ts-node) plugins, configure `puyaTsTransformer` as a `before` stage transformer of the `typescript` plugin in `jest.config.ts` file.

```typescript
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({})
const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        astTransformers: {
          before: ['node_modules/@algorandfoundation/algorand-typescript-testing/test-transformer/jest-transformer.mjs'],
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
}
export default jestConfig
```

`algorand-typescript-testing` package also exposes additional equality testers which enables the smart contract developers to write terser test by avoiding type casting in assertions. It can setup in `beforeAll` hook point in the setup file, `jest.setup.ts`.

```typescript
import { beforeAll, expect } from '@jest/globals'
import { addEqualityTesters } from '@algorandfoundation/algorand-typescript-testing'

beforeAll(() => {
  addEqualityTesters({ expect })
})
```

You'll also need to run `jest` with the `--experimental-vm-modules` and `--experimental-require-module` flags in the `package.json`. This requires node 20.17 or greater.

```json
{
  "name": "puya-ts-demo",
  "scripts": {
    "test:jest": "tsc && node --experimental-vm-modules --experimental-require-module node_modules/jest/bin/jest"
  },
  "engines": {
    "node": ">=20.17"
  }
}
```

There is also a patch file `ts-jest+29.2.5.patch` that needs to be applied to `ts-jest` package to for the `puyaTsTransformer` to work with the test files.

1. Place the file in `<rootDir>\patches` folder.
1. Install [patch-package](https://www.npmjs.com/package/patch-package) package as a dev dependency.
1. Add `"postinstall": "patch-package",` script in `package.json` file.
   The patch will then be applied with every `npm install` call.

```patch
diff --git a/node_modules/ts-jest/dist/legacy/compiler/ts-compiler.js b/node_modules/ts-jest/dist/legacy/compiler/ts-compiler.js
index 5198f8f..addb47c 100644
--- a/node_modules/ts-jest/dist/legacy/compiler/ts-compiler.js
+++ b/node_modules/ts-jest/dist/legacy/compiler/ts-compiler.js
@@ -234,7 +234,7 @@ var TsCompiler = /** @class */ (function () {
         var _a;
         // Initialize memory cache for typescript compiler
         this._parsedTsConfig.fileNames
-            .filter(function (fileName) { return constants_1.TS_TSX_REGEX.test(fileName) && !_this.configSet.isTestFile(fileName); })
+            .filter(function (fileName) { return constants_1.TS_TSX_REGEX.test(fileName); })
             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
             .forEach(function (fileName) { return _this._fileVersionCache.set(fileName, 0); });
         /* istanbul ignore next */

```

After the setup, the examples provided using `vitest` can be converted to work with `jest` by simply swapping the `import {...} from 'vitest'` with `import {...} from '@jest/globals'`.

#### Contract Definition

```typescript
import { arc4, assert, Bytes, GlobalState, gtxn, LocalState, op, Txn, uint64, Uint64 } from '@algorandfoundation/algorand-typescript'

export default class VotingContract extends arc4.Contract {
  topic = GlobalState({ initialValue: 'default_topic', key: Bytes('topic') })
  votes = GlobalState({ initialValue: Uint64(0), key: Bytes('votes') })
  voted = LocalState<uint64>({ key: Bytes('voted') })

  @arc4.abimethod()
  public setTopic(topic: string): void {
    this.topic.value = topic
  }
  @arc4.abimethod()
  public vote(pay: gtxn.PaymentTxn): boolean {
    assert(op.Global.groupSize === 2, 'Expected 2 transactions')
    assert(pay.amount === 10_000, 'Incorrect payment amount')
    assert(pay.sender === Txn.sender, 'Payment sender must match transaction sender')

    if (this.voted(Txn.sender).hasValue) {
      return false // Already voted
    }

    this.votes.value = this.votes.value + 1
    this.voted(Txn.sender).value = 1
    return true
  }

  @arc4.abimethod({ readonly: true })
  public getVotes(): uint64 {
    return this.votes.value
  }

  public clearStateProgram(): boolean {
    return true
  }
}
```

#### Test Definition

```typescript
import { Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, test } from 'vitest'
import VotingContract from './contract.algo'

describe('Voting contract', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  test('vote function', () => {
    // Initialize the contract within the testing context
    const contract = ctx.contract.create(VotingContract)

    const voter = ctx.defaultSender
    const payment = ctx.any.txn.payment({
      sender: voter,
      amount: 10_000,
    })

    const result = contract.vote(payment)
    expect(result).toEqual(true)
    expect(contract.votes.value).toEqual(1)
    expect(contract.voted(voter).value).toEqual(1)
  })

  test('setTopic function', () => {
    // Initialize the contract within the testing context
    const contract = ctx.contract.create(VotingContract)

    const newTopic = ctx.any.string(10)
    contract.setTopic(newTopic)
    expect(contract.topic.value).toEqual(newTopic)
  })

  test('getVotes function', () => {
    // Initialize the contract within the testing context
    const contract = ctx.contract.create(VotingContract)

    contract.votes.value = 5
    const votes = contract.getVotes()
    expect(votes).toEqual(5)
  })
})
```

This example demonstrates key aspects of testing with `algorand-typescript-testing` for ARC4-based contracts:

1. ARC4 Contract Features:

   - Use of `arc4.Contract` as the base class for the contract.
   - ABI methods defined using the `@arc4.abimethod` decorator.
   - Readonly method annotation with `@arc4.abimethod({readonly: true})`.

2. Testing ARC4 Contracts:

   - Creation of an `arc4.Contract` instance within the test context.
   - Use of `ctx.any` for generating random test data.
   - Direct invocation of ABI methods on the contract instance.

3. Transaction Handling:

   - Use of `ctx.any.txn` to create test transactions.
   - Passing transaction objects as parameters to contract methods.

4. State Verification:
   - Checking global and local state changes after method execution.
   - Verifying return values from ABI methods.

> **NOTE**: Thorough testing is crucial in smart contract development due to their immutable nature post-deployment. Comprehensive unit and integration tests ensure contract validity and reliability. Optimizing for efficiency can significantly improve user experience by reducing transaction fees and simplifying interactions. Investing in robust testing and optimization practices is crucial and offers many benefits in the long run.

### Next steps

To dig deeper into the capabilities of `algorand-typescript-testing`, continue with the following sections.

#### Contents

- [Testing Guide](./docs/testing-guide/index.md)
- [Examples](./docs/examples.md)
- [Coverage](./docs/coverage.md)
- [FQA](./docs/faq.md)
- [API Reference](./docs/api.md)
- [Algorand TypeScript](./docs/algots.md)
