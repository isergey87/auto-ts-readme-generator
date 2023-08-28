import {DocEntry} from '../../ts-file-export-documentation'

export const Documentation: DocEntry = {
  constructors: [],
  documentation: 'function a - demo',
  name: 'a',
  type: '(b: string) => void',
  calls: [
    {
      documentation: 'function a - demo',
      parameters: [
        {
          documentation: '- param b',
          name: 'b',
          type: 'string',
        },
      ],
      returnType: 'void',
    },
  ],
}
