/**
 * TTX-WASM: Universal FontTools TTX for JavaScript
 * Supports both browser (WebAssembly) and Node.js (native Python) environments
 */

export {
  detectRuntime,
  isBrowser,
  isNode,
  isWorker,
  type RuntimeConfig,
  type RuntimeEnvironment,
} from './runtime';
export { TTX, type FontInfo, type TTXOptions } from './universal-ttx';

// Legacy exports for backwards compatibility with v1.0.x
export { pyodideTTX } from './pyodide-ttx';

// Export individual backends for advanced use cases
export { NodeTTX } from './node-ttx';
export { PyodideTTX } from './pyodide-ttx';
