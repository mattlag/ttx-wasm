# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-10

### Added

- Enhanced error handling for unsupported file types with user-friendly messages
- File size validation (warns about files >50MB and <100 bytes)
- File extension validation before processing
- Specific error messages for common font file issues:
  - Invalid font format detection
  - Corrupted file detection (checksum errors)
  - Missing font tables detection
- Better TTX/XML file validation
- Improved drop zone UI with disabled states during loading
- Visual feedback improvements with transparency effects

### Changed

- Improved status messages and error reporting
- Enhanced user experience with clearer file type support information
- Better organization of build assets (moved Python wheels to build-assets/)

### Fixed

- Resolved build warnings from Rollup configuration
- Fixed JavaScript initialization errors with proper DOM loading
- Corrected HTML structure and styling issues
- Improved project organization with centralized test structure

### Technical

- Added TypeScript declaration file generation
- Improved build process with proper external dependency handling
- Enhanced test coverage and organization
- Updated npm publishing configuration

## [1.0.2] - Previous Release

### Initial

- Basic TTX-WASM functionality
- Font to XML conversion
- XML to font compilation
- WebAssembly-based FontTools integration
