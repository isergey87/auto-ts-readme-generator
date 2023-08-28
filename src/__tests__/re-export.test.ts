import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation} from './__data__/arrow-function-export-documentation'

describe('re-export-test', () => {
  test('re-export-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\re-export.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
