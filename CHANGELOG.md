# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Core TTX-WASM library structure
- WebAssembly module for font processing
- JavaScript/TypeScript API bindings
- Support for TTF, OTF, WOFF, WOFF2, and TTC formats
- Browser and Node.js compatibility
- Comprehensive test suite
- Build system with Emscripten
- Documentation and examples
- CI/CD pipeline with GitHub Actions

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

## [1.0.0] - TBD

### Added
- Initial release of TTX-WASM
- Core font table parsing functionality
- TTX XML generation and parsing
- Font information extraction
- Support for major font formats
- WebAssembly-based font processing
- Cross-platform compatibility (Browser + Node.js)
- TypeScript definitions
- Comprehensive API documentation
- Example implementations
- Test coverage

### Features
- **Font Format Support**: TTF, OTF, WOFF, WOFF2, TTC
- **Core Operations**:
  - Font to TTX XML conversion
  - TTX XML to font compilation
  - Font metadata extraction
  - Table listing and inspection
  - Format detection
- **Performance**: WebAssembly-powered processing
- **Compatibility**: Works in browsers and Node.js
- **Developer Experience**: Full TypeScript support, comprehensive docs

---

## Release Guidelines

### Version Types
- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

### Unreleased Section
Keep track of changes in the `[Unreleased]` section as they are made, then move them to a versioned section when releasing.
