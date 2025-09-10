# Build Assets

This directory contains files needed for the build process that are not part of
the main source code.

## python-wheels/

Contains Python wheel files (.whl) that are bundled with the standalone
distribution to enable fully offline operation of TTX-WASM.

### Files Included:

- **micropip-0.10.1-py3-none-any.whl** - Python package installer for Pyodide
- **fonttools-4.56.0-py3-none-any.whl** - Font manipulation library (core
  dependency)
- **brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl** - Compression library
  required by fonttools

### Purpose:

These wheels are copied to `dist/pyodide/` during the build process (via
`rollup.config.js`) to create a standalone distribution that doesn't require
internet access to download Python packages.

### Updating Wheels:

When updating Python dependencies:

1. Download the new .whl files to this directory
2. Update the filenames in `rollup.config.js`
3. Test the standalone distribution to ensure offline functionality

### Why Not node_modules?

These are Python packages (not Node.js packages) that need to be served as
static files alongside the Pyodide runtime for offline Python package
installation.
