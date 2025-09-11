/**
 * Universal TTX interface that works in both browser and Node.js environments
 * Automatically selects the appropriate backend based on runtime detection
 */

import { detectRuntime, type RuntimeConfig, type RuntimeEnvironment } from './runtime';

// Import backends conditionally to avoid loading issues
let PyodideTTX: any;
let NodeTTX: any;

// Dynamic imports for different environments
const loadBackends = async () => {
  const runtime = detectRuntime();

  if (runtime === 'node') {
    const { NodeTTX: NodeTTXClass } = await import('./node-ttx');
    NodeTTX = NodeTTXClass;
  } else {
    const { PyodideTTX: PyodideTTXClass } = await import('./pyodide-ttx');
    PyodideTTX = PyodideTTXClass;
  }
};

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
 * Universal TTX class that automatically adapts to the runtime environment
 */
export class TTX {
  private static backend: any = null;
  private static runtime: RuntimeEnvironment | null = null;
  private static config: RuntimeConfig | null = null;

  /**
   * Initialize TTX with optional configuration
   * @param config Runtime-specific configuration
   */
  static async initialize(config?: Partial<RuntimeConfig>): Promise<void> {
    if (TTX.backend) return; // Already initialized

    await loadBackends();

    TTX.runtime = detectRuntime();
    TTX.config = {
      environment: TTX.runtime,
      pythonExecutable: 'python3',
      pyodideIndexURL: './pyodide/',
      tempDir: undefined,
      ...config,
    };

    if (TTX.runtime === 'node') {
      TTX.backend = new NodeTTX(TTX.config.pythonExecutable);
      console.log('🐍 TTX initialized with Node.js backend (native Python FontTools)');
    } else {
      TTX.backend = new PyodideTTX();
      console.log('🌐 TTX initialized with browser backend (Pyodide WebAssembly)');
    }

    await TTX.backend.initialize();
  }

  /**
   * Check if TTX is initialized and ready to use
   */
  static isInitialized(): boolean {
    return TTX.backend?.isInitialized() || false;
  }

  /**
   * Get the current runtime environment
   */
  static getRuntime(): RuntimeEnvironment | null {
    return TTX.runtime;
  }

  /**
   * Get the current configuration
   */
  static getConfig(): RuntimeConfig | null {
    return TTX.config;
  }

  /**
   * Detect the format of a font file
   * @param fontData Font file data as Uint8Array or ArrayBuffer
   * @returns Font format string (TTF, OTF, WOFF, WOFF2, TTC, TTX, UNKNOWN)
   */
  static async detectFormat(fontData: Uint8Array | ArrayBuffer): Promise<string> {
    if (!TTX.backend) {
      throw new Error('TTX not initialized. Call TTX.initialize() first.');
    }

    const data = fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData;
    return await TTX.backend.detectFormat(data);
  }

  /**
   * Get comprehensive information about a font
   * @param fontData Font file data
   * @param fontNumber Font number for font collections (default: 0)
   * @returns Font information object
   */
  static async getFontInfo(fontData: Uint8Array | ArrayBuffer, fontNumber = 0): Promise<FontInfo> {
    if (!TTX.backend) {
      throw new Error('TTX not initialized. Call TTX.initialize() first.');
    }

    const data = fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData;
    return await TTX.backend.getFontInfo(data, fontNumber);
  }

  /**
   * Convert a font file to TTX (XML) format
   * @param fontData Font file data
   * @param options Conversion options
   * @returns TTX content as string
   */
  static async dumpToTTX(
    fontData: Uint8Array | ArrayBuffer,
    options: TTXOptions = {}
  ): Promise<string> {
    if (!TTX.backend) {
      throw new Error('TTX not initialized. Call TTX.initialize() first.');
    }

    const data = fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData;
    return await TTX.backend.dumpToTTX(data, options);
  }

  /**
   * Convert TTX (XML) back to a font file
   * @param ttxContent TTX content as string
   * @param options Compilation options
   * @returns Font data as ArrayBuffer
   */
  static async compileFromTTX(ttxContent: string, options: TTXOptions = {}): Promise<ArrayBuffer> {
    if (!TTX.backend) {
      throw new Error('TTX not initialized. Call TTX.initialize() first.');
    }

    return await TTX.backend.compileFromTTX(ttxContent, options);
  }

