# Contributing to Algorand TypeScript Testing

Contributions are welcome. For new features, please open an issue to discuss first.

## Workflow

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary). User-facing changes should include at least one `fix:` or `feat:` commit for release notes. Other conventions like `docs:` or `test:` are optional but helpful.

## Local Development

To set up the project locally:

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/).

1. **Install Python 3.12+**.

1. **Install Puya**:

   ```sh
   pipx install puyapy --python 3.12.6
   ```

1. **Install AlgoKit CLI**: Follow the guide from [Algokit](https://github.com/algorandfoundation/algokit-cli?tab=readme-ov-file#install).

1. **Start localnet**:

   ```sh
   algokit localnet start
   # or `algokit localnet reset --update` to update localnet docker images
   ```

1. **Install npm dependencies**:

   ```sh
   npm install
   ```

1. **Run tests**:
   ```sh
   npm test
   ```

## Common Commands

Here are some common commands you will use with npm:

- **Generate API reference documentation** `npm run script:documentation`
- **Fix linting errors** `npm run lint:fix`
- **Build a distribution locally** `npm run build`
- **Compile all contracts used by tests for debugging** `npm run script:refresh-test-artifacts`
- **Compile all example contracts for debugging** `npm run script:compile-examples`
