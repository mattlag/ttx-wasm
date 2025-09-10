/**
 * Pyodide-based TTX implementation using Python FontTools
 * Provides 100% feature parity with Python FontTools TTX
 */
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
export declare class PyodideTTX {
    private pyodide;
    private initialized;
    initialize(): Promise<void>;
    detectFormat(fontData: Uint8Array): Promise<string>;
    getFontInfo(fontData: Uint8Array, fontNumber?: number): Promise<FontInfo>;
    dumpToTTX(fontData: Uint8Array, options?: TTXOptions): Promise<string>;
    compileFromTTX(ttxContent: string, options?: TTXOptions): Promise<Uint8Array>;
    listTables(fontData: Uint8Array, fontNumber?: number): Promise<string[]>;
    isInitialized(): boolean;
}
export declare const pyodideTTX: PyodideTTX;
//# sourceMappingURL=pyodide-ttx.d.ts.map