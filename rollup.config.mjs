import babel from '@rollup/plugin-babel'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: {
    format: 'cjs',
    dir: 'bin',
    banner: '#!/usr/bin/env node'
  },
  external: [/^yargs/, 'typescript', 'fs', 'path'],
  plugins: [
    typescript({
      exclude: '**/__tests__/**/*',
    }),
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      include: ['src/**/*'],
      babelHelpers: 'bundled',
    }),
  ],
}
