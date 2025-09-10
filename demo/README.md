# TTX-WASM Demo

This directory contains a standalone demo of TTX-WASM with 100% Python FontTools
compatibility.

## 🚀 Running the Demo

### Option 1: Local Development Server

```bash
# From the project root
npm run start:browser
```

### Option 2: Any Web Server

The demo is completely standalone. Simply copy these files to any web server:

- `index.html` - Main demo page
- `ttx-wasm.esm.js` - TTX-WASM module

```bash
# Example with Python
python -m http.server 8080

# Example with Node.js http-server
npx http-server . -p 8080

# Example with PHP
php -S localhost:8080
```

## 🎮 Features

### Drag & Drop Support

- **Font Files**: Drop .ttf, .otf, .woff, .woff2, .ttc files to convert to TTX
  XML
- **TTX Files**: Drop .ttx or .xml files to compile back to font binaries

### Complete FontTools Options

- ✅ Disassemble TrueType instructions
- ✅ Split tables into separate outputs
- ✅ Split glyph data
- ✅ Output format selection (WOFF, WOFF2)
- ✅ Table filtering and exclusion

### Real-time Processing

- ✅ Font format detection
- ✅ Comprehensive font information
- ✅ Table listing and analysis
- ✅ Processing logs and error handling
- ✅ Download processed results

## 📦 Standalone Usage

This demo is completely self-contained. To use it on your own server:

1. Copy `index.html` and `ttx-wasm.esm.js` to your web directory
2. Serve via any HTTP server (HTTPS recommended for full functionality)
3. Open in a modern browser with ES module support

No additional dependencies or build steps required!

## 🎯 What's Included

- **100% Python FontTools TTX** - Complete feature parity
- **40+ Font Tables** - GLYF, GSUB, GPOS, and all others
- **Instruction Disassembly** - Full TrueType bytecode support
- **Bidirectional Conversion** - Font ↔ TTX with perfect fidelity
- **Modern UI** - Responsive design with drag-and-drop
- **Real-time Feedback** - Progress bars, status indicators, detailed logs

Powered by [Pyodide](https://pyodide.org/) for true Python FontTools
compatibility in the browser!
