/**
 * Runtime detection and adapter pattern for TTX-WASM
 * Supports both browser (Pyodide/WASM) and Node.js (native Python/subprocess) environments
 */
export declare const isNode: () => boolean;
export declare const isBrowser: () => boolean;
export declare const isWorker: () => boolean;
export type RuntimeEnvironment = 'node' | 'browser' | 'worker';
export declare const detectRuntime: () => RuntimeEnvironment;
export interface RuntimeConfig {
    environment: RuntimeEnvironment;
    pythonExecutable?: string;
    pyodideIndexURL?: string;
    fontToolsPath?: string;
    tempDir?: string;
}
//# sourceMappingURL=runtime.d.ts.map