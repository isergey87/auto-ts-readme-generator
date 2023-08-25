import ts from 'typescript'
export const forEachVariableStatement = (
  node: ts.VariableStatement,
  callback: (node: ts.Node) => void,
) => {
  ts.forEachChild(node, (childNode) => {
    ts.forEachChild(childNode, callback)
  })
}
