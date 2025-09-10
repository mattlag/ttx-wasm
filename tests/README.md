# Tests

This directory contains all test files and test-related assets for TTX-WASM.

## Structure

- **`unit/`** - Unit test files (`.test.ts`)
- **`fixtures/`** - Test fixtures and reference files (`.ttx` files, etc.)
- **`sample fonts/`** - Font files used for testing (`.ttf`, `.otf`, `.woff`,
  etc.)

## Running Tests

```bash
npm test          # Run all tests
npm run test:coverage  # Run tests with coverage (if configured)
```

## Test Configuration

Tests use Jest with TypeScript support configured in:

- `jest.config.js` - Main Jest configuration
- `tsconfig.test.json` - TypeScript configuration for tests only

## Test Types

- **Node.js Tests**: Basic functionality that can run in Node.js environment
- **Browser Tests**: Tests that require Pyodide/WebAssembly (skipped in Node.js)
- **Integration Tests**: End-to-end testing of TTX conversion workflows
- **Font Validation Tests**: Testing various font format handling

Most tests currently skip Pyodide functionality when running in Node.js and
require a browser environment for full testing.
