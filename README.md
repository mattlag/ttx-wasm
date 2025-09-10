# TTX-WASM

**FontTools TTX in WebAssembly**

TTX-WASM brings the complete FontTools TTX functionality to the browser and
Node.js - either as a npm package, or just grab a pre-complied WASM module from
GitHub.

**A quick note** this project was 100% vibe coded, so you probably shouldn't
rely on this for important stuff. If something is broken, let me know over on
GitHub.

## 🚀 Quick Start

### Installation

```bash
npm install ttx-wasm
```

**Alternative: Use Pre-compiled Files**

For quick integration without npm, you can clone and use pre-compiled files:

```bash
# Clone the repository
git clone https://github.com/mattlag/ttx-wasm.git
cd ttx-wasm

# Use pre-compiled files directly (no build needed)
# Files available in dist/ folder
```

### Using Pre-compiled Files

For quick integration without a build process, you can use the pre-compiled
files directly from the `dist/` folder:

```html
<!-- ES Module (recommended) -->
<script type="module">
  import TTX from './dist/ttx-wasm.esm.js';
  // Your code here
</script>

<!-- CommonJS (Node.js) -->
<script>
  const TTX = require('./dist/ttx-wasm.cjs.js');
</script>

<!-- UMD (Universal) -->
<script src="./dist/ttx-wasm.umd.js"></script>
<script>
  // Available as global TTX object
  const ttx = TTX.default;
</script>
```

### Basic Usage

```javascript
import TTX from 'ttx-wasm';

// Initialize TTX (loads Pyodide and FontTools)
await TTX.initialize();

// Load font data
const fontData = new Uint8Array(fontFileBuffer);

// Detect font format
const format = await TTX.detectFormat(fontData);
console.log('Format:', format); // 'TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC'

// Get comprehensive font information
const info = await TTX.getFontInfo(fontData);
console.log('Family:', info.metadata.family);
console.log('Tables:', info.tables); // All 30+ table types

// Convert font to TTX XML (with full options support)
const ttxXML = await TTX.dumpToTTX(fontData, {
  tables: ['head', 'name', 'glyf'], // Specific tables
  disassembleInstructions: true, // TrueType instructions
  splitTables: false, // Keep in one file
});

// Convert TTX XML back to font binary
const fontBinary = await TTX.compileFromTTX(ttxXML, {
  flavor: 'woff2', // Output as WOFF2
});

// List all tables in font
const tables = await TTX.listTables(fontData);
console.log('Available tables:', tables);
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <title>TTX-WASM Demo</title>
  </head>
  <body>
    <input type="file" id="fontFile" accept=".ttf,.otf,.woff,.woff2" />
    <div id="output"></div>

    <script type="module">
      import TTX from './dist/ttx-wasm.esm.js';

      document
        .getElementById('fontFile')
        .addEventListener('change', async e => {
          const file = e.target.files[0];
          if (!file) return;

          // Initialize TTX (first time only)
          await TTX.initialize();

          // Process font
          const arrayBuffer = await file.arrayBuffer();
          const fontData = new Uint8Array(arrayBuffer);

          const info = await TTX.getFontInfo(fontData);
          const ttxContent = await TTX.dumpToTTX(fontData);

          document.getElementById('output').innerHTML = `
                <h3>Font: ${info.metadata.family}</h3>
                <p>Format: ${info.format} | Tables: ${info.tables.length}</p>
                <pre>${ttxContent.substring(0, 1000)}...</pre>
            `;
        });
    </script>
  </body>
</html>
```

## 🔧 Advanced Options

TTX-WASM supports all FontTools TTX options for maximum flexibility:

```javascript
// Advanced TTX conversion with all options
const ttxContent = await TTX.dumpToTTX(fontData, {
  tables: ['head', 'name', 'cmap', 'glyf'], // Include specific tables
  skipTables: ['DSIG', 'LTSH'], // Exclude specific tables
  splitTables: true, // Split into multiple files
  splitGlyphs: true, // Split glyph data
  disassembleInstructions: true, // Disassemble TT instructions
  fontNumber: 0, // For TTC collections
});

// Compile with output format options
const fontBinary = await TTX.compileFromTTX(ttxContent, {
  flavor: 'woff2', // Output as WOFF, WOFF2, etc.
});
```

## 🎮 Interactive Demo

Check out the live demo to see TTX-WASM in action. This demo lets you import a
font file, see and edit the XML, then re-save a font file with changes.

```bash
# Run locally
npm install
npm run build
npm run start:browser

# Open browser to http://localhost:8080/demo/
```

## 🧪 Testing

```bash
# Run tests (Node.js environment - tests are skipped but pass)
npm test

# For full browser testing, open the demo and check console
npm run start:browser
```

Note: Since Pyodide requires a browser environment, tests in Node.js are
gracefully skipped. Full functionality is demonstrated in the browser demo.

## 📚 API Reference

### TTX Class

#### `static async initialize(): Promise<void>`

Initialize TTX processor (loads Pyodide and FontTools). Call once before other
operations.

#### `static isInitialized(): boolean`

Check if TTX is ready to use.

#### `static async detectFormat(fontData: Uint8Array): Promise<string>`

Detect font format. Returns: 'TTF', 'OTF', 'TTC', 'WOFF', 'WOFF2', 'TTX', or
'UNKNOWN'.

#### `static async getFontInfo(fontData: Uint8Array, fontNumber?: number): Promise<FontInfo>`

Get comprehensive font information including metadata and table list.

#### `static async dumpToTTX(fontData: Uint8Array, options?: TTXOptions): Promise<string>`

Convert font binary to TTX XML format with full FontTools options support.

#### `static async compileFromTTX(ttxContent: string, options?: TTXOptions): Promise<Uint8Array>`

Compile TTX XML back to font binary format.

#### `static async listTables(fontData: Uint8Array, fontNumber?: number): Promise<string[]>`

List all tables present in the font.

### Interfaces

```typescript
interface TTXOptions {
  tables?: string[]; // Include specific tables
  skipTables?: string[]; // Exclude specific tables
  splitTables?: boolean; // Split into multiple files
  splitGlyphs?: boolean; // Split glyph data
  disassembleInstructions?: boolean; // Disassemble TT instructions
  fontNumber?: number; // Font index for TTC files
  flavor?: string; // Output flavor (woff, woff2, etc.)
}

interface FontInfo {
  format: string;
  tables: string[];
  metadata: {
    family?: string;
    style?: string;
    version?: string;
    unitsPerEm?: number;
    created?: string;
    modified?: string;
  };
}
```

## 📦 Package Contents

```
ttx-wasm/
├── dist/
│   ├── ttx-wasm.esm.js     # ES Module bundle
│   ├── ttx-wasm.cjs.js     # CommonJS bundle
│   └── ttx-wasm.umd.js     # UMD bundle
├── demo/
│   ├── index.html          # Interactive demo
│   └── pyodide-demo.js     # Usage demo
└── src/
    ├── js/
    │   ├── index.ts         # Main API
    │   └── pyodide-ttx.ts   # Pyodide integration
    └── python/
        └── ttx_reference.py # Python FontTools reference
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

**Ready to process fonts with 100% FontTools compatibility?** 🚀

```bash
npm install ttx-wasm
```

[Interactive Demo](demo/) | [API Docs](#-api-reference) |
[GitHub](https://github.com/mattlag/ttx-wasm)
