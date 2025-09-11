import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

// Base configuration shared across builds
const basePlugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
];

const copyPyodideFiles = copy({
  targets: [
    {
      src: [
        'node_modules/pyodide/pyodide.asm.js',
        'node_modules/pyodide/pyodide.asm.wasm',
        'node_modules/pyodide/pyodide.mjs',
        'node_modules/pyodide/pyodide-lock.json',
        'node_modules/pyodide/python_stdlib.zip',
      ],
      dest: 'dist/pyodide',
    },
    {
      src: [
        'build-assets/python-wheels/micropip-0.10.1-py3-none-any.whl',
        'build-assets/python-wheels/fonttools-4.56.0-py3-none-any.whl',
        'build-assets/python-wheels/brotli-1.1.0-cp313-cp313-pyodide_2025_0_wasm32.whl',
      ],
      dest: 'dist/pyodide',
    },
  ],
});

const external = [
  'fs',
  'path',
  'child_process',
  'util',
  'os',
  'node:fs',
  'node:fs/promises',
  'node:path',
  'node:url',
  'node:crypto',
  'node:child_process',
  'node:os',
  'node:util',
];

// Browser-focused build (original, with Pyodide)
const browserConfig = {
  input: 'src/js/index.ts',
  output: [
    {
      file: 'dist/ttx-wasm.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/ttx-wasm.umd.js',
      format: 'umd',
      name: 'TTXWASM',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/ttx-wasm.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    ...basePlugins,
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'types',
      declarationMap: true,
    }),
    copyPyodideFiles,
  ],
  external,
};

// Universal build (auto-detects environment)
const universalConfig = {
  input: 'src/js/index-universal.ts',
  output: [
    {
      file: 'dist/ttx-wasm-universal.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/ttx-wasm-universal.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: true, // Prefer Node.js built-ins for universal build
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false, // Skip declarations for universal build to avoid conflicts
    }),
  ],
  external,
};

// Node.js optimized build
const nodeConfig = {
  input: 'src/js/index-node.ts',
  output: [
    {
      file: 'dist/ttx-wasm-node.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/ttx-wasm-node.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      browser: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false, // Skip declarations for Node build
    }),
  ],
  external,
};

export default [browserConfig, universalConfig, nodeConfig];
