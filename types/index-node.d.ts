/**
 * TTX-WASM Node.js Entry Point
 * Optimized for Node.js environments using native Python FontTools
 */
export { NodeTTX } from './node-ttx';
export { detectRuntime, isNode, type RuntimeConfig } from './runtime';
export { TTX, type FontInfo, type TTXOptions } from './universal-ttx';
export declare const initializeNodeTTX: (pythonExecutable?: string) => Promise<typeof import("./universal-ttx").TTX>;
//# sourceMappingURL=index-node.d.ts.map