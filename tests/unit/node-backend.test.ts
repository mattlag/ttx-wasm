/**
 * Node.js-specific tests for TTX-WASM
 * Tests the native Python FontTools backend
 */

import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Import Node.js specific modules
import { NodeTTX } from '../../src/js/node-ttx';
import { isNode } from '../../src/js/runtime';

describe('Node.js TTX Backend', () => {
  let nodeTTX: NodeTTX;
  let fontData: Uint8Array;

  beforeAll(async () => {
    // Skip tests if not running in Node.js
    if (!isNode()) {
      console.log('Skipping Node.js tests - not running in Node.js environment');
      return;
    }

    // Check if Python and FontTools are available
    try {
      nodeTTX = new NodeTTX();
      await nodeTTX.initialize();
    } catch (error: any) {
      console.log(`Skipping Node.js tests - Python/FontTools not available: ${error.message}`);
      return;
    }

    // Load test font
    const fontPath = join(__dirname, '../sample fonts/oblegg.otf');
    fontData = await readFile(fontPath);
  });

  it('should detect Node.js environment', () => {
    if (!isNode()) {
      console.log('Skipping Node.js environment test - not in Node.js');
      return;
    }
    expect(isNode()).toBe(true);
  });

  it('should initialize NodeTTX successfully', async () => {
    if (!isNode() || !nodeTTX) {
      console.log('Skipping NodeTTX initialization test');
      return;
    }

    expect(nodeTTX.isInitialized()).toBe(true);
  });

  it('should detect font format', async () => {
    if (!isNode() || !nodeTTX || !fontData) {
      console.log('Skipping font format detection test');
      return;
    }

    const format = await nodeTTX.detectFormat(fontData);
    expect(format).toBe('OTF');
    console.log(`✓ Detected format: ${format}`);
  });

  it('should get font info', async () => {
    if (!isNode() || !nodeTTX || !fontData) {
      console.log('Skipping font info test');
      return;
    }

    const info = await nodeTTX.getFontInfo(fontData);

    expect(info).toHaveProperty('format');
    expect(info).toHaveProperty('tables');
    expect(info).toHaveProperty('metadata');
    expect(Array.isArray(info.tables)).toBe(true);
    expect(info.tables.length).toBeGreaterThan(0);

    console.log(`✓ Font info: ${info.format}, ${info.tables.length} tables`);
    console.log(
      `✓ Tables: ${info.tables.slice(0, 5).join(', ')}${info.tables.length > 5 ? '...' : ''}`
    );
  });

  it('should convert font to TTX', async () => {
    if (!isNode() || !nodeTTX || !fontData) {
      console.log('Skipping font to TTX conversion test');
      return;
    }

    const ttxContent = await nodeTTX.dumpToTTX(fontData);

    expect(typeof ttxContent).toBe('string');
    expect(ttxContent.length).toBeGreaterThan(1000);
    expect(ttxContent).toContain('<?xml');
    expect(ttxContent).toContain('<ttFont');
    expect(ttxContent).toContain('</ttFont>');

    console.log(`✓ Generated TTX: ${Math.round(ttxContent.length / 1024)} KB`);
  }, 30000); // 30 second timeout for TTX conversion

  it('should convert TTX back to font', async () => {
    if (!isNode() || !nodeTTX || !fontData) {
      console.log('Skipping TTX to font conversion test');
      return;
    }

    // First convert to TTX
    const ttxContent = await nodeTTX.dumpToTTX(fontData);

    // Then convert back to font
    const newFontData = await nodeTTX.compileFromTTX(ttxContent);

    expect(newFontData).toBeInstanceOf(ArrayBuffer);
    expect(newFontData.byteLength).toBeGreaterThan(1000);

    console.log(
      `✓ Round-trip conversion: ${fontData.length} → ${ttxContent.length} chars → ${newFontData.byteLength} bytes`
    );
  }, 60000); // 60 second timeout for round-trip

  it('should handle specific table extraction', async () => {
    if (!isNode() || !nodeTTX || !fontData) {
      console.log('Skipping table extraction test');
      return;
    }

    const ttxContent = await nodeTTX.dumpToTTX(fontData, {
      tables: ['head', 'name'],
    });

    expect(ttxContent).toContain('<head>');
    expect(ttxContent).toContain('<name>');
    expect(ttxContent).not.toContain('<glyf>'); // Should not contain other tables

    console.log('✓ Selective table extraction works');
  }, 30000);

  it('should validate error handling for invalid data', async () => {
    if (!isNode() || !nodeTTX) {
      console.log('Skipping error handling test');
      return;
    }

    const invalidData = new Uint8Array([1, 2, 3, 4]);

    // Should detect as unknown format
    const format = await nodeTTX.detectFormat(invalidData);
    expect(format).toBe('UNKNOWN');

    // Should throw error for font info
    await expect(nodeTTX.getFontInfo(invalidData)).rejects.toThrow();

    console.log('✓ Error handling works correctly');
  });
});
