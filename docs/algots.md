---
title: Algorand TypeScript
---

# Algorand TypeScript

Algorand TypeScript is a partial implementation of the TypeScript programming language that runs on the Algorand Virtual Machine (AVM). It includes a statically typed framework for developing Algorand smart contracts and logic signatures, and provides TypeScript interfaces to underlying AVM functionality that work with standard TypeScript tooling.

It preserves the syntax and semantics of TypeScript so that a developer who knows TypeScript can make safe assumptions about the behaviour of the compiled code when running on the AVM. Algorand TypeScript is also executable TypeScript that can be run and debugged on Node.js after transpilation to ECMAScript and run from automated tests.

Algorand TypeScript is compiled for execution on the AVM by PuyaTs, a TypeScript frontend for the [Puya](https://github.com/algorandfoundation/puya) optimising compiler. PuyaTs ensures the resulting AVM bytecode has execution semantics that match the given TypeScript code, and it produces output that is directly compatible with AlgoKit typed clients to simplify deployment and invocation.

[Documentation](https://algorandfoundation.github.io/puya-ts/index.html)