  /**
   * Validate a font file by performing basic checks
   * @param fontData Font file data
   * @returns Validation results
   */
  static async validateFont(fontData: Uint8Array | ArrayBuffer): Promise<{
    isValid: boolean;
    format: string;
    errors: string[];
    warnings: string[];
  }> {
    const data = fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const format = await TTX.detectFormat(data);

      if (format === 'UNKNOWN') {
        errors.push('Unrecognized font format');
        return { isValid: false, format, errors, warnings };
      }

      // Try to get font info to validate structure
      const info = await TTX.getFontInfo(data);

      if (!info.tables || info.tables.length === 0) {
        errors.push('No font tables found');
      }

      // Basic validation checks
      if (!info.tables.includes('head')) {
        errors.push('Missing required "head" table');
      }

      if (!info.tables.includes('hhea')) {
        warnings.push('Missing "hhea" table (horizontal header)');
      }

      return {
        isValid: errors.length === 0,
        format,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push(`Validation failed: ${error.message}`);
      return {
        isValid: false,
        format: 'UNKNOWN',
        errors,
        warnings,
      };
    }
  }

  /**
   * Perform a round-trip test: Font → TTX → Font → TTX
   * @param fontData Original font data
   * @param options TTX options for conversion
   * @returns Round-trip test results
   */
  static async roundTripTest(
    fontData: Uint8Array | ArrayBuffer,
    options: TTXOptions = {}
  ): Promise<{
    success: boolean;
    similarity: number;
    differences: Array<{ lineNumber: number; original: string; modified: string }>;
    steps: {
      originalFormat: string;
      ttx1Length: number;
      font2Size: number;
      ttx2Length: number;
    };
  }> {
    const data = fontData instanceof ArrayBuffer ? new Uint8Array(fontData) : fontData;

    try {
      // Step 1: Font → TTX
      const originalFormat = await TTX.detectFormat(data);
      const ttx1 = await TTX.dumpToTTX(data, options);

      // Step 2: TTX → Font
      const font2 = await TTX.compileFromTTX(ttx1, options);

      // Step 3: Font → TTX
      const ttx2 = await TTX.dumpToTTX(new Uint8Array(font2), options);

      // Step 4: Compare TTX files
      const { similarity, differences } = TTX.compareTTXContent(ttx1, ttx2);

      return {
        success: similarity > 95, // Consider >95% similarity as success
        similarity,
        differences,
        steps: {
          originalFormat,
          ttx1Length: ttx1.length,
          font2Size: font2.byteLength,
          ttx2Length: ttx2.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        similarity: 0,
        differences: [{ lineNumber: 0, original: '', modified: `Error: ${error.message}` }],
        steps: {
          originalFormat: 'UNKNOWN',
          ttx1Length: 0,
          font2Size: 0,
          ttx2Length: 0,
        },
      };
    }
  }

  /**
   * Compare two TTX content strings and calculate similarity
   * @param content1 First TTX content
   * @param content2 Second TTX content
   * @returns Comparison results
   */
  static compareTTXContent(
    content1: string,
    content2: string
  ): {
    similarity: number;
    differences: Array<{ lineNumber: number; original: string; modified: string }>;
  } {
    const lines1 = content1.split('\n').map(line => line.trim());
    const lines2 = content2.split('\n').map(line => line.trim());

    const maxLines = Math.max(lines1.length, lines2.length);
    const differences: Array<{ lineNumber: number; original: string; modified: string }> = [];
    let matchingLines = 0;

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      // Skip lines that contain timestamps or other dynamic content
      const isDynamicLine = (line: string) => {
        return (
          line.includes('created=') ||
          line.includes('modified=') ||
          line.includes('checkSumAdjustment=') ||
          line.includes('<!--') ||
          line.startsWith('<?xml')
        );
      };

      if (isDynamicLine(line1) || isDynamicLine(line2)) {
        matchingLines++; // Consider dynamic lines as matching
        continue;
      }

      if (line1 === line2) {
        matchingLines++;
      } else {
        differences.push({
          lineNumber: i + 1,
          original: line1,
          modified: line2,
        });
      }
    }

    const similarity = maxLines > 0 ? (matchingLines / maxLines) * 100 : 0;

    return { similarity, differences };
  }
}
