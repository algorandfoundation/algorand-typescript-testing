---
title: Algorand TypeScript Testing Guide
children:
  - ./tg-concepts.md
  - ./tg-avm-types.md
  - ./tg-arc4-types.md
  - ./tg-transactions.md
  - ./tg-contract-testing.md
  - ./tg-signature-testing.md
  - ./tg-state-management.md
  - ./tg-opcodes.md
---

# Testing Guide

The Algorand TypeScript Testing framework provides powerful tools for testing Algorand TypeScript smart contracts within a Node.js environment. This guide covers the main features and concepts of the framework, helping you write effective tests for your Algorand applications.

```
For all code examples in the _Testing Guide_ section, assume `context` is an instance of `TestExecutionContext` obtained using the initialising an instance of `TestExecutionContext` class. All subsequent code is executed within this context.
```

The Algorand TypeScript Testing framework streamlines unit testing of your Algorand TypeScript smart contracts by offering functionality to:

1. Simulate the Algorand Virtual Machine (AVM) environment
2. Create and manipulate test accounts, assets, applications, transactions, and ARC4 types
3. Test smart contract classes, including their states, variables, and methods
4. Verify logic signatures and subroutines
5. Manage global state, local state, scratch slots, and boxes in test contexts
6. Simulate transactions and transaction groups, including inner transactions
7. Verify opcode behavior

By using this framework, you can ensure your Algorand TypeScript smart contracts function correctly before deploying them to a live network.

Key features of the framework include:

- `TestExecutionContext`: The main entry point for testing, providing access to various testing utilities and simulated blockchain state
- AVM Type Simulation: Accurate representations of AVM types like `uint64` and `bytes`
- ARC4 Support: Tools for testing ARC4 contracts and methods, including struct definitions and ABI encoding/decoding
- Transaction Simulation: Ability to create and execute various transaction types
- State Management: Tools for managing and verifying global and local state changes
- Opcode Simulation: Implementations of AVM opcodes for accurate smart contract behavior testing

The framework is designed to work seamlessly with Algorand TypeScript smart contracts, allowing developers to write comprehensive unit tests that closely mimic the behavior of contracts on the Algorand blockchain.

## Table of Contents

- [Concepts](./tg-concepts.md)
- [AVM Types](./tg-avm-types.md)
- [ARC4 Types](./tg-arc4-types.md)
- [Transactions](./tg-transactions.md)
- [Smart Contract Testing](./tg-contract-testing.md)
- [Smart Signature Testing](./tg-signature-testing.md)
- [State Management](./tg-state-management.md)
- [AVM Opcodes](./tg-opcodes.md)
