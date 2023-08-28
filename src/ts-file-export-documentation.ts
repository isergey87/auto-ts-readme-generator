import ts, {__String, CompilerOptions} from 'typescript'

import {forEachVariableStatement} from './utils/for-each-variable-statement'
import {isNodeExported} from './utils/is-node-exported'

export interface DocEntry {
  name?: string
  documentation?: string
  type?: string
  constructors?: DocEntry[]
  parameters?: DocEntry[]
  calls?: DocEntry[]
  returnType?: string
}

export class TsFileExportDocumentation {
  private file: string
  private program: ts.Program
  private checker: ts.TypeChecker
  private allExports = new Map<__String, DocEntry>()
  private importRenames = new Map<__String, __String>()
  private documentation: DocEntry[] = []
  private exportSourceFiles: (ts.SourceFile | undefined)[] = []

  constructor(file: string, config: CompilerOptions) {
    this.file = file
    this.program = ts.createProgram([file], config)
    this.checker = this.program.getTypeChecker()
  }

  public extractDocumentation() {
    this.allExports.clear()
    this.importRenames.clear()
    this.exportSourceFiles = [this.program.getSourceFile(this.file)]
    this.documentation = []

    this.collectAllExports()
    this.getDocumentationFromExportPoints()
    return this.documentation
  }

  private collectAllExports() {
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        ts.forEachChild(sourceFile, (node) => {
          this.collectNodeExports(node)
        })
      }
    }
  }

  private getDocumentationFromExportPoints() {
    for (const sourceFile of this.exportSourceFiles) {
      if (sourceFile && !sourceFile.isDeclarationFile) {
        ts.forEachChild(sourceFile, (childNode) => {
          this.getNodeDocumentation(childNode)
        })
      }
    }
  }

  private collectNodeExports(node: ts.Node) {
    if (isNodeExported(node)) {
      if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name) {
        // This is a top level class, get its symbol
        this.addExport(node.name)
        // No need to walk any further, class expressions/inner declarations
        // cannot be exported
      } else if (ts.isModuleDeclaration(node)) {
        // This is a namespace, visit its children
        ts.forEachChild(node, (childNode) => this.collectNodeExports(childNode))
      } else if (ts.isVariableStatement(node)) {
        forEachVariableStatement(node, (childNode) => this.addExport(childNode.name))
      }
    }
  }

  private addExport(node: ts.Node) {
    const symbol = this.checker.getSymbolAtLocation(node)
    if (symbol) {
      this.allExports.set(symbol.getEscapedName(), this.serializeClass(symbol))
    }
  }

  private serializeClass(symbol: ts.Symbol) {
    const details = this.serializeSymbol(symbol)

    // Get the construct signatures
    const constructorType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
    details.constructors = constructorType
      .getConstructSignatures()
      .map((signature) => this.serializeSignature(signature))
    details.calls = constructorType
      .getCallSignatures()
      .map((signature) => this.serializeSignature(signature))
    return details
  }

  private serializeSignature(signature: ts.Signature) {
    return {
      parameters: signature.parameters.map((symbol) => this.serializeSymbol(symbol)),
      returnType: this.checker.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(signature.getDocumentationComment(this.checker)),
    }
  }

  private serializeSymbol(symbol: ts.Symbol): DocEntry {
    return {
      name: symbol.getName(),
      documentation: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
      type: this.checker.typeToString(
        this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!),
      ),
    }
  }

  private getNodeDocumentation(node: ts.Node) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause) {
        this.parseExportDeclaration(node.exportClause)
      } else if (node.moduleSpecifier) {
        const symbol = this.checker.getSymbolAtLocation(node.moduleSpecifier)
        this.exportSourceFiles.push(...((symbol?.getDeclarations() || []) as ts.SourceFile[]))
      }
    } else if (ts.isImportDeclaration(node)) {
      this.parseImportDeclaration(node.importClause)
    } else if (isNodeExported(node)) {
      if (ts.isModuleDeclaration(node)) {
        // This is a namespace, visit its children
        ts.forEachChild(node, (childNode) => {
          this.getNodeDocumentation(childNode)
        })
      } else if (ts.isVariableStatement(node)) {
        forEachVariableStatement(node, (childNode) => this.addNodeDeclaration(childNode.name))
      } else if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name) {
        this.addNodeDeclaration(node.name)
      }
    }
  }

  private parseExportDeclaration(parentNode: ts.Node) {
    ts.forEachChild(parentNode, (node) => {
      if (ts.isExportSpecifier(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name)
        let declaration
        //was renamed
        if (node.propertyName) {
          const originalSymbol = this.checker.getSymbolAtLocation(node.propertyName)
          declaration = this.findSymbolDeclaration(originalSymbol)
        } else {
          declaration = this.findSymbolDeclaration(symbol)
        }
        if (declaration) {
          declaration.name = symbol?.getName() || ''
          this.documentation.push(declaration)
        }
      }
    })
  }

  private findSymbolDeclaration(symbol: ts.Symbol | undefined) {
    if (!symbol) {
      return
    }
    let searchName: __String | undefined = symbol.getEscapedName()
    if (this.importRenames.has(searchName)) {
      searchName = this.importRenames.get(searchName)!
    }
    return this.allExports.get(searchName)
  }

  private addNodeDeclaration(node: ts.Node) {
    const symbol = this.checker.getSymbolAtLocation(node)
    const declaration = this.findSymbolDeclaration(symbol)
    if (declaration) {
      this.documentation.push(declaration)
    }
  }

  private parseImportDeclaration(parentNode: ts.Node | undefined) {
    if (!parentNode) {
      return
    }
    ts.forEachChild(parentNode, (importNode) => {
      if (ts.isNamedImports(importNode)) {
        ts.forEachChild(importNode, (node) => {
          if (ts.isImportSpecifier(node) && node.name && node.propertyName) {
            const fileSymbol = this.checker.getSymbolAtLocation(node.name)
            //was renamed
            const originalSymbol = this.checker.getSymbolAtLocation(node.propertyName)
            if (fileSymbol && originalSymbol) {
              this.importRenames.set(fileSymbol.getEscapedName(), originalSymbol.getEscapedName())
            }
          }
        })
      }
    })
  }
}
