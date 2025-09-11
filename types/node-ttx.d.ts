/**
 * Nodeexport interface TTXOptions {
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
}for TTX functionality using native Python FontTools
 * Provides the same API as the browser version but uses subprocess calls
 */
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
export declare class NodeTTX {
    private pythonExecutable;
    private initialized;
    private fontToolsAvailable;
    constructor(pythonExecutable?: string);
    initialize(): Promise<void>;
    isInitialized(): boolean;
    detectFormat(fontData: Uint8Array): Promise<string>;
    getFontInfo(fontData: Uint8Array, fontNumber?: number): Promise<FontInfo>;
    dumpToTTX(fontData: Uint8Array, options?: TTXOptions): Promise<string>;
    compileFromTTX(ttxContent: string, options?: TTXOptions): Promise<ArrayBuffer>;
}
//# sourceMappingURL=node-ttx.d.ts.map