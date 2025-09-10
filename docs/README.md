# TTX-WASM Documentation

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Options](#options)
- [Examples](#examples)
- [Font Format Support](#font-format-support)
- [Building from Source](#building-from-source)
- [Contributing](#contributing)

## Installation

```bash
npm install ttx-wasm
```

### Browser Usage

```html
<script type="module">
import { createTTX } from 'ttx-wasm';

const ttx = await createTTX();
// Use ttx for font operations
</script>
```

### Node.js Usage

```javascript
const { createTTX } = require('ttx-wasm');

async function main() {
  const ttx = await createTTX();
  // Use ttx for font operations
}
```

## Quick Start

### Convert Font to TTX

```javascript
import { fontToTTX } from 'ttx-wasm';

// Load font file
const fontBuffer = await fetch('font.ttf').then(r => r.arrayBuffer());
const fontData = new Uint8Array(fontBuffer);

// Convert to TTX
const ttxString = await fontToTTX(fontData);
console.log(ttxString); // XML representation of the font
```

### Convert TTX to Font

```javascript
import { ttxToFont } from 'ttx-wasm';

// Load TTX file
const ttxString = await fetch('font.ttx').then(r => r.text());

// Convert to font
const fontData = await ttxToFont(ttxString);
// fontData is a Uint8Array containing the binary font
```

### Detect Font Format

```javascript
import { createTTX } from 'ttx-wasm';

const ttx = await createTTX();
const format = await ttx.detectFormat(fontData);
console.log(format); // 'TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC', or 'TTX'
```

## API Reference

### TTX Class

#### `new TTX()`
Creates a new TTX instance.

#### `async init(): Promise<void>`
Initializes the WASM module. Must be called before using other methods.

#### `async detectFormat(data: Uint8Array): Promise<string>`
Detects the format of a font file.

**Parameters:**
- `data` - Font file data as Uint8Array

**Returns:** Font format string ('TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC', 'TTX')

#### `async getFontInfo(data: Uint8Array, options?: TTXOptions): Promise<FontInfo>`
Gets detailed information about a font file.

**Parameters:**
- `data` - Font file data as Uint8Array
- `options` - Optional conversion options

**Returns:** FontInfo object containing format, tables, and metadata

#### `async dump(data: Uint8Array, options?: TTXOptions): Promise<TTXResult>`
Converts a binary font file to TTX XML format.

**Parameters:**
- `data` - Font file data as Uint8Array
- `options` - Optional conversion options

**Returns:** TTXResult object containing the XML data and metadata

#### `async compile(data: string | Uint8Array, options?: TTXOptions): Promise<TTXResult>`
Converts a TTX XML file to binary font format.

**Parameters:**
- `data` - TTX XML data as string or Uint8Array
- `options` - Optional conversion options

**Returns:** TTXResult object containing the binary font data

#### `async listTables(data: Uint8Array, options?: TTXOptions): Promise<string[]>`
Lists all tables present in a font file.

**Parameters:**
- `data` - Font file data as Uint8Array
- `options` - Optional conversion options

**Returns:** Array of table names

### Convenience Functions

#### `async createTTX(): Promise<TTX>`
Creates and initializes a TTX instance.

#### `async fontToTTX(data: Uint8Array, options?: TTXOptions): Promise<string>`
Converts font data to TTX XML string.

#### `async ttxToFont(data: string | Uint8Array, options?: TTXOptions): Promise<Uint8Array>`
Converts TTX XML to binary font data.

## Options

### TTXOptions Interface

```typescript
interface TTXOptions {
  /** List of tables to include (if not specified, all tables are included) */
  onlyTables?: string[];
  
  /** List of tables to exclude */
  skipTables?: string[];
  
  /** Split tables into separate files */
  splitTables?: boolean;
  
  /** Split glyphs into separate files */
  splitGlyphs?: boolean;
  
  /** Disassemble TrueType instructions */
  disassembleInstructions?: boolean;
  
  /** Font number for TTC files (starting from 0) */
  fontNumber?: number;
  
  /** Ignore decompilation errors */
  ignoreDecompileErrors?: boolean;
  
  /** Recalculate glyph bounding boxes */
  recalcBBoxes?: boolean;
  
  /** Output format flavor (e.g., 'woff', 'woff2') */
  flavor?: string;
}
```

### Common Options

#### Table Selection
```javascript
// Include only specific tables
const options = {
  onlyTables: ['head', 'name', 'cmap']
};

// Exclude specific tables
const options = {
  skipTables: ['glyf', 'loca']
};
```

#### Font Compilation
```javascript
// Compile to WOFF format
const options = {
  flavor: 'woff',
  recalcBBoxes: true
};
```

#### TrueType Collections
```javascript
// Extract specific font from TTC
const options = {
  fontNumber: 1  // Second font in collection
};
```

## Examples

### Basic Font Conversion

```javascript
import { createTTX } from 'ttx-wasm';

async function convertFont(fontData) {
  const ttx = await createTTX();
  
  // Get font information
  const info = await ttx.getFontInfo(fontData);
  console.log(`Font: ${info.metadata.family} ${info.metadata.style}`);
  console.log(`Format: ${info.format}`);
  console.log(`Tables: ${info.tables.join(', ')}`);
  
  // Convert to TTX
  const ttxResult = await ttx.dump(fontData);
  
  // Convert back to font
  const fontResult = await ttx.compile(ttxResult.data);
  
  return fontResult.data;
}
```

### Selective Table Dumping

```javascript
// Dump only metadata tables
const metadataOnly = await ttx.dump(fontData, {
  onlyTables: ['head', 'name', 'OS/2', 'hhea', 'maxp']
});

// Dump everything except glyph data
const noGlyphs = await ttx.dump(fontData, {
  skipTables: ['glyf', 'loca', 'CFF ', 'CFF2']
});
```

### Format Conversion

```javascript
// Convert TTF to WOFF
const woffResult = await ttx.compile(ttxData, {
  flavor: 'woff'
});

// Convert TTF to WOFF2
const woff2Result = await ttx.compile(ttxData, {
  flavor: 'woff2'
});
```

### Error Handling

```javascript
try {
  const ttx = await createTTX();
  const result = await ttx.dump(fontData);
  
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
  
  console.log('Conversion successful');
} catch (error) {
  console.error('Conversion failed:', error.message);
}
```

### Browser File Processing

```javascript
// Handle file input
async function handleFontFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const fontData = new Uint8Array(arrayBuffer);
  
  const ttx = await createTTX();
  const ttxResult = await ttx.dump(fontData);
  
  // Create download link
  const blob = new Blob([ttxResult.data], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name.replace(/\.[^.]+$/, '.ttx');
  link.click();
  
  URL.revokeObjectURL(url);
}

// File input event
document.getElementById('fontInput').addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFontFile(e.target.files[0]);
  }
});
```

## Font Format Support

### Input Formats
- **TTF** (TrueType Font) - ✅ Full support
- **OTF** (OpenType Font with CFF data) - ✅ Full support
- **WOFF** (Web Open Font Format) - 🚧 Basic support
- **WOFF2** (Web Open Font Format 2.0) - 🚧 Basic support
- **TTC** (TrueType Collection) - 🚧 Basic support
- **TTX** (TTX XML format) - ✅ Full support

### Output Formats
- **TTF** (TrueType Font) - ✅ Full support
- **OTF** (OpenType Font) - ✅ Full support
- **WOFF** (Web Open Font Format) - 🚧 Basic support
- **WOFF2** (Web Open Font Format 2.0) - 🚧 Basic support
- **TTX** (TTX XML format) - ✅ Full support

### Supported Font Tables

The following font tables are supported for conversion:

#### Core Tables
- `head` - Font header
- `hhea` - Horizontal header
- `maxp` - Maximum profile
- `OS/2` - OS/2 and Windows specific metrics
- `name` - Naming table
- `cmap` - Character to glyph mapping
- `post` - PostScript information
- `hmtx` - Horizontal metrics

#### TrueType Tables
- `glyf` - Glyph data
- `loca` - Index to location
- `fpgm` - Font program
- `prep` - Control Value Program
- `cvt ` - Control Value Table
- `gasp` - Grid-fitting and scan-conversion procedure

#### OpenType Tables
- `CFF ` - Compact Font Format table
- `CFF2` - Compact Font Format version 2
- `GDEF` - Glyph definition data
- `GPOS` - Glyph positioning data
- `GSUB` - Glyph substitution data

#### Advanced Tables
- `kern` - Kerning
- `LTSH` - Linear threshold
- `VDMX` - Vertical device metrics
- `hdmx` - Horizontal device metrics

And many more... See the full list in the FontTools documentation.

## Building from Source

### Prerequisites
- Node.js 16+
- Emscripten SDK
- Make

### Setup

```bash
# Clone repository
git clone https://github.com/mattlag/ttx-wasm.git
cd ttx-wasm

# Install dependencies
npm install

# Install Emscripten (if not already installed)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
```

### Building

```bash
# Build WASM module
npm run build:wasm

# Build JavaScript bindings
npm run build:js

# Build everything
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Development

```bash
# Start development build
npm run dev

# Check Emscripten installation
cd build && make check-emscripten

# Clean build artifacts
npm run clean
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Set up Emscripten SDK
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Style

- Use TypeScript for JavaScript code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### Reporting Issues

Please report issues on the [GitHub Issues](https://github.com/mattlag/ttx-wasm/issues) page.

Include:
- Font file causing the issue (if possible)
- Expected behavior
- Actual behavior
- Browser/Node.js version
- Error messages or console output

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
