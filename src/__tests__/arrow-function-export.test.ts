import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation} from './__data__/arrow-function-export-documentation'

describe('arrow-function-export-test', () => {
  test('arrow-function-export-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\arrow-function-export.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
