# TTX-WASM Standalone Distribution

This document describes the implementation of standalone (offline) distribution
files for TTX-WASM.

## Problem Solved

Previously, the TTX-WASM distribution files required an internet connection to
download Pyodide from the CDN at
`https://cdn.jsdelivr.net/pyodide/v0.28.2/full/`. This made the library
unsuitable for:

- Offline applications
- Air-gapped environments
- Self-hosted deployments
- Applications with strict network requirements

## Solution Implemented

### 1. Local Pyodide Bundling

- **Added pyodide npm package**: Installed the official pyodide package to get
  local Pyodide files
- **Modified build configuration**: Updated `rollup.config.js` to copy essential
  Pyodide files to `dist/pyodide/`
- **Updated source code**: Changed `src/js/pyodide-ttx.ts` to use local path
  `./pyodide/` instead of CDN URL

### 2. Python Wheel Dependencies

To achieve fully offline functionality, the following Python wheel files are
bundled in the distribution:

- **micropip-0.10.1-py3-none-any.whl** - Python package installer for Pyodide
- **fonttools-4.56.0-py3-none-any.whl** - Font manipulation library (core
  dependency)
- **brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl** - Compression library
  required by fonttools

These wheel files are stored in `build-assets/python-wheels/` and copied to the
distribution during the build process.

### 3. Files Included in Distribution

The following Pyodide files are now bundled with each distribution:

- `pyodide.asm.js` - JavaScript runtime
- `pyodide.asm.wasm` - WebAssembly runtime
- `pyodide.mjs` - ES module loader
- `pyodide-lock.json` - Package metadata
- `python_stdlib.zip` - Python standard library
- `micropip-0.10.1-py3-none-any.whl` - Python package installer
- `fonttools-4.56.0-py3-none-any.whl` - Font manipulation library
- `brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl` - Compression library

### 4. Build Process Changes

**rollup.config.js**:

```javascript
import copy from 'rollup-plugin-copy';

// Added copy plugin to bundle Pyodide files
copy({
  targets: [
    {
      src: [
        'node_modules/pyodide/pyodide.asm.js',
        'node_modules/pyodide/pyodide.asm.wasm',
        'node_modules/pyodide/pyodide.mjs',
        'node_modules/pyodide/pyodide-lock.json',
        'node_modules/pyodide/python_stdlib.zip',
      ],
      dest: 'dist/pyodide',
    },
    {
      src: [
        'build-assets/python-wheels/micropip-0.10.1-py3-none-any.whl',
        'build-assets/python-wheels/fonttools-4.56.0-py3-none-any.whl',
        'build-assets/python-wheels/brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl',
      ],
      dest: 'dist/pyodide',
    },
  ],
});
```

**package.json**:

```json
{
  "build:js": "rollup -c && powershell -Command \"Copy-Item dist/ttx-wasm.esm.js demo/\" && powershell -Command \"Copy-Item -Recurse dist/pyodide demo/ -Force\""
}
```

### 5. Source Code Changes

**src/js/pyodide-ttx.ts**:

```typescript
// Before
this.pyodide = await loadPyodide({
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
});

// After
this.pyodide = await loadPyodide({
  indexURL: './pyodide/', // Use local pyodide files
});
```

## Results

### ✅ What Works

- **Complete offline functionality**: Distribution files include all necessary
  Python packages for full offline operation
- **Self-contained demo**: Demo folder includes all necessary files for
  standalone operation
- **Maintained compatibility**: All existing APIs and functionality preserved
- **Smaller attack surface**: No external CDN dependencies reduce security
  concerns
- **Organized build assets**: Python wheels stored in
  `build-assets/python-wheels/` for maintainability

### ⚠️ File Size Impact

- **Core Pyodide files**: ~15MB
- **Python packages**: ~8MB (micropip, fonttools, brotli)
- **Python stdlib**: ~8MB
- **Total overhead**: ~31MB for complete offline functionality

### 📁 Distribution Structure

```
dist/
├── ttx-wasm.esm.js           # ES module bundle
├── ttx-wasm.cjs.js           # CommonJS bundle
├── ttx-wasm.umd.js           # UMD bundle
├── *.map                     # Source maps
└── pyodide/                  # Bundled Pyodide runtime + Python packages
    ├── pyodide.asm.js
    ├── pyodide.asm.wasm
    ├── pyodide.mjs
    ├── pyodide-lock.json
    ├── python_stdlib.zip
    ├── micropip-0.10.1-py3-none-any.whl
    ├── fonttools-4.56.0-py3-none-any.whl
    └── brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl
```

## Usage

### For Library Users

No changes required! The library automatically uses local Pyodide files when
available.

### For Self-Hosting

1. Copy the entire `dist/` folder to your web server
2. Ensure the `pyodide/` subfolder is served with proper MIME types:
   - `.wasm` files: `application/wasm`
   - `.js` files: `application/javascript`
   - `.json` files: `application/json`

### For NPM Users

The bundled files are included in the npm package, so offline functionality
works out of the box.

## Future Improvements

To further optimize the distribution:

1. **Minimize wheel sizes**: Use only essential parts of large packages
2. **Custom Pyodide build**: Create a minimal Pyodide build with only required
   packages
3. **Package compression**: Apply additional compression to wheel files
4. **Version management**: Automate wheel updates when dependencies change

## File Size Impact

- **Core Pyodide files**: ~15MB
- **Python packages**: ~8MB (micropip, fonttools, brotli)
- **Python stdlib**: ~8MB
- **Total overhead**: ~31MB for complete offline functionality

This is a reasonable trade-off for applications requiring complete offline
operation.
