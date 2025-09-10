import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/js/index.ts',
  output: [
    {
      file: 'dist/ttx-wasm.esm.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/ttx-wasm.umd.js',
      format: 'umd',
      name: 'TTXWasm',
      sourcemap: true
    },
    {
      file: 'dist/ttx-wasm.cjs.js',
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ['fs', 'path']
};
