import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {Documentation as ArrowDocumentation} from './__data__/arrow-function-export-documentation'
import {Documentation as ClassDocumentation} from './__data__/class-export-documentation'

describe('re-export-with-rename-test', () => {
  test('re-export-with-rename-test', () => {
    ClassDocumentation.name = 'ClassExportNew'
    ArrowDocumentation.name = 'c'

    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\re-export-with-rename.ts',
      {},
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([
      ArrowDocumentation,
      ClassDocumentation,
    ])
  })
})
