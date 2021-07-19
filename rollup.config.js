import typescript from '@rollup/plugin-typescript';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
  input: 'src/index.ts',
  plugins: [typescript(), nodePolyfills()],
  output: {
    dir: './build',
    format: 'umd',
    name: 'heap',
  },
};
