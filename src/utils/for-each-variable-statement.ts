import ts from 'typescript'
export const forEachVariableStatement = (
  node: ts.VariableStatement,
  callback: (node: ts.VariableDeclaration) => void,
) => {
  ts.forEachChild(node.declarationList, (childNode) => {
    if (ts.isVariableDeclaration(childNode)) {
      callback(childNode)
    }
  })
}
