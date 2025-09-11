/**
 * Universal TTX interface tests
 * Tests automatic environment detection and backend selection
 */

import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Import universal interface
import { detectRuntime, isBrowser, isNode } from '../../src/js/runtime';
import { TTX } from '../../src/js/universal-ttx';

describe('Universal TTX Interface', () => {
  let fontData: Uint8Array;

  beforeAll(async () => {
    // Load test font
    const fontPath = join(__dirname, '../sample fonts/oblegg.otf');
    fontData = await readFile(fontPath);
  });

  it('should detect runtime environment correctly', () => {
    const runtime = detectRuntime();
    console.log(`✓ Detected runtime: ${runtime}`);

    expect(['node', 'browser', 'worker']).toContain(runtime);

    if (runtime === 'node') {
      expect(isNode()).toBe(true);
      expect(isBrowser()).toBe(false);
    } else {
      expect(isNode()).toBe(false);
      expect(isBrowser()).toBe(true);
    }
  });

  it('should initialize TTX with appropriate backend', async () => {
    const runtime = detectRuntime();

    try {
      await TTX.initialize();
      expect(TTX.isInitialized()).toBe(true);
      expect(TTX.getRuntime()).toBe(runtime);

      console.log(`✓ TTX initialized with ${runtime} backend`);
    } catch (error: any) {
      if (runtime === 'node' && error.message.includes('FontTools')) {
        console.log('⚠️ Skipping test - Python/FontTools not available in Node.js environment');
        return;
      }
      throw error;
    }
  }, 30000);

  it('should provide consistent API across environments', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping API consistency test - TTX not initialized');
      return;
    }

    // Test all main methods exist
    expect(typeof TTX.detectFormat).toBe('function');
    expect(typeof TTX.getFontInfo).toBe('function');
    expect(typeof TTX.dumpToTTX).toBe('function');
    expect(typeof TTX.compileFromTTX).toBe('function');
    expect(typeof TTX.validateFont).toBe('function');
    expect(typeof TTX.roundTripTest).toBe('function');

    console.log('✓ All API methods available');
  });

  it('should detect font format consistently', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping format detection test - TTX not initialized');
      return;
    }

    const format = await TTX.detectFormat(fontData);
    expect(format).toBe('OTF');

    console.log(`✓ Format detection: ${format}`);
  });

  it('should get font info consistently', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping font info test - TTX not initialized');
      return;
    }

    const info = await TTX.getFontInfo(fontData);

    expect(info).toHaveProperty('format');
    expect(info).toHaveProperty('tables');
    expect(info).toHaveProperty('metadata');
    expect(Array.isArray(info.tables)).toBe(true);

    console.log(`✓ Font info: ${info.format}, ${info.tables.length} tables`);
  });

  it('should validate fonts consistently', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping font validation test - TTX not initialized');
      return;
    }

    const validation = await TTX.validateFont(fontData);

    expect(validation).toHaveProperty('isValid');
    expect(validation).toHaveProperty('format');
    expect(validation).toHaveProperty('errors');
    expect(validation).toHaveProperty('warnings');
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);

    console.log(
      `✓ Validation: ${validation.isValid ? 'VALID' : 'INVALID'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`
    );
  });

  it('should perform round-trip test consistently', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping round-trip test - TTX not initialized');
      return;
    }

    const result = await TTX.roundTripTest(fontData, {
      tables: ['head', 'name'], // Limit to essential tables for faster testing
      recalcBBoxes: false, // Preserve original bounding boxes
      recalcTimestamp: false, // Preserve original timestamps
    });

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('similarity');
    expect(result).toHaveProperty('differences');
    expect(result).toHaveProperty('steps');
    expect(typeof result.similarity).toBe('number');
    expect(Array.isArray(result.differences)).toBe(true);

    console.log(
      `✓ Round-trip test: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.similarity.toFixed(1)}% similarity)`
    );

    if (result.differences.length > 0) {
      console.log(
        `   First few differences: ${result.differences
          .slice(0, 3)
          .map(d => `Line ${d.lineNumber}`)
          .join(', ')}`
      );
    }
  }, 60000); // 60 second timeout

  it('should handle configuration options', async () => {
    const runtime = detectRuntime();

    // Test getting configuration
    const config = TTX.getConfig();
    expect(config).toHaveProperty('environment');
    expect(config?.environment).toBe(runtime);

    console.log(`✓ Configuration: ${JSON.stringify(config, null, 2)}`);
  });

  it('should handle both Uint8Array and ArrayBuffer inputs', async () => {
    if (!TTX.isInitialized()) {
      console.log('Skipping input type test - TTX not initialized');
      return;
    }

    // Test with Uint8Array
    const format1 = await TTX.detectFormat(fontData);

    // Test with ArrayBuffer
    const arrayBuffer = new ArrayBuffer(fontData.byteLength);
    new Uint8Array(arrayBuffer).set(fontData);
    const format2 = await TTX.detectFormat(arrayBuffer);

    expect(format1).toBe(format2);
    expect(format1).toBe('OTF');

    console.log('✓ Both Uint8Array and ArrayBuffer inputs work');
  });
});
