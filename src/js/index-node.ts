/**
 * TTX-WASM Node.js Entry Point
 * Optimized for Node.js environments using native Python FontTools
 */

export { NodeTTX } from './node-ttx';
export { detectRuntime, isNode, type RuntimeConfig } from './runtime';
export { TTX, type FontInfo, type TTXOptions } from './universal-ttx';

// Node.js specific initialization helper
export const initializeNodeTTX = async (pythonExecutable = 'python3') => {
  const { TTX } = await import('./universal-ttx');
  await TTX.initialize({ pythonExecutable });
  return TTX;
};
