# 🔶 ttx-wasm 🔶

The goal of this project is to extend FontTools TTX's reach beyond Python / Command Line to Web and Node environments.

**Note**: This is a vibe-coded project, it may not be suitable for critical workflows. If there 
are any issues or feedback, let us know over at GitHub issues.

## 🔶 Quick Start

### Browser Usage (WebAssembly)

```javascript
import { TTX } from 'ttx-wasm';

// Initialize (loads Pyodide + FontTools in WebAssembly)
await TTX.initialize();

// Convert font to TTX
const fontFile = await fetch('font.ttf').then(r => r.arrayBuffer());
const ttxContent = await TTX.dumpToTTX(new Uint8Array(fontFile));
```

### Node.js Usage (Native Python)

```javascript
import { TTX } from 'ttx-wasm';

// Initialize (uses native Python + FontTools)
await TTX.initialize({ pythonExecutable: 'python3' });

// Convert font to TTX
const fontData = await fs.readFile('font.ttf');
const ttxContent = await TTX.dumpToTTX(fontData);
```

## 🔶 Installation

### Browser Projects

```bash
npm install ttx-wasm
# No additional dependencies needed - includes WebAssembly runtime
```

### Node.js Projects

```bash
npm install ttx-wasm

# Install Python FontTools (one of these):
pip install fonttools
# or
pip3 install fonttools
# or
python -m pip install fonttools
```

## 🔶 Import Options

### Universal (Auto-detects Environment)

```javascript
import { TTX } from 'ttx-wasm';
// Automatically uses browser or Node.js backend
```

### Browser-Specific

```javascript
import { TTX } from 'ttx-wasm/browser';
// Forces browser/WebAssembly backend
```

### Node.js-Specific

```javascript
import { TTX } from 'ttx-wasm/node';
// Forces Node.js/Python backend
```

## 🔶 Benefits by Environment

### Browser Benefits

- ✅ **No server required** - Pure client-side processing
- ✅ **No Python installation** - WebAssembly handles everything
- ✅ **Secure** - Runs in browser sandbox
- ✅ **Offline capable** - Works without internet after initial load

### Node.js Benefits

- ✅ **Native performance** - Direct Python execution
- ✅ **Smaller package size** - No WebAssembly runtime
- ✅ **Better memory handling** - Native file operations
- ✅ **Full FontTools compatibility** - Uses official Python implementation


## 🔶 Configuration Options

```javascript
// Browser configuration
await TTX.initialize({
  pyodideIndexURL: './custom-pyodide-path/',
});

// Node.js configuration
await TTX.initialize({
  pythonExecutable: '/usr/local/bin/python3.11',
  tempDir: '/tmp/ttx-working',
});

// Check current environment
console.log('Runtime:', TTX.getRuntime()); // 'browser' | 'node' | 'worker'
```

## 🔶 API Reference

All methods work identically in both environments:

### Core Methods

- `TTX.initialize(config?)` - Initialize the TTX processor
- `TTX.isInitialized()` - Check if ready to use
- `TTX.detectFormat(fontData)` - Detect font format
- `TTX.getFontInfo(fontData)` - Get font metadata
- `TTX.dumpToTTX(fontData, options?)` - Convert font to TTX
- `TTX.compileFromTTX(ttxContent, options?)` - Convert TTX to font

### Advanced Methods

- `TTX.validateFont(fontData)` - Validate font structure
- `TTX.roundTripTest(fontData)` - Test conversion integrity
- `TTX.compareTTXContent(ttx1, ttx2)` - Compare TTX files

## 🔶 Development Setup

To build for both environments:

```bash
# Install dependencies
npm install

# Build all targets
npm run build:dual

# Test in both environments
npm run test:node
npm run test:browser
```

## 🔶 Bundle Sizes

| Environment | Bundle Size | Runtime Dependencies  |
| ----------- | ----------- | --------------------- |
| Browser     | ~7MB        | None (self-contained) |
| Node.js     | ~50KB       | Python + FontTools    |

## 🔶 Which Version Should I Use?

| Use Case            | Recommendation                                     |
| ------------------- | -------------------------------------------------- |
| **Web apps/sites**  | Browser version - No server setup needed           |
| **Node.js tools**   | Node.js version - Better performance               |
| **Library authors** | Universal version - Works everywhere               |
| **Electron apps**   | Universal version - Flexibility for both processes |

## 🔶 Examples

Check out the [examples directory](./examples) for:

- Browser integration samples
- Node.js CLI tools
- Universal library usage
- Migration guides
