/**
 * Node.js Example: Font Analysis CLI Tool
 * Demonstrates using TTX-WASM in a Node.js environment with native Python FontTools
 */

import { readFile } from 'fs/promises';
import { TTX } from '../dist/ttx-wasm-universal.esm.js';

async function analyzeFontFile(fontPath) {
  console.log('🔍 Font Analysis Tool (Node.js + Python FontTools)\n');

  try {
    // Initialize TTX for Node.js
    console.log('Initializing TTX...');
    await TTX.initialize({
      pythonExecutable: 'python3', // or 'python' on Windows
    });

    console.log(`✓ Running on: ${TTX.getRuntime()}`);
    console.log('✓ TTX initialized with native Python backend\n');

    // Load font file
    console.log(`Loading font: ${fontPath}`);
    const fontData = await readFile(fontPath);
    console.log(`✓ Loaded ${fontData.length} bytes\n`);

    // Detect format
    const format = await TTX.detectFormat(fontData);
    console.log(`📄 Format: ${format}`);

    // Get font info
    const info = await TTX.getFontInfo(fontData);
    console.log(
      `📋 Tables: ${info.tables.length} (${info.tables.slice(0, 8).join(', ')}${info.tables.length > 8 ? '...' : ''})`
    );

    if (info.metadata.family) {
      console.log(`👨‍👩‍👧‍👦 Family: ${info.metadata.family}`);
    }
    if (info.metadata.style) {
      console.log(`🎨 Style: ${info.metadata.style}`);
    }
    if (info.metadata.version) {
      console.log(`📝 Version: ${info.metadata.version}`);
    }
    if (info.metadata.unitsPerEm) {
      console.log(`📏 Units per Em: ${info.metadata.unitsPerEm}`);
    }

    // Validate font
    console.log('\n🔍 Validating font...');
    const validation = await TTX.validateFont(fontData);
    console.log(
      `${validation.isValid ? '✅' : '❌'} Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`
    );

    if (validation.errors.length > 0) {
      console.log(`❌ Errors: ${validation.errors.length}`);
      validation.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (validation.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${validation.warnings.length}`);
      validation.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Convert to TTX (just the head table for demo)
    console.log('\n🔄 Converting to TTX (head table only)...');
    const ttxContent = await TTX.dumpToTTX(fontData, {
      tables: ['head'],
    });

    console.log(`✓ Generated TTX: ${Math.round(ttxContent.length / 1024)} KB`);
    console.log('\nFirst few lines of TTX:');
    const lines = ttxContent.split('\n').slice(0, 10);
    lines.forEach(line => console.log(`   ${line}`));

    if (lines.length < ttxContent.split('\n').length) {
      console.log('   ...');
    }

    console.log('\n✅ Font analysis complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('FontTools')) {
      console.log('\n💡 To fix this issue:');
      console.log('   pip install fonttools');
      console.log('   # or');
      console.log('   pip3 install fonttools');
    }

    process.exit(1);
  }
}

// CLI usage
const fontPath = process.argv[2];
if (!fontPath) {
  console.log('Usage: node analyze-font.js <path-to-font-file>');
  console.log('Example: node analyze-font.js ../tests/sample\\ fonts/oblegg.otf');
  process.exit(1);
}

analyzeFontFile(fontPath);
