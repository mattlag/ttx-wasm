# Contributing to TTX-WASM

We welcome contributions to TTX-WASM! This document provides guidelines for contributing to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Getting Started

### Prerequisites
- Node.js 16 or later
- Git
- Emscripten SDK (for WASM compilation)
- Basic knowledge of C++, JavaScript/TypeScript, and WebAssembly

### Project Structure
```
ttx-wasm/
├── src/
│   ├── wasm/          # C++ source code for WASM
│   ├── js/            # JavaScript/TypeScript bindings
│   └── python/        # Python reference implementation
├── tests/             # Test files
├── examples/          # Usage examples
├── docs/              # Documentation
├── build/             # Build scripts and configuration
└── dist/              # Compiled output (generated)
```

## Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/ttx-wasm.git
   cd ttx-wasm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Emscripten SDK:**
   ```bash
   # Download and install Emscripten
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh  # On Windows: emsdk_env.bat
   cd ..
   ```

4. **Verify setup:**
   ```bash
   # Check Emscripten installation
   cd build && make check-emscripten
   
   # Run tests to ensure everything works
   npm test
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

## Contributing Process

### 1. Choose an Issue
- Look for issues labeled `good first issue` for beginners
- Check the project roadmap for priority items
- For new features, create an issue first to discuss the approach

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Changes
- Write clean, well-documented code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Test the build
npm run build
```

### 5. Commit and Push
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

### 6. Create Pull Request
- Create a pull request from your branch to `main`
- Fill out the PR template completely
- Link any related issues
- Wait for review and address feedback

## Code Guidelines

### JavaScript/TypeScript
- Use TypeScript for new code
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer async/await over promises
- Use modern ES6+ features

**Example:**
```typescript
/**
 * Converts a font file to TTX XML format
 * @param data - Font file data as Uint8Array
 * @param options - Conversion options
 * @returns Promise resolving to TTX result
 */
async function dumpToTTX(data: Uint8Array, options: TTXOptions = {}): Promise<TTXResult> {
  // Implementation
}
```

### C++
- Use C++17 features
- Follow Google C++ Style Guide
- Use meaningful variable and function names
- Add comments for complex algorithms
- Use RAII for resource management
- Prefer standard library over custom implementations

**Example:**
```cpp
/**
 * Parses the font table directory from binary data
 * @param data Font file data
 * @param offset Offset to table directory
 * @return true if parsing succeeded, false otherwise
 */
bool FontReader::parseTableDirectory(const ByteArray& data, size_t offset) {
    // Implementation
}
```

### Python (Reference Implementation)
- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Use meaningful variable names

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

**Examples:**
```
feat: add WOFF2 decompression support
fix: handle malformed font tables gracefully
docs: update API documentation for new options
test: add integration tests for TTC files
```

## Testing

### Unit Tests
- Write unit tests for all new functions
- Use Jest for JavaScript/TypeScript tests
- Mock external dependencies
- Aim for high code coverage

### Integration Tests
- Test complete workflows (font → TTX → font)
- Use real font files for testing
- Test edge cases and error conditions

### WASM Tests
- Test C++ functionality independently
- Test JavaScript ↔ WASM communication
- Verify memory management

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Documentation

### API Documentation
- Document all public APIs with JSDoc/TSDoc
- Include parameter types and return values
- Provide usage examples
- Keep documentation in sync with code

### README Updates
- Update README.md for new features
- Add examples for new functionality
- Update feature support matrix

### Code Comments
- Comment complex algorithms
- Explain non-obvious design decisions
- Document performance considerations
- Use TODO comments for future improvements

## Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Build and verify distribution files
5. Create release tag
6. Publish to npm
7. Create GitHub release

## Issue Guidelines

### Bug Reports
Please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Font files that cause the issue (if possible)
- Browser/Node.js version
- Error messages or console output

### Feature Requests
Please include:
- Clear description of the feature
- Use cases and motivation
- Proposed API (if applicable)
- Examples of how it would be used

### Labels
We use the following labels:
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `documentation` - Improvements to documentation
- `wasm` - Related to WebAssembly code
- `javascript` - Related to JavaScript bindings
- `performance` - Performance improvements

## Community Guidelines

### Code of Conduct
This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

### Communication
- Be respectful and constructive
- Ask questions if anything is unclear
- Help others when you can
- Share knowledge and best practices

### Getting Help
- Check existing issues and documentation first
- Ask questions in GitHub Discussions
- Join our community chat (if available)
- Reach out to maintainers for complex issues

## Recognition

Contributors will be:
- Listed in the project's CONTRIBUTORS.md file
- Mentioned in release notes for significant contributions
- Given credit in the project documentation

Thank you for contributing to TTX-WASM! 🎉
