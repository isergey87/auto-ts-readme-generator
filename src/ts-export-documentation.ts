import path from 'path'

import ts, {__String, CompilerOptions} from 'typescript'

import {forEachVariableStatement} from './utils/for-each-variable-statement'
import {isNodeExported} from './utils/is-node-exported'

interface DocEntry {
  name?: string
  fileName?: string
  documentation?: string
  type?: string
  constructors?: DocEntry[]
  parameters?: DocEntry[]
  returnType?: string
}

export const tsExportDocumentation = (file: string, config: CompilerOptions): DocEntry[] => {
  const documentations: DocEntry[] = []
  const program = ts.createProgram([file], config)
  const allExports = new Map<__String, DocEntry>()
  const importRenames = new Map<__String, __String>()
  const exportPoints = [file]
  const checker = program.getTypeChecker()

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node) => {
        completeAllExports(node, allExports, checker)
      })
    }
  }

  for (const file of exportPoints) {
    const sourceFile = program.getSourceFile(file)
    if (sourceFile && !sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (childNode) => {
        documentFromExportPoint(
          childNode,
          allExports,
          importRenames,
          file,
          exportPoints,
          checker,
          documentations,
        )
      })
    }
  }

  return documentations
}

const completeAllExports = (
  node: ts.Node,
  allExports: Map<__String, DocEntry>,
  checker: ts.TypeChecker,
) => {
  if (!isNodeExported(node)) {
    return
  }

  if (ts.isClassDeclaration(node) && node.name) {
    // This is a top level class, get its symbol
    const symbol = checker.getSymbolAtLocation(node.name)
    if (symbol) {
      allExports.set(symbol.getEscapedName(), serializeClass(symbol, checker))
    }
    // No need to walk any further, class expressions/inner declarations
    // cannot be exported
  } else if (ts.isModuleDeclaration(node)) {
    // This is a namespace, visit its children
    ts.forEachChild(node, (childNode) => completeAllExports(childNode, allExports, checker))
  } else if (ts.isVariableStatement(node)) {
    forEachVariableStatement(node, (variableNode) => {
      const symbol = checker.getSymbolAtLocation(variableNode)
      if (symbol) {
        allExports.set(symbol.getEscapedName(), serializeClass(symbol, checker))
      }
    })
  }
}

/** Serialize a symbol into a json object */
const serializeSymbol = (symbol: ts.Symbol, checker: ts.TypeChecker): DocEntry => {
  return {
    name: symbol.getName(),
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)),
  }
}

const serializeClass = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const details = serializeSymbol(symbol, checker)

  // Get the construct signatures
  const constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
  details.constructors = constructorType
    .getConstructSignatures()
    .map((signature) => serializeSignature(signature, checker))
  return details
}

/** Serialize a signature (call or construct) */
const serializeSignature = (signature: ts.Signature, checker: ts.TypeChecker) => {
  return {
    parameters: signature.parameters.map((symbol) => serializeSymbol(symbol, checker)),
    returnType: checker.typeToString(signature.getReturnType()),
    documentation: ts.displayPartsToString(signature.getDocumentationComment(checker)),
  }
}

const documentFromExportPoint = (
  node: ts.Node,
  allExports: Map<__String, DocEntry>,
  importRenames: Map<__String, __String>,
  rootPath: string,
  exportPoints: string[],
  checker: ts.TypeChecker,
  documentations: DocEntry[],
) => {
  if (ts.isExportDeclaration(node)) {
    if (node.exportClause) {
      parseExportDeclaration(node.exportClause, allExports, importRenames, checker, documentations)
    } else if (node.moduleSpecifier) {
      exportPoints.push(path.resolve(rootPath, node.moduleSpecifier.getText()))
    }
  }
}

const findSymbolDeclaration = (
  symbol: ts.Symbol | undefined,
  allExports: Map<__String, DocEntry>,
  importRenames: Map<__String, __String>,
) => {
  if (!symbol) {
    return
  }
  let searchName: __String | undefined = symbol.getEscapedName()
  if (importRenames.has(searchName)) {
    searchName = importRenames.get(searchName)!
  }
  return allExports.get(searchName)
}

const parseExportDeclaration = (
  parentNode: ts.Node,
  allExports: Map<__String, DocEntry>,
  importRenames: Map<__String, __String>,
  checker: ts.TypeChecker,
  documentations: DocEntry[],
) => {
  ts.forEachChild(parentNode, (node) => {
    if (ts.isExportSpecifier(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name)
      let declaration
      //was renamed
      if (node.propertyName) {
        const originalSymbol = checker.getSymbolAtLocation(node.propertyName)
        declaration = findSymbolDeclaration(originalSymbol, allExports, importRenames)
      } else {
        declaration = findSymbolDeclaration(symbol, allExports, importRenames)
      }

      if (declaration) {
        declaration.name = symbol?.getName() || ''
        documentations.push(declaration)
      }
    }
  })
}
