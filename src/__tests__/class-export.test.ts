import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation} from './__data__/class-export-documentation'

describe('class-export-test', () => {
  test('class-export-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\class-export.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
