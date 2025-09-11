/**
 * Universal TTX intexport interface TTXOptions {
  tables?: string[];
  skipTables?: string[];
  splitTables?: boolean;
  splitGlyphs?: boolean;
  disassembleInstructions?: boolean;
  fontNumber?: number;
  flavor?: string;
  recalcBBoxes?: boolean;       // Control bounding box recalculation
  recalcTimestamp?: boolean;    // Control timestamp recalculation
  // Note: recalcMasterChecksum is not supported by FontTools TTFont.save()
}works in both browser and Node.js environments
 * Automatically selects the appropriate backend based on runtime detection
 */
import { type RuntimeConfig, type RuntimeEnvironment } from './runtime';
export interface TTXOptions {
    tables?: string[];
    skipTables?: string[];
    splitTables?: boolean;
    splitGlyphs?: boolean;
    disassembleInstructions?: boolean;
    fontNumber?: number;
    flavor?: string;
    recalcBBoxes?: boolean;
    recalcTimestamp?: boolean;
    recalcMasterChecksum?: boolean;
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
export declare class TTX {
    private static backend;
    private static runtime;
    private static config;
    /**
     * Initialize TTX with optional configuration
     * @param config Runtime-specific configuration
     */
    static initialize(config?: Partial<RuntimeConfig>): Promise<void>;
    /**
     * Check if TTX is initialized and ready to use
     */
    static isInitialized(): boolean;
    /**
     * Get the current runtime environment
     */
    static getRuntime(): RuntimeEnvironment | null;
    /**
     * Get the current configuration
     */
    static getConfig(): RuntimeConfig | null;
    /**
     * Detect the format of a font file
     * @param fontData Font file data as Uint8Array or ArrayBuffer
     * @returns Font format string (TTF, OTF, WOFF, WOFF2, TTC, TTX, UNKNOWN)
     */
    static detectFormat(fontData: Uint8Array | ArrayBuffer): Promise<string>;
    /**
     * Get comprehensive information about a font
     * @param fontData Font file data
     * @param fontNumber Font number for font collections (default: 0)
     * @returns Font information object
     */
    static getFontInfo(fontData: Uint8Array | ArrayBuffer, fontNumber?: number): Promise<FontInfo>;
    /**
     * Convert a font file to TTX (XML) format
     * @param fontData Font file data
     * @param options Conversion options
     * @returns TTX content as string
     */
    static dumpToTTX(fontData: Uint8Array | ArrayBuffer, options?: TTXOptions): Promise<string>;
    /**
     * Convert TTX (XML) back to a font file
     * @param ttxContent TTX content as string
     * @param options Compilation options
     * @returns Font data as ArrayBuffer
     */
    static compileFromTTX(ttxContent: string, options?: TTXOptions): Promise<ArrayBuffer>;
    /**
     * Validate a font file by performing basic checks
     * @param fontData Font file data
     * @returns Validation results
     */
    static validateFont(fontData: Uint8Array | ArrayBuffer): Promise<{
        isValid: boolean;
        format: string;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Perform a round-trip test: Font → TTX → Font → TTX
     * @param fontData Original font data
     * @param options TTX options for conversion
     * @returns Round-trip test results
     */
    static roundTripTest(fontData: Uint8Array | ArrayBuffer, options?: TTXOptions): Promise<{
        success: boolean;
        similarity: number;
        differences: Array<{
            lineNumber: number;
            original: string;
            modified: string;
        }>;
        steps: {
            originalFormat: string;
            ttx1Length: number;
            font2Size: number;
            ttx2Length: number;
        };
    }>;
    /**
     * Compare two TTX content strings and calculate similarity
     * @param content1 First TTX content
     * @param content2 Second TTX content
     * @returns Comparison results
     */
    static compareTTXContent(content1: string, content2: string): {
        similarity: number;
        differences: Array<{
            lineNumber: number;
            original: string;
            modified: string;
        }>;
    };
}
//# sourceMappingURL=universal-ttx.d.ts.map