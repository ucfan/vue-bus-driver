import resolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'

export default [{
  input: 'src/index.js',
  output: {
    name: 'VueBusDriver',
    format: 'umd',
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
}, {
  input: 'src/index.js',
  output: {
    name: 'VueBusDriver',
    format: 'es',
    file: 'dist/index.esm.js',
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
}]