/**
 * Font Conversion Validation Tests
 * Tests the core functionality of TTX-WASM with sample fonts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import TTX from '../../src/js/index';

const SAMPLE_FONTS_DIR = join(__dirname, '..', 'sample fonts');
const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

describe('Font Conversion Validation', () => {
  describe('Browser Environment Tests', () => {
    beforeAll(async () => {
      if (typeof window !== 'undefined') {
        await TTX.initialize();
      }
    });

    test('should convert oblegg.otf and validate structure', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping browser test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      // Convert to TTX
      const ttxContent = await TTX.dumpToTTX(fontData, {
        disassembleInstructions: true,
        splitTables: false,
        splitGlyphs: false,
      });

      // Validate XML structure
      expect(ttxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(ttxContent).toContain('<ttFont sfntVersion="OTTO"');
      expect(ttxContent).toContain('</ttFont>');

      // Validate required tables for OTF
      expect(ttxContent).toContain('<CFF>');
      expect(ttxContent).toContain('<head>');
      expect(ttxContent).toContain('<name>');
      expect(ttxContent).toContain('<cmap>');

      // Validate font-specific content
      expect(ttxContent).toContain('unitsPerEm');
      expect(ttxContent).toContain('magicNumber');

      // Test round-trip conversion
      const reconstructed = await TTX.compileFromTTX(ttxContent);
      expect(reconstructed).toBeInstanceOf(Uint8Array);
      expect(reconstructed.length).toBeGreaterThan(1000);

      // Verify reconstructed font signature
      const signature = Array.from(reconstructed.slice(0, 4))
        .map(b => String.fromCharCode(b))
        .join('');
      expect(signature).toBe('OTTO');

      console.log(`✓ TTX length: ${ttxContent.length} characters`);
      console.log(`✓ Original font: ${fontData.length} bytes`);
      console.log(`✓ Reconstructed: ${reconstructed.length} bytes`);
    });

    test('should generate consistent output structure', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping browser test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      // Generate TTX twice to ensure consistency
      const ttx1 = await TTX.dumpToTTX(fontData);
      const ttx2 = await TTX.dumpToTTX(fontData);

      // Should produce identical output
      expect(ttx1).toBe(ttx2);

      // Both should have the same basic structure
      expect(ttx1.split('\n').length).toBe(ttx2.split('\n').length);
    });

    test('should handle different font formats from same font family', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping browser test in Node.js environment');
        return;
      }

      // Test different formats of the same font
      const formats = [
        { file: 'oblegg.otf', expectedFormat: 'OTF', expectedSfnt: 'OTTO' },
        { file: 'oblegg.ttf', expectedFormat: 'TTF', expectedSfnt: '\\x00\\x01\\x00\\x00' },
        { file: 'oblegg.woff', expectedFormat: 'WOFF', expectedSfnt: null },
        { file: 'oblegg.woff2', expectedFormat: 'WOFF2', expectedSfnt: null },
      ];

      for (const format of formats) {
        const fontPath = join(SAMPLE_FONTS_DIR, format.file);
        const fontData = new Uint8Array(readFileSync(fontPath));

        // Test format detection
        const detectedFormat = await TTX.detectFormat(fontData);
        expect(detectedFormat).toBe(format.expectedFormat);

        // Test TTX conversion
        const ttxContent = await TTX.dumpToTTX(fontData);
        expect(ttxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(ttxContent).toContain('<ttFont');

        if (format.expectedSfnt) {
          expect(ttxContent).toContain(`sfntVersion="${format.expectedSfnt}"`);
        }

        console.log(`✓ ${format.file}: ${detectedFormat} format, ${ttxContent.length} chars`);
      }
    });
  });

  describe('Node.js Environment Tests', () => {
    test('should validate sample font files exist', () => {
      const expectedFiles = [
        'oblegg.otf',
        'oblegg.ttf',
        'oblegg.woff',
        'oblegg.woff2',
        'fira.ttf',
        'mtextra.ttf',
        'noto.ttf',
      ];

      for (const file of expectedFiles) {
        const fontPath = join(SAMPLE_FONTS_DIR, file);
        expect(() => readFileSync(fontPath)).not.toThrow();

        const stats = readFileSync(fontPath);
        expect(stats.length).toBeGreaterThan(100); // Should be a reasonable font size
      }
    });

    test('should validate font file signatures', () => {
      const fontTests = [
        { file: 'oblegg.otf', expectedSignature: 'OTTO' },
        { file: 'oblegg.ttf', expectedSignature: '\x00\x01\x00\x00' },
        { file: 'oblegg.woff', expectedSignature: 'wOFF' },
        { file: 'oblegg.woff2', expectedSignature: 'wOF2' },
      ];

      for (const test of fontTests) {
        const fontPath = join(SAMPLE_FONTS_DIR, test.file);
        const fontData = readFileSync(fontPath);
        const signature = fontData.slice(0, 4).toString('binary');

        expect(signature).toBe(test.expectedSignature);
        console.log(`✓ ${test.file}: Correct signature "${test.expectedSignature}"`);
      }
    });
  });
});

// Utility function to generate reference TTX for manual validation
export async function generateObleggReference() {
  if (typeof window === 'undefined') {
    throw new Error('Reference generation requires browser environment');
  }

  await TTX.initialize();

  const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
  const fontData = new Uint8Array(readFileSync(fontPath));

  const ttxContent = await TTX.dumpToTTX(fontData, {
    disassembleInstructions: true,
    splitTables: false,
    splitGlyphs: false,
  });

  // Save reference file
  const referencePath = join(FIXTURES_DIR, 'oblegg-generated.ttx');
  writeFileSync(referencePath, ttxContent, 'utf8');

  console.log(`Reference TTX saved to: ${referencePath}`);
  console.log(`TTX length: ${ttxContent.length} characters`);

  return ttxContent;
}
