import {TsFileExportDocumentation} from '../ts-file-export-documentation'
import {getTsConfig} from '../utils/get-ts-config'
import {Documentation} from './__data__/function-export-documentation'

describe('function-export-test', () => {
  test('function-export-test', () => {
    const tsFileExportDocumentation = new TsFileExportDocumentation(
      '.\\src\\__tests__\\__data__\\function-export.ts',
      getTsConfig('./tsconfig.json'),
    )
    expect(tsFileExportDocumentation.extractDocumentation()).toEqual([Documentation])
  })
})
