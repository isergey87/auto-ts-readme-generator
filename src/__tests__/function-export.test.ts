import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation} from './__data__/function-export-documentation'

describe('function-export-test', () => {
  test('function-export-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\function-export.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
