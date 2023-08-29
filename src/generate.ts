import fs from 'fs'
import path from 'path'

import {globSync} from 'glob'

import {getTsConfig} from './utils/get-ts-config'
import {DocEntry, TsFileExportDocumentation} from './ts-file-export-documentation'

const mdUnderDash = /_([^_]+)_/g
const commonsMdSymbols = /([\\`*#+\-!])/g
const tableMdSymbols = /([\\`*#+\-!|])/g
const commonEscapeMd = (src: string | undefined) => {
  if (src) {
    return src.replaceAll(commonsMdSymbols, '\\$1').replaceAll(mdUnderDash, '\\_$1\\_')
  }
  return ''
}

const tableEscapeMd = (src: string | undefined) => {
  if (src) {
    return src.replaceAll(tableMdSymbols, '\\$1')
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
      const link = commonEscapeMd(path.relative('.', file))
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
    result += `### ${commonEscapeMd(docEntry.name)}\n\n`
    if (docEntry.type) {
      result += `type: ${commonEscapeMd(docEntry.type)}\n\n`
    }
  }
  if (docEntry.documentation) {
    result += `${commonEscapeMd(docEntry.documentation)}\n\n`
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
    result += `#### Return\n\n${commonEscapeMd(docEntry.returnType)}`
  }
  return result
}

function generateTable(name: string) {
  return `#### ${name}:\n\n| name  |  type  | description |\n|-------|------|-------------|\n`
}

function docEntryToTable(docEntry: DocEntry): string {
  return `| **${tableEscapeMd(docEntry.name)}** | ${tableEscapeMd(docEntry.type)} | ${tableEscapeMd(
    docEntry.documentation,
  )} |`
}

function writeToOutput(result: string, outputPath: string, section: string) {
  if (!result) {
    return
  }
  const sectionName = `# ${section}`
  const commonResult = `${sectionName}\n${result}\n\n`
  const regexp = new RegExp(`(# ${section}.*[^#]# )|(# ${section}.*$)`, 'gs')
  let content = ''
  try {
    content = fs.readFileSync(outputPath, 'utf8')
  } catch (e) {
    /* empty */
  }
  if (!content) {
    fs.writeFileSync(outputPath, commonResult.trim())
  } else {
    if (regexp.test(content)) {
      content = content.replaceAll(regexp, commonResult)
    } else {
      content += `\n\n${commonResult}`
    }
    fs.writeFileSync(outputPath, content.trim())
  }
}
