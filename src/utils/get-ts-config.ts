import fs from 'fs'

import ts from 'typescript'

import {parseModuleResolution} from './parse-module-resolution'

export const getTsConfig = (configPath: string) => {
  const {config, error} = ts.readConfigFile(configPath, (file) => fs.readFileSync(file).toString())

  if (error) {
    throw error
  }

  parseModuleResolution(config?.compilerOptions)

  return config?.compilerOptions
}
