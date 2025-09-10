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
export declare class TTX {
    /**
     * Initialize the TTX processor (loads Pyodide and FontTools)
     */
    static initialize(): Promise<void>;
    /**
     * Check if TTX is initialized and ready to use
     */
    static isInitialized(): boolean;
    /**
     * Detect the format of a font file
     */
    static detectFormat(fontData: Uint8Array): Promise<string>;
    /**
     * Get comprehensive information about a font
     */
    static getFontInfo(fontData: Uint8Array, fontNumber?: number): Promise<FontInfo>;
    /**
     * Convert font binary to TTX XML format
     * Supports all FontTools options for complete feature parity
     */
    static dumpToTTX(fontData: Uint8Array, options?: TTXOptions): Promise<string>;
    /**
     * Compile TTX XML back to font binary
     */
    static compileFromTTX(ttxContent: string, options?: TTXOptions): Promise<Uint8Array>;
    /**
     * List all tables present in a font
     */
    static listTables(fontData: Uint8Array, fontNumber?: number): Promise<string[]>;
}
export { pyodideTTX };
export default TTX;
//# sourceMappingURL=index-clean.d.ts.map