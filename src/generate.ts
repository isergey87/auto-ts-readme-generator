import fs from 'fs'
import path from 'path'

import {globSync} from 'glob'
import {replaceInFileSync} from 'replace-in-file'

import {getTsConfig} from './utils/get-ts-config'
import {DocEntry, TsFileExportDocumentation} from './ts-file-export-documentation'

const mdSpecial = /([\\`*_{}[\]#+\-.!|])/g
const escapeMd = (src: string | undefined) => {
  if (src) {
    return src.replaceAll(mdSpecial, '\\$1')
  }
  return ''
}

export const generate = (
  files: (string | number)[],
  configPath: string,
  outputPath: string,
  section: string,
) => {
  try {
    const config = getTsConfig(configPath)
    let result = ''
    const listOfFiles = globSync(files.map((f) => f.toString()))

    for (const file of listOfFiles) {
      const link = escapeMd(path.relative('.', file))
      const tsFileExport = new TsFileExportDocumentation(file, config)
      const documentations = tsFileExport.extractDocumentation()
      if (documentations.length) {
        result += `[${link}](${link})\n\n`
        result += documentations.map((doc) => docEntryToMd(doc)).join('\n\n')
      }
    }
    writeToOutput(result, outputPath, section)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('error', e)
  }
}

function docEntryToMd(docEntry: DocEntry): string {
  let result = ''
  if (docEntry.name) {
    result += `### ${escapeMd(docEntry.name)}\n\n`
    if (docEntry.type) {
      result += `type: ${escapeMd(docEntry.type)}\n\n`
    }
  }
  if (docEntry.documentation) {
    result += `${escapeMd(docEntry.documentation)}\n\n`
  }
  if (docEntry.constructors && docEntry.constructors.length) {
    result += generateTable('Constructors')
    result += docEntry.constructors.map((doc) => docEntryToTable(doc)).join('\n')
    result += '\n\n'
  }
  if (docEntry.parameters && docEntry.parameters.length) {
    result += generateTable('Parameters')
    result += docEntry.parameters.map((doc) => docEntryToTable(doc)).join('\n')
    result += '\n\n'
  }
  if (docEntry.calls && docEntry.calls.length) {
    result += generateTable('Parameters')
    result += docEntry.calls
      .map((doc) => {
        if (doc.parameters) {
          return doc.parameters.map(docEntryToTable).join('\n')
        }
        return ''
      })
      .join('\n')
    result += '\n\n'
  }
  if (docEntry.returnType) {
    result += `#### Return\n\n${escapeMd(docEntry.returnType)}`
  }
  return result
}

function generateTable(name: string) {
  return `#### ${name}:\n\n| name  |  type  | description |\n|-------|------|-------------|\n`
}

function docEntryToTable(docEntry: DocEntry): string {
  return `| **${escapeMd(docEntry.name)}** | ${escapeMd(docEntry.type)} | ${escapeMd(
    docEntry.documentation,
  )} |`
}

function writeToOutput(result: string, outputPath: string, section: string) {
  if (!result) {
    return
  }
  const sectionName = `# ${section}`
  const commonResult = `${sectionName}\n${result}\n\n`
  const regexp = new RegExp(`(# ${section}.*# )|(# ${section}.*$)`, 'gs')
  const replaceResult = replaceInFileSync({
    files: outputPath,
    from: regexp,
    to: (str) => {
      if (str.endsWith('# ')) {
        return `${commonResult}\n# `
      } else {
        return commonResult
      }
    },
  })
  if (!replaceResult.length || !replaceResult[0].hasChanged) {
    let emptyFile = true
    try {
      const buffer = fs.readFileSync(outputPath)
      emptyFile = !buffer.length
    } catch (e) {
      /* empty */
    }
    fs.appendFileSync(outputPath, !emptyFile ? `\n\n${commonResult}` : commonResult)
  }
}
