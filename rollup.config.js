import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

const baseConfig = {
  input: 'src/js/index.ts',
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'types',
      declarationMap: true,
    }),
    copy({
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
    }),
  ],
  external: [
    'fs',
    'path',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'node:url',
    'node:crypto',
    'node:vm',
    'node:child_process',
  ],
  // Inline dynamic imports to avoid multiple chunks
  preserveEntrySignatures: 'strict',
  treeshake: {
    moduleSideEffects: false,
  },
};

export default [
  {
    ...baseConfig,
    output: {
      file: 'dist/ttx-wasm.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
    },
  },
  {
    ...baseConfig,
    output: {
      file: 'dist/ttx-wasm.umd.js',
      format: 'umd',
      name: 'TTXWasm',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
    },
  },
  {
    ...baseConfig,
    output: {
      file: 'dist/ttx-wasm.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
      exports: 'named',
    },
  },
];
