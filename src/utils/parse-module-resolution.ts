import ts from 'typescript'

export const parseModuleResolution = (options: object | null | undefined) => {
  if (options != null && 'moduleResolution' in options) {
    switch (options.moduleResolution) {
      case 'classic': {
        options.moduleResolution = ts.ModuleResolutionKind.Classic
        break
      }
      case 'node': {
        options.moduleResolution = ts.ModuleResolutionKind.Node10
        break
      }
      case 'node16': {
        options.moduleResolution = ts.ModuleResolutionKind.Node16
        break
      }
      case 'nodenext': {
        options.moduleResolution = ts.ModuleResolutionKind.NodeNext
        break
      }
      case 'bundler': {
        options.moduleResolution = ts.ModuleResolutionKind.Bundler
        break
      }
      default: {
        options.moduleResolution = undefined
      }
    }
  }
}
