# TTX-WASM

A WebAssembly port of FontTools TTX for JavaScript environments. Convert fonts
to/from XML format in browsers and Node.js with near-native performance.

## 🚀 Quick Start

### Using Pre-compiled WASM

The easiest way to use TTX-WASM is to download the pre-compiled WebAssembly
files from the [releases page](https://github.com/mattlag/ttx-wasm/releases):

**Required Files:**

- `ttx-wasm.js` - JavaScript wrapper and WASM loader
- `ttx-wasm.wasm` - Compiled WebAssembly module
- `ttx-wasm.esm.js` - ES module bundle (optional)

**Installation:**

```bash
npm install ttx-wasm
```

**Basic Usage:**

```javascript
import { createTTX } from 'ttx-wasm';

// Initialize TTX
const ttx = await createTTX();

// Detect font format
const fontData = new Uint8Array(fontFileBuffer);
const format = await ttx.detectFormat(fontData);
console.log('Font format:', format); // 'TTF', 'OTF', 'WOFF', etc.

// Convert font to TTX XML
const result = await ttx.dump(fontData);
console.log('TTX XML:', result.data);

// Convert TTX XML back to font
const compiled = await ttx.compile(result.data);
console.log('Font binary:', compiled.data);
```

**Browser Usage:**

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { createTTX } from './ttx-wasm.esm.js';

      async function convertFont() {
        const ttx = await createTTX();
        const fileInput = document.getElementById('fontFile');
        const file = fileInput.files[0];

        if (file) {
          const arrayBuffer = await file.arrayBuffer();
          const fontData = new Uint8Array(arrayBuffer);
          const result = await ttx.dump(fontData);

          // Display TTX XML
          document.getElementById('output').textContent = result.data;
        }
      }

      window.convertFont = convertFont;
    </script>
  </head>
  <body>
    <input type="file" id="fontFile" accept=".ttf,.otf,.woff,.woff2" />
    <button onclick="convertFont()">Convert to TTX</button>
    <pre id="output"></pre>
  </body>
</html>
```

## 📋 API Reference

### Core Functions

```typescript
// Create TTX instance
const ttx = await createTTX();

// Detect font format
await ttx.detectFormat(data: Uint8Array): Promise<string>

// Get font information
await ttx.getFontInfo(data: Uint8Array): Promise<FontInfo>

// Convert font to TTX XML
await ttx.dump(data: Uint8Array, options?: TTXOptions): Promise<TTXResult>

// Convert TTX XML to font
await ttx.compile(ttxData: string, options?: TTXOptions): Promise<TTXResult>

// List font tables
await ttx.listTables(data: Uint8Array): Promise<string[]>
```

### Convenience Functions

```typescript
// One-line conversions
const ttxXml = await fontToTTX(fontData, options);
const fontBinary = await ttxToFont(ttxXml, options);
```

## 🛠️ Development Setup

Want to build your own WASM modules or contribute to the project? Here's a brief
setup guide:

### Prerequisites

- Node.js 16+
- Git
- Emscripten SDK (for WASM compilation)

### Quick Setup

```bash
# 1. Clone and install
git clone https://github.com/mattlag/ttx-wasm.git
cd ttx-wasm
npm install

# 2. Install Emscripten (Windows)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
./emsdk_env.bat
cd ../ttx-wasm

# 3. Build everything
npm run build:full

# 4. Run tests
npm test

# 5. Test examples
node examples/node-example.js
```

### Build Commands

```bash
npm run build:wasm    # Compile C++ to WASM
npm run build:js      # Build JavaScript bundles
npm run build:full    # Build everything
npm run dev           # Development mode with watching
npm test              # Run test suite
npm run lint          # Code linting
```

### Project Structure

```
ttx-wasm/
├── src/
│   ├── wasm/          # C++ source code for WASM
│   ├── js/            # TypeScript API and bindings
│   └── python/        # Python reference implementation
├── build/             # Build scripts (Makefile, PowerShell)
├── dist/              # Compiled output (WASM + JS)
├── tests/             # Test suite
├── examples/          # Usage examples
└── docs/              # Documentation
```

For detailed development setup including Emscripten installation on different
platforms, see [EMSCRIPTEN_SETUP.md](EMSCRIPTEN_SETUP.md).

## 🎯 Features

### ✅ Currently Working

- Font format detection (TTF, OTF, WOFF, WOFF2, TTC)
- Basic font information extraction
- Mock implementations for testing
- Complete build system and WASM compilation
- TypeScript API with full type definitions
- Cross-platform development environment

### 🚧 In Development

- Real font table parsing
- TTX XML generation and parsing
- Font to XML conversion
- XML to font compilation
- Comprehensive error handling

### 📋 Supported Font Formats

- **TTF** - TrueType fonts
- **OTF** - OpenType fonts
- **WOFF** - Web Open Font Format
- **WOFF2** - Web Open Font Format 2.0
- **TTC** - TrueType Collections

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FontTools](https://github.com/fonttools/fonttools) - The original Python
  toolkit
- [Emscripten](https://emscripten.org/) - C++ to WebAssembly compilation
- The typography and web font communities
