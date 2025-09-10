#!/usr/bin/env node

/**
 * TTX-WASM Node.js Example
 *
 * This example demonstrates how to use TTX-WASM in a Node.js environment
 * for font conversion operations.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, this would import the actual TTX-WASM module
// import { createTTX } from 'ttx-wasm';

// Mock implementation for demonstration
class MockTTX {
  async init() {
    console.log('TTX-WASM module initialized');
  }

  async detectFormat(data) {
    if (data.length < 4) throw new Error('File too small');
    const signature = data.readUInt32BE(0);
    if (signature === 0x00010000) return 'TTF';
    if (signature === 0x4f54544f) return 'OTF';
    return 'UNKNOWN';
  }

  async getFontInfo(data) {
    const format = await this.detectFormat(data);
    return {
      format,
      tables: ['head', 'hhea', 'maxp', 'OS/2', 'name', 'cmap', 'post', 'hmtx'],
      metadata: {
        family: 'Example Font',
        style: 'Regular',
        unitsPerEm: 1000,
      },
    };
  }

  async dump(data, options = {}) {
    const format = await this.detectFormat(data);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ttFont sfntVersion="\\x00\\x01\\x00\\x00" ttLibVersion="4.0">
  <!-- TTX-WASM Node.js Example Output -->
  <GlyphOrder>
    <GlyphID id="0" name=".notdef"/>
    <GlyphID id="1" name="space"/>
    <GlyphID id="2" name="A"/>
  </GlyphOrder>
  
  <head>
    <tableVersion value="1.0"/>
    <fontRevision value="1.0"/>
    <checkSumAdjustment value="0x12345678"/>
    <magicNumber value="0x5f0f3cf5"/>
    <flags value="0x0003"/>
    <unitsPerEm value="1000"/>
    <created value="Mon Jan 01 00:00:00 2024"/>
    <modified value="Mon Jan 01 00:00:00 2024"/>
    <xMin value="0"/>
    <yMin value="0"/>
    <xMax value="1000"/>
    <yMax value="1000"/>
    <macStyle value="0x0000"/>
    <lowestRecPPEM value="8"/>
    <fontDirectionHint value="2"/>
    <indexToLocFormat value="0"/>
    <glyphDataFormat value="0"/>
  </head>
  
  <hhea>
    <tableVersion value="0x00010000"/>
    <ascent value="800"/>
    <descent value="-200"/>
    <lineGap value="0"/>
    <advanceWidthMax value="1000"/>
    <minLeftSideBearing value="0"/>
    <minRightSideBearing value="0"/>
    <xMaxExtent value="1000"/>
    <caretSlopeRise value="1"/>
    <caretSlopeRun value="0"/>
    <caretOffset value="0"/>
    <reserved0 value="0"/>
    <reserved1 value="0"/>
    <reserved2 value="0"/>
    <reserved3 value="0"/>
    <metricDataFormat value="0"/>
    <numberOfHMetrics value="3"/>
  </hhea>
  
</ttFont>`;
    return { data: xml, format: 'TTX', warnings: ['Mock implementation'] };
  }

  async compile(data, options = {}) {
    const binaryData = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a]);
    return { data: binaryData, format: options.flavor || 'TTF' };
  }

  async listTables(data) {
    return ['head', 'hhea', 'maxp', 'OS/2', 'name', 'cmap', 'post', 'hmtx'];
  }
}

async function createTTX() {
  const ttx = new MockTTX();
  await ttx.init();
  return ttx;
}

async function main() {
  console.log('TTX-WASM Node.js Example');
  console.log('=========================\n');

  try {
    // Initialize TTX
    console.log('Initializing TTX-WASM...');
    const ttx = await createTTX();
    console.log('✓ TTX-WASM initialized successfully\n');

    // Example 1: Font format detection
    console.log('Example 1: Font Format Detection');
    console.log('---------------------------------');

    // Create sample font data (TTF signature)
    const sampleTTF = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x80]);
    const format = await ttx.detectFormat(sampleTTF);
    console.log(`Detected format: ${format}`);

    // Example 2: Get font information
    console.log('\nExample 2: Font Information');
    console.log('----------------------------');

    const fontInfo = await ttx.getFontInfo(sampleTTF);
    console.log('Font Info:');
    console.log(`  Format: ${fontInfo.format}`);
    console.log(`  Tables: ${fontInfo.tables.join(', ')}`);
    console.log(`  Family: ${fontInfo.metadata.family}`);
    console.log(`  Style: ${fontInfo.metadata.style}`);
    console.log(`  Units per Em: ${fontInfo.metadata.unitsPerEm}`);

    // Example 3: Convert font to TTX
    console.log('\nExample 3: Font to TTX Conversion');
    console.log('----------------------------------');

    const ttxResult = await ttx.dump(sampleTTF, {
      onlyTables: ['head', 'hhea'],
      disassembleInstructions: true,
    });

    console.log(`Conversion result: ${ttxResult.format}`);
    console.log(`TTX length: ${ttxResult.data.length} characters`);

    if (ttxResult.warnings.length > 0) {
      console.log(`Warnings: ${ttxResult.warnings.join(', ')}`);
    }

    // Save TTX to file
    const ttxPath = path.join(__dirname, 'example-output.ttx');
    await fs.writeFile(ttxPath, ttxResult.data, 'utf8');
    console.log(`✓ TTX saved to: ${ttxPath}`);

    // Example 4: Convert TTX back to font
    console.log('\nExample 4: TTX to Font Compilation');
    console.log('-----------------------------------');

    const fontResult = await ttx.compile(ttxResult.data, {
      flavor: 'ttf',
      recalcBBoxes: true,
    });

    console.log(`Compilation result: ${fontResult.format}`);
    console.log(`Font size: ${fontResult.data.length} bytes`);

    // Save compiled font to file
    const fontPath = path.join(__dirname, 'example-output.ttf');
    await fs.writeFile(fontPath, fontResult.data);
    console.log(`✓ Font saved to: ${fontPath}`);

    // Example 5: List tables in font
    console.log('\nExample 5: Table Listing');
    console.log('------------------------');

    const tables = await ttx.listTables(sampleTTF);
    console.log(`Tables found: ${tables.length}`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });

    // Example 6: Batch processing
    console.log('\nExample 6: Batch Processing Demo');
    console.log('---------------------------------');

    const sampleFonts = [
      { name: 'font1.ttf', data: Buffer.from([0x00, 0x01, 0x00, 0x00]) },
      { name: 'font2.otf', data: Buffer.from([0x4f, 0x54, 0x54, 0x4f]) },
      { name: 'font3.ttf', data: Buffer.from([0x00, 0x01, 0x00, 0x00]) },
    ];

    console.log('Processing multiple fonts:');
    for (const font of sampleFonts) {
      try {
        const format = await ttx.detectFormat(font.data);
        console.log(`  ${font.name}: ${format}`);
      } catch (error) {
        console.log(`  ${font.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✓ All examples completed successfully!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Command line interface
// Run the demo
console.log('Running TTX-WASM Node.js Example...');
main().catch(console.error);

async function processCommandLine(args) {
  const command = args[0];

  switch (command) {
    case 'info':
      if (args.length < 2) {
        console.error('Usage: node example.js info <font-file>');
        process.exit(1);
      }
      await showFontInfo(args[1]);
      break;

    case 'dump':
      if (args.length < 2) {
        console.error('Usage: node example.js dump <font-file> [output.ttx]');
        process.exit(1);
      }
      await dumpFont(args[1], args[2]);
      break;

    case 'compile':
      if (args.length < 2) {
        console.error('Usage: node example.js compile <ttx-file> [output.ttf]');
        process.exit(1);
      }
      await compileFont(args[1], args[2]);
      break;

    case 'tables':
      if (args.length < 2) {
        console.error('Usage: node example.js tables <font-file>');
        process.exit(1);
      }
      await listFontTables(args[1]);
      break;

    default:
      console.log('TTX-WASM Node.js Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node example.js                    - Run examples');
      console.log('  node example.js info <font>        - Show font information');
      console.log('  node example.js dump <font> [ttx]  - Convert font to TTX');
      console.log('  node example.js compile <ttx> [font] - Convert TTX to font');
      console.log('  node example.js tables <font>      - List font tables');
  }
}

async function showFontInfo(fontPath) {
  try {
    const ttx = await createTTX();
    const data = await fs.readFile(fontPath);
    const info = await ttx.getFontInfo(data);

    console.log(`Font Information for: ${path.basename(fontPath)}`);
    console.log(`Format: ${info.format}`);
    console.log(`Tables: ${info.tables.join(', ')}`);
    console.log(`Family: ${info.metadata.family}`);
    console.log(`Style: ${info.metadata.style}`);
    console.log(`Units per Em: ${info.metadata.unitsPerEm}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function dumpFont(fontPath, outputPath) {
  try {
    const ttx = await createTTX();
    const data = await fs.readFile(fontPath);
    const result = await ttx.dump(data);

    const outputFile = outputPath || fontPath.replace(/\.[^.]+$/, '.ttx');
    await fs.writeFile(outputFile, result.data, 'utf8');

    console.log(`Font dumped to TTX: ${outputFile}`);
    if (result.warnings.length > 0) {
      console.log(`Warnings: ${result.warnings.join(', ')}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function compileFont(ttxPath, outputPath) {
  try {
    const ttx = await createTTX();
    const data = await fs.readFile(ttxPath, 'utf8');
    const result = await ttx.compile(data);

    const outputFile = outputPath || ttxPath.replace(/\.ttx$/, '.ttf');
    await fs.writeFile(outputFile, result.data);

    console.log(`TTX compiled to font: ${outputFile}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function listFontTables(fontPath) {
  try {
    const ttx = await createTTX();
    const data = await fs.readFile(fontPath);
    const tables = await ttx.listTables(data);

    console.log(`Tables in ${path.basename(fontPath)}:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export { createTTX, main };
