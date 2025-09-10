/**
 * TTX-WASM: FontTools TTX for WebAssembly
 * Now powered by Pyodide for 100% Python FontTools compatibility
 */

import { pyodideTTX } from './pyodide-ttx.js';

export interface TTXOptions {
  tables?: string[];
  skipTables?: string[];
  splitTables?: boolean;
  splitGlyphs?: boolean;
  disassembleInstructions?: boolean;
  fontNumber?: number;
  flavor?: string;
}

export interface FontInfo {
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

/**
 * Main TTX class providing FontTools functionality via Pyodide
 */
export class TTX {
  /**
   * Initialize the TTX processor (loads Pyodide and FontTools)
   */
  static async initialize(): Promise<void> {
    await pyodideTTX.initialize();
  }

  /**
   * Check if TTX is initialized and ready to use
   */
  static isInitialized(): boolean {
    return pyodideTTX.isInitialized();
  }

  /**
   * Detect the format of a font file
   */
  static async detectFormat(fontData: Uint8Array): Promise<string> {
    return await pyodideTTX.detectFormat(fontData);
  }

  /**
   * Get comprehensive information about a font
   */
  static async getFontInfo(fontData: Uint8Array, fontNumber = 0): Promise<FontInfo> {
    return await pyodideTTX.getFontInfo(fontData, fontNumber);
  }

  /**
   * Convert font binary to TTX XML format
   * Supports all FontTools options for complete feature parity
   */
  static async dumpToTTX(fontData: Uint8Array, options: TTXOptions = {}): Promise<string> {
    return await pyodideTTX.dumpToTTX(fontData, options);
  }

  /**
   * Compile TTX XML back to font binary
   */
  static async compileFromTTX(ttxContent: string, options: TTXOptions = {}): Promise<Uint8Array> {
    return await pyodideTTX.compileFromTTX(ttxContent, options);
  }

  /**
   * List all tables present in a font
   */
  static async listTables(fontData: Uint8Array, fontNumber = 0): Promise<string[]> {
    return await pyodideTTX.listTables(fontData, fontNumber);
  }
}

// Export the singleton for direct access if needed
export { pyodideTTX };

export default TTX;
