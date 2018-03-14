import resolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'dist/index.js',
  },
  plugins: [
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      },
    }),
    buble()
  ],
  external: id => /(vue|lodash)/.test(id)
}