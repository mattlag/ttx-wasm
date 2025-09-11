/**
 * TTX-WASM Node.js Entry Point
 * Optimized for Node.js environments using native Python FontTools
 */
export { TTX, type TTXOptions, type FontInfo } from './universal-ttx';
export { NodeTTX } from './node-ttx';
export { detectRuntime, isNode, type RuntimeConfig } from './runtime';
export declare const initializeNodeTTX: (pythonExecutable?: string) => Promise<typeof import("./universal-ttx").TTX>;
//# sourceMappingURL=index-node.d.ts.map