import {getTsConfig} from './utils/get-ts-config'
import {tsExportDocumentation} from './ts-export-documentation'

export const generate = (
  files: (string | number)[],
  configPath: string,
  outputPath: string,
  section: string,
) => {
  try {
    const config = getTsConfig(configPath)
    let result = ''

    for (const file of files) {
      if (typeof file === 'string') {
        result += `## ${file}`
        const documentations = tsExportDocumentation(file, config)
        console.log(documentations)
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  }
}
