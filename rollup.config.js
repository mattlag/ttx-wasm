import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

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
    }),
  ],
  external: ['fs', 'path'],
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
    },
  },
  {
    ...baseConfig,
    output: {
      file: 'dist/ttx-wasm.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  },
];
