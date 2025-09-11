/**
 * Runtime detection and adapter pattern for TTX-WASM
 * Supports both browser (Pyodide/WASM) and Node.js (native Python/subprocess) environments
 */

// Runtime detection
export const isNode = (): boolean => {
  return (
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  );
};

export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

export const isWorker = (): boolean => {
  try {
    return (
      typeof self !== 'undefined' &&
      typeof (self as any).importScripts === 'function' &&
      typeof window === 'undefined'
    );
  } catch {
    return false;
  }
};

export type RuntimeEnvironment = 'node' | 'browser' | 'worker';

export const detectRuntime = (): RuntimeEnvironment => {
  if (isNode()) return 'node';
  if (isWorker()) return 'worker';
  if (isBrowser()) return 'browser';
  throw new Error('Unsupported runtime environment');
};

// Configuration for different runtimes
export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  pythonExecutable?: string; // For Node.js
  pyodideIndexURL?: string; // For browser
  fontToolsPath?: string; // For Node.js with custom FontTools
  tempDir?: string; // For Node.js file operations
}
