/**
 * TTX-WASM: Universal FontTools TTX for JavaScript
 * Supports both browser (WebAssembly) and Node.js (native Python) environments
 */
export { detectRuntime, isBrowser, isNode, isWorker, type RuntimeConfig, type RuntimeEnvironment, } from './runtime';
export { TTX, type FontInfo, type TTXOptions } from './universal-ttx';
export { pyodideTTX } from './pyodide-ttx';
export { NodeTTX } from './node-ttx';
export { PyodideTTX } from './pyodide-ttx';
//# sourceMappingURL=index-universal.d.ts.map