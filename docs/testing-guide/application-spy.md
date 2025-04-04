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
// callbacks for multiple methods with same method selector are kept in an array
// and all callbacks are invoked when any one of those methods is called.
// in those cases, you can check for `itxnContext.approvalProgram` or `itxnContext.appId`
// to see if the callback needs to handle a particular method call.
// e.g.
// ```
// if (itxnContext.approvalProgram === helloApp.approvalProgram) {
//   itxnContext.createdApp = helloApp
// }
// ```
// `itxnContext` is provided as a parameter to the callback method and
// it allows reading and setting of all properties of `itxn.ApplicationCallFields` interface
// which are used to construct `itxn.ApplicationCall` transaction when `.submit()` is called.
// it also maps `appArgs` to `args` property and provides consistent access to parameters passed
// to the contract method.
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
// the literal string keyword 'bareCreate' is used instead of a method signature
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

Mock result can be setup for the snippet above as

````ts
// `itxnContext.returnValue` is added as the last entry to the logs of the constructed `itxn.ApplicationCall`
// so that it can be access via `txn.lastLog` property.
// it is available as `.retrunValue` when using strongly typed method call approach.
// `returnValue` should only be set as the last statement of the callback and
// especially no further manipulations of logs should take place afterwards.
// `appArgs` without the first value (which is the method selector) is available as `itxnContext.args`.
// since it is encoded as `bytes`, it needs to be decoded to get back the string value.
// you can check `itxnContext.appId` if there are multiple callback registered for the same method selector
// e.g.
// ```
// if (itxnContext.appId === helloApp) {
//   itxnContext.returnValue = `hello ${decodeArc4<Str>(itxnContext.args[0])}`
// }
// ```
spy.on.greet((itxnContext) => {
  itxnContext.returnValue = `hello ${decodeArc4<Str>(itxnContext.args[0])}`
})
````

**2. Strongly typed contract method call**

```ts
const result = compiled.call.greet({
  args: ['world'],
  appId: app,
}).returnValue
assert(result === 'hello world')
```

Mock result can be setup for the snippet above as

```ts
// the setup is the same as in `itxn.applicationCall`, except the `itxnContext.args` contains
// the values passed in `args` array in their original format with being encoded into bytes.
spy.on.greet((itxnContext) => {
  itxnContext.returnValue = `hello ${itxnContext.args[0]}`
})
```

**3. Strongly typed ABI calls**

```
const result = abiCall(Hello.prototype.greet, {
  appId: app,
  args: ['abi'],
}).returnValue
```

Mock result can be setup for the snippet above as

```ts
// the setup is the same as the previous case
spy.on.greet((itxnContext) => {
  itxnContext.returnValue = `hello ${itxnContext.args[0]}`
})
```

### Key Features

1. **Type-safe Method Mocking**

   ```ts
   spy.on.increment((itxnContext) => {
     // itxnContext.args is properly typed based on method signature
     itxnContext.returnValue = 1n // Type checked against method return type
   })
   ```

2. **Creation Handling**

   ```ts
   spy.on.create((itxnContext) => {
     // Handle contract creation
     itxnContext.createdApp = counterApp
   })
   ```

3. **Multiple Contract Support**

   ```ts
   // Create spies for different contracts
   const counterSpy = new ApplicationSpy(Counter)
   const vaultSpy = new ApplicationSpy(Vault)

   ctx.addApplicationSpy(counterSpy)
   ctx.addApplicationSpy(vaultSpy)
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
       itxnContext.returnValue = 1n
     }
   })
   ```

3. **Handle Method Arguments**
   ```ts
   spy.on.setValue((itxnContext) => {
     //`itxnContext.args` could be encoded as bytes if `itxn.applicationCall` is used to make the call
     itxnContext.returnValue = `hello ${decodeArc4<Str>(itxnContext.args[0])}`
   })
   ```
