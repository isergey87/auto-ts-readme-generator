import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation} from './__data__/arrow-function-export-documentation'

describe('export-all-test', () => {
  test('export-all-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\export-all.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
