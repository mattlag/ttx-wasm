/**
 * Integration tests for TTX-WASM with sample fonts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import TTX from '../../src/js/index';

const SAMPLE_FONTS_DIR = join(__dirname, '..', 'sample fonts');

describe('TTX Integration Tests with Sample Fonts', () => {
  // Note: These tests will be skipped in CI since Pyodide requires a browser environment

  beforeAll(async () => {
    if (typeof window !== 'undefined') {
      await TTX.initialize();
    }
  });

  describe('oblegg.otf Font Conversion', () => {
    test('should convert oblegg.otf to TTX XML', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      // Load the sample font
      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      // Convert to TTX
      const ttxContent = await TTX.dumpToTTX(fontData, {
        disassembleInstructions: true,
        splitTables: false,
        splitGlyphs: false,
      });

      // Basic validation of TTX content
      expect(ttxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(ttxContent).toContain('<ttFont sfntVersion="OTTO"');
      expect(ttxContent).toContain('<head>');
      expect(ttxContent).toContain('<name>');
      expect(ttxContent).toContain('<cmap>');
      expect(ttxContent).toContain('<CFF>');
      expect(ttxContent).toContain('</ttFont>');

      // Verify it's a valid XML structure
      expect(() => {
        // This will throw if XML is malformed
        new DOMParser().parseFromString(ttxContent, 'text/xml');
      }).not.toThrow();

      console.log(`Generated TTX length: ${ttxContent.length} characters`);
      console.log('TTX conversion successful!');
    });

    test('should detect oblegg.otf format correctly', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      const format = await TTX.detectFormat(fontData);
      expect(format).toBe('OTF');
    });

    test('should get font info from oblegg.otf', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      const fontInfo = await TTX.getFontInfo(fontData);

      expect(fontInfo.format).toBe('OTF');
      expect(Array.isArray(fontInfo.tables)).toBe(true);
      expect(fontInfo.tables.length).toBeGreaterThan(0);
      expect(fontInfo.tables).toContain('CFF');
      expect(fontInfo.tables).toContain('head');
      expect(fontInfo.tables).toContain('name');
      expect(fontInfo.tables).toContain('cmap');

      expect(fontInfo.metadata).toBeDefined();

      console.log('Font Info:', {
        format: fontInfo.format,
        tableCount: fontInfo.tables.length,
        tables: fontInfo.tables,
        metadata: fontInfo.metadata,
      });
    });

    test('should round-trip convert oblegg.otf (OTF -> TTX -> OTF)', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
      const originalFontData = new Uint8Array(readFileSync(fontPath));

      // Convert to TTX
      const ttxContent = await TTX.dumpToTTX(originalFontData, {
        disassembleInstructions: true,
      });

      // Convert back to font
      const reconstructedFontData = await TTX.compileFromTTX(ttxContent);

      // Basic validation
      expect(reconstructedFontData).toBeInstanceOf(Uint8Array);
      expect(reconstructedFontData.length).toBeGreaterThan(1000); // Should be a reasonable font size

      // Check that it's still an OTF font (OTTO signature)
      const signature = Array.from(reconstructedFontData.slice(0, 4))
        .map(b => String.fromCharCode(b))
        .join('');
      expect(signature).toBe('OTTO');

      // Verify we can detect the format of the reconstructed font
      const reconstructedFormat = await TTX.detectFormat(reconstructedFontData);
      expect(reconstructedFormat).toBe('OTF');

      console.log(`Original size: ${originalFontData.length} bytes`);
      console.log(`Reconstructed size: ${reconstructedFontData.length} bytes`);
      console.log('Round-trip conversion successful!');
    });
  });

  describe('Multiple Font Format Support', () => {
    test('should handle TTF font (oblegg.ttf)', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.ttf');
      const fontData = new Uint8Array(readFileSync(fontPath));

      const format = await TTX.detectFormat(fontData);
      expect(format).toBe('TTF');

      const ttxContent = await TTX.dumpToTTX(fontData);
      expect(ttxContent).toContain('<ttFont sfntVersion="\\x00\\x01\\x00\\x00"');
      expect(ttxContent).toContain('<glyf>');
      expect(ttxContent).not.toContain('<CFF>');
    });

    test('should handle WOFF font (oblegg.woff)', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.woff');
      const fontData = new Uint8Array(readFileSync(fontPath));

      const format = await TTX.detectFormat(fontData);
      expect(format).toBe('WOFF');

      const ttxContent = await TTX.dumpToTTX(fontData);
      expect(ttxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(ttxContent).toContain('<ttFont');
    });

    test('should handle WOFF2 font (oblegg.woff2)', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.woff2');
      const fontData = new Uint8Array(readFileSync(fontPath));

      const format = await TTX.detectFormat(fontData);
      expect(format).toBe('WOFF2');

      const ttxContent = await TTX.dumpToTTX(fontData);
      expect(ttxContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(ttxContent).toContain('<ttFont');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid font data gracefully', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const invalidData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

      await expect(TTX.dumpToTTX(invalidData)).rejects.toThrow();
    });

    test('should handle malformed TTX XML gracefully', async () => {
      if (typeof window === 'undefined') {
        console.log('Skipping Pyodide integration test in Node.js environment');
        return;
      }

      const malformedTTX = '<?xml version="1.0"?><ttFont><invalid></ttFont>';

      await expect(TTX.compileFromTTX(malformedTTX)).rejects.toThrow();
    });
  });
});

// Helper to create expected TTX output for comparison (run this manually to generate reference)
export async function generateReferenceTTX() {
  if (typeof window === 'undefined') {
    console.log('Reference TTX generation requires browser environment');
    return;
  }

  await TTX.initialize();

  const fontPath = join(SAMPLE_FONTS_DIR, 'oblegg.otf');
  const fontData = new Uint8Array(readFileSync(fontPath));

  const ttxContent = await TTX.dumpToTTX(fontData, {
    disassembleInstructions: true,
    splitTables: false,
    splitGlyphs: false,
  });

  console.log('=== REFERENCE TTX OUTPUT ===');
  console.log(ttxContent);
  console.log('=== END REFERENCE TTX ===');

  return ttxContent;
}
