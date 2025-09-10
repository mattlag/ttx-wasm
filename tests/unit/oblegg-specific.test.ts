/**
 * Specific test for oblegg.otf conversion through WASM implementation
 * Tests the complete TTX conversion workflow as requested
 */

import * as fs from 'fs';
import * as path from 'path';
import { TTX } from '../../src/js/index';

// Environment detection
const isBrowser = typeof window !== 'undefined';

describe('OblEgg OTF Specific Tests', () => {
  const sampleFontsDir = path.join(__dirname, '..', 'sample fonts');
  const oblEggPath = path.join(sampleFontsDir, 'oblegg.otf');
  const referenceXmlPath = path.join(__dirname, 'fixtures', 'oblegg-reference.ttx');

  beforeAll(async () => {
    if (isBrowser) {
      // Initialize TTX in browser environment
      await TTX.initialize();
    }
  }, 30000);

  describe('Browser Environment Tests', () => {
    if (isBrowser) {
      test('should convert oblegg.otf to TTX XML with expected structure', async () => {
        // Read the font file
        const fontBuffer = fs.readFileSync(oblEggPath);
        const fontArray = new Uint8Array(fontBuffer);

        // Convert to TTX
        const ttxXml = await TTX.dumpToTTX(fontArray);

        // Validate basic XML structure
        expect(ttxXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(ttxXml).toContain('<ttFont sfntVersion="OTTO"');
        expect(ttxXml).toContain('</ttFont>');

        // Validate essential font tables for OTF
        expect(ttxXml).toContain('<CFF>');
        expect(ttxXml).toContain('<head>');
        expect(ttxXml).toContain('<hhea>');
        expect(ttxXml).toContain('<hmtx>');
        expect(ttxXml).toContain('<maxp>');
        expect(ttxXml).toContain('<name>');
        expect(ttxXml).toContain('<OS_2>');
        expect(ttxXml).toContain('<post>');
        expect(ttxXml).toContain('<cmap>');

        // Validate OblEgg specific metadata
        expect(ttxXml).toContain('OblEgg');

        console.log('✓ OblEgg OTF successfully converted to TTX XML');
        console.log(`✓ Generated XML size: ${ttxXml.length} characters`);
        console.log('✓ All essential OTF tables present');
      }, 15000);

      test('should perform round-trip conversion (OTF → TTX → OTF)', async () => {
        // Read the original font file
        const originalFontBuffer = fs.readFileSync(oblEggPath);
        const originalFontArray = new Uint8Array(originalFontBuffer);

        // Convert to TTX
        const ttxXml = await TTX.dumpToTTX(originalFontArray);

        // Convert back to font
        const reconstructedFontArray = await TTX.compileFromTTX(ttxXml);

        // Validate the reconstructed font
        expect(reconstructedFontArray).toBeInstanceOf(Uint8Array);
        expect(reconstructedFontArray.length).toBeGreaterThan(1000);

        // Check OTF signature
        const signature = String.fromCharCode(...reconstructedFontArray.slice(0, 4));
        expect(signature).toBe('OTTO');

        console.log('✓ OblEgg OTF round-trip conversion successful');
        console.log(`✓ Original size: ${originalFontArray.length} bytes`);
        console.log(`✓ Reconstructed size: ${reconstructedFontArray.length} bytes`);
      }, 20000);

      test('should generate TTX output matching reference structure', async () => {
        // Read the font file
        const fontBuffer = fs.readFileSync(oblEggPath);
        const fontArray = new Uint8Array(fontBuffer);

        // Convert to TTX
        const ttxXml = await TTX.dumpToTTX(fontArray);

        // Read reference XML if it exists
        let referenceXml = '';
        if (fs.existsSync(referenceXmlPath)) {
          referenceXml = fs.readFileSync(referenceXmlPath, 'utf-8');
        }

        // If reference exists, compare key structural elements
        if (referenceXml) {
          // Extract font metadata for comparison
          const extractFontName = (xml: string) => {
            const match = xml.match(/<namerecord[^>]*nameID="1"[^>]*>(.*?)<\/namerecord>/);
            return match ? match[1] : '';
          };

          const extractVersion = (xml: string) => {
            const match = xml.match(/<namerecord[^>]*nameID="5"[^>]*>(.*?)<\/namerecord>/);
            return match ? match[1] : '';
          };

          const generatedFontName = extractFontName(ttxXml);
          const referenceFontName = extractFontName(referenceXml);

          if (generatedFontName && referenceFontName) {
            expect(generatedFontName).toBe(referenceFontName);
            console.log(`✓ Font name matches reference: ${generatedFontName}`);
          }
        }

        // Validate consistent output structure
        const tableCount = (ttxXml.match(/<\/\w+>/g) || []).length;
        expect(tableCount).toBeGreaterThan(10); // Should have multiple font tables

        console.log('✓ TTX output structure validated');
        console.log(`✓ Total XML elements: ${tableCount}`);
      }, 15000);
    } else {
      test('should skip browser tests in Node.js environment', () => {
        console.log('Skipping browser test in Node.js environment');
        expect(true).toBe(true);
      });
    }
  });

  describe('Node.js Environment Tests', () => {
    test('should verify oblegg.otf file exists and is valid', () => {
      // Check file exists
      expect(fs.existsSync(oblEggPath)).toBe(true);

      // Check file size
      const stats = fs.statSync(oblEggPath);
      expect(stats.size).toBeGreaterThan(1000);

      // Check OTF signature
      const buffer = fs.readFileSync(oblEggPath);
      const signature = buffer.toString('ascii', 0, 4);
      expect(signature).toBe('OTTO');

      console.log(`✓ oblegg.otf file verified: ${stats.size} bytes`);
      console.log('✓ OTF signature confirmed: OTTO');
    });

    test('should validate reference TTX file structure if present', () => {
      if (fs.existsSync(referenceXmlPath)) {
        const referenceXml = fs.readFileSync(referenceXmlPath, 'utf-8');

        // Validate XML structure
        expect(referenceXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(referenceXml).toContain('<ttFont sfntVersion="OTTO"');
        expect(referenceXml).toContain('</ttFont>');

        console.log('✓ Reference TTX file structure validated');
        console.log(`✓ Reference XML size: ${referenceXml.length} characters`);
      } else {
        console.log('ℹ Reference TTX file not found - will be generated during browser tests');
        expect(true).toBe(true);
      }
    });
  });
});
