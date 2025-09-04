---
title: Application Spy
---

# ApplicationSpy

The `ApplicationSpy` class provides a way to mock making method calls for from within contracts. This is particularly useful when testing contracts that deploy and interact with other contracts in a type safe manner. It can be used with all the approaches for making method calls supported by `algorand-typescript`.

## Using ApplicationSpy

### Deploying other contracts with explict create method

**1. `itxn.applicationCall`**

```ts
const compiled = compile(Hello)
const helloApp = itxn
  .applicationCall({
    appArgs: [methodSelector(Hello.prototype.create), encodeArc4('hello')],
    approvalProgram: compiled.approvalProgram,
    clearStateProgram: compiled.clearStateProgram,
    globalNumBytes: 1,
  })
  .submit().createdApp
```

**2. Strongly typed create method call**

```ts
const compiled = compileArc4(Hello)
const app = compiled.call.create({
  args: ['hello'],
}).itxn.createdApp
```

Mock result can be setup for both of the snippets above as

````ts
// create an application and register it with test execution context.
// pass `{ approvalProgram: ctx.any.bytes() }` parameter to distinguish
// the contract being deployed if the test involves multiple contracts
// with the same method selector for the create method.
const helloApp = ctx.any.application()

// set to return helloApp when `compile(Hello)`
ctx.setCompiledApp(Hello, helloApp.id)

// create a new spy for `Hello` contract
const spy = new ApplicationSpy(Hello)

// register a callback for the method of the contract.
// the callback is registered against the method selector.
// all callbacks for multiple methods with same method selector are invoked
// when any one of those methods is called.
// in those cases, you can check for `itxnContext.approvalProgram` or `itxnContext.appId`
// to see if the callback needs to handle a particular method call.
// e.g.
// ```
// if (itxnContext.approvalProgram === helloApp.approvalProgram) {
//   itxnContext.createdApp = helloApp
// }
// ```
// `itxnContext` is provided as a parameter to the callback method and
// it allows reading and setting of the properties of `itxn.ApplicationCallInnerTxn` interface.
// it also maps and encodes the arugments to `appArgs` collection as bytes values,
// and provides consistent access those arguments.
spy.on.create((itxnContext) => {
  itxnContext.createdApp = helloApp
})
````

### Deploying other contracts without explicit create method

**1. `itxn.applicationCall`**

```ts
const compiled = compile(Hello)
const helloApp = itxn
  .applicationCall({
    approvalProgram: compiled.approvalProgram,
    clearStateProgram: compiled.clearStateProgram,
    extraProgramPages: compiled.extraProgramPages,
    globalNumBytes: compiled.globalBytes,
  })
  .submit().createdApp
```

**2. Strongly typed bare create method call**

```ts
const compiled = compileArc4(Hello)
const appId = compiled.bareCreate().createdApp
```

Mock result can be setup for both of the snippets above as

```ts
const helloApp = ctx.any.application()
ctx.setCompiledApp(Hello, helloApp.id)

const spy = new ApplicationSpy(Hello)

// the mock setup is the same as using explicit create method except
// `onBareCall` method is used instead of `on.{methodName}` or `onAbiCall` methods
// to register the callback
spy.onBareCall((itxnContext) => {
  itxnContext.createdApp = helloApp
})
```

### 2. Calling contract methods

**1. `itxn.applicationCall`**

```ts
const txn = itxn
  .applicationCall({
    appArgs: [methodSelector(Hello.prototype.greet), encodeArc4('world')],
    appId: helloApp,
  })
  .submit()
const result = decodeArc4<string>(txn.lastLog, 'log')
```

**2. Strongly typed contract method call**

```ts
const result = compiled.call.greet({
  args: ['world'],
  appId: app,
}).returnValue
assert(result === 'hello world')
```

Mock result can be setup for both snippets above as

````ts
// `itxnContext.setReturnValue` is added as the last entry to the logs of the constructed `itxn.ApplicationCall`
// so that it can be access via `txn.lastLog` property.
// `setReturnValue` should only be called as the last statement of the callback and
// especially no further manipulations of logs should take place afterwards.
// `appArgs` collection holds method selector and method arguments encoded as `bytes` values.
// They need to be decoded if the orginal argument values are needed.
// you can check `itxnContext.appId` if there are multiple callback registered for the same method selector
// e.g.
// ```
// if (itxnContext.appId === helloApp) {
//   itxnContext.returnValue = `hello ${decodeArc4<string>(itxnContext.appArgs(0))}`
// }
// ```
spy.on.greet((itxnContext) => {
  itxnContext.returnValue = `hello ${decodeArc4<string>(itxnContext.appArgs(0))}`
})
````

You can also use the alternative approach below to setup the mock result. It is especially useful if you do not have `Contract` subclass available and only method signature and application id are availbe to make the method call.

```ts
// create a spy without the contract type provided
const spy = new ApplicationSpy()

spy.onAbiCall(methodSelector('greet(string)string'), (itxnContext) => {
  // check for a well-known appId or the appId provided to the contract under test in some other manner
  if (itxnContext.appId === appId) {
    itxnContext.setReturnValue(`hey ${decodeArc4<string>(itxnContext.appArgs(1))}`)
  }
})
```

**3. Strongly typed ABI calls**

```ts
const result = abiCall<typeof Hello.prototype.greet>({
  appId: app,
  args: ['abi'],
}).returnValue
```

Mock result can be setup for the snippet above as

```ts
// the setup is the same as the previous case
spy.on.greet((itxnContext) => {
  itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(0))}`)
})
```

### Best Practices

1. **Reset Between Tests**

   ```ts
   afterEach(() => {
     ctx.reset() // Clears all spies
   })
   ```

2. **Validate App IDs or approvalProgram**

   ```ts
   spy.on.increment((itxnContext) => {
     // Only handle calls to specific app instance
     if (itxnContext.appId === counterApp) {
       itxnContext.setReturnValue(1n)
     }
   })
   ```

3. **Handle Method Arguments**
   ```ts
   spy.on.setValue((itxnContext) => {
     // arguments provided to the method are encoded as bytes values
     // and available via `itxnContext.appArgs` method
     itxnContext.setReturnValue(`hello ${decodeArc4<string>(itxnContext.appArgs(0))}`)
   })
   ```
