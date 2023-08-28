import {DocEntry} from '../../ts-file-export-documentation'

export const Documentation: DocEntry = {
  constructors: [
    {
      documentation: '',
      parameters: [
        {
          documentation: '- param a',
          name: 'a',
          type: 'number',
        },
        {
          documentation: '- param b',
          name: 'b',
          type: 'string',
        },
      ],
      returnType: 'ClassExport',
    },
  ],
  documentation: 'ClassExport demo',
  name: 'ClassExport',
  type: 'typeof ClassExport',
  calls: [],
}
