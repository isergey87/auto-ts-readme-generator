import yargs from 'yargs/yargs'

import {generate} from './generate'

const args = yargs(process.argv.slice(2))
  .options({
    f: {
      type: 'array',
      alias: 'files',
      demandOption: true,
      desc: 'list of input files. use glob. e.g.\n-f src/**/index.ts src/**/lib.ts',
    },
    c: {
      type: 'string',
      alias: 'ts-config-path',
      demandOption: true,
      desc: 'path to the tsconfig.json',
    },
    o: {type: 'string', alias: 'output', default: 'README.md', desc: 'path to the output file'},
    s: {
      type: 'string',
      alias: 'section',
      default: 'Auto generated description',
      desc: 'name ot created / replaced section; Will be replaced all between  `# [section] .... # `',
    },
  })
  .requiresArg('f')
  .parseSync()

generate(args['f'], args['c'], args['o'], args['s'])
