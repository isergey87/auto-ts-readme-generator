#!/usr/bin/env node
'use strict';

var yargs = require('yargs/yargs');
var fs = require('fs');
var ts = require('typescript');
var path = require('path');

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (!it) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      var F = function () {};
      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function () {
      it = it.call(o);
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

var parseModuleResolution = function parseModuleResolution(options) {
  if (options != null && 'moduleResolution' in options) {
    switch (options.moduleResolution) {
      case 'classic':
        {
          options.moduleResolution = ts.ModuleResolutionKind.Classic;
          break;
        }
      case 'node':
        {
          options.moduleResolution = ts.ModuleResolutionKind.Node10;
          break;
        }
      case 'node16':
        {
          options.moduleResolution = ts.ModuleResolutionKind.Node16;
          break;
        }
      case 'nodenext':
        {
          options.moduleResolution = ts.ModuleResolutionKind.NodeNext;
          break;
        }
      case 'bundler':
        {
          options.moduleResolution = ts.ModuleResolutionKind.Bundler;
          break;
        }
      default:
        {
          options.moduleResolution = undefined;
        }
    }
  }
};

var getTsConfig = function getTsConfig(configPath) {
  var _ts$readConfigFile = ts.readConfigFile(configPath, function (file) {
      return fs.readFileSync(file).toString();
    }),
    config = _ts$readConfigFile.config,
    error = _ts$readConfigFile.error;
  if (error) {
    throw error;
  }
  parseModuleResolution(config === null || config === void 0 ? void 0 : config.compilerOptions);
  return config === null || config === void 0 ? void 0 : config.compilerOptions;
};

var forEachVariableStatement = function forEachVariableStatement(node, callback) {
  ts.forEachChild(node, function (childNode) {
    ts.forEachChild(childNode, callback);
  });
};

var isNodeExported = function isNodeExported(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
};

var tsExportDocumentation = function tsExportDocumentation(file, config) {
  var documentations = [];
  var program = ts.createProgram([file], config);
  var allExports = new Map();
  var importRenames = new Map();
  var exportPoints = [file];
  var checker = program.getTypeChecker();
  var _iterator = _createForOfIteratorHelper(program.getSourceFiles()),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var sourceFile = _step.value;
      if (!sourceFile.isDeclarationFile) {
        ts.forEachChild(sourceFile, function (node) {
          completeAllExports(node, allExports, checker);
        });
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var _loop = function _loop() {
    var file = _exportPoints[_i];
    var sourceFile = program.getSourceFile(file);
    if (sourceFile && !sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, function (childNode) {
        documentFromExportPoint(childNode, allExports, importRenames, file, exportPoints, checker, documentations);
      });
    }
  };
  for (var _i = 0, _exportPoints = exportPoints; _i < _exportPoints.length; _i++) {
    _loop();
  }
  return documentations;
};
var completeAllExports = function completeAllExports(node, allExports, checker) {
  if (!isNodeExported(node)) {
    return;
  }
  if (ts.isClassDeclaration(node) && node.name) {
    // This is a top level class, get its symbol
    var symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
      allExports.set(symbol.getEscapedName(), serializeClass(symbol, checker));
    }
    // No need to walk any further, class expressions/inner declarations
    // cannot be exported
  } else if (ts.isModuleDeclaration(node)) {
    // This is a namespace, visit its children
    ts.forEachChild(node, function (childNode) {
      return completeAllExports(childNode, allExports, checker);
    });
  } else if (ts.isVariableStatement(node)) {
    forEachVariableStatement(node, function (variableNode) {
      var symbol = checker.getSymbolAtLocation(variableNode);
      if (symbol) {
        allExports.set(symbol.getEscapedName(), serializeClass(symbol, checker));
      }
    });
  }
};
/** Serialize a symbol into a json object */
var serializeSymbol = function serializeSymbol(symbol, checker) {
  return {
    name: symbol.getName(),
    documentation: ts.displayPartsToString(symbol.getDocumentationComment(checker)),
    type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
  };
};
var serializeClass = function serializeClass(symbol, checker) {
  var details = serializeSymbol(symbol, checker);
  // Get the construct signatures
  var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
  details.constructors = constructorType.getConstructSignatures().map(function (signature) {
    return serializeSignature(signature, checker);
  });
  return details;
};
/** Serialize a signature (call or construct) */
var serializeSignature = function serializeSignature(signature, checker) {
  return {
    parameters: signature.parameters.map(function (symbol) {
      return serializeSymbol(symbol, checker);
    }),
    returnType: checker.typeToString(signature.getReturnType()),
    documentation: ts.displayPartsToString(signature.getDocumentationComment(checker))
  };
};
var documentFromExportPoint = function documentFromExportPoint(node, allExports, importRenames, rootPath, exportPoints, checker, documentations) {
  if (ts.isExportDeclaration(node)) {
    if (node.exportClause) {
      parseExportDeclaration(node.exportClause, allExports, importRenames, checker, documentations);
    } else if (node.moduleSpecifier) {
      exportPoints.push(path.resolve(rootPath, node.moduleSpecifier.getText()));
    }
  }
};
var findSymbolDeclaration = function findSymbolDeclaration(symbol, allExports, importRenames) {
  if (!symbol) {
    return;
  }
  var searchName = symbol.getEscapedName();
  if (importRenames.has(searchName)) {
    searchName = importRenames.get(searchName);
  }
  return allExports.get(searchName);
};
var parseExportDeclaration = function parseExportDeclaration(parentNode, allExports, importRenames, checker, documentations) {
  ts.forEachChild(parentNode, function (node) {
    if (ts.isExportSpecifier(node) && node.name) {
      var symbol = checker.getSymbolAtLocation(node.name);
      var declaration;
      //was renamed
      if (node.propertyName) {
        var originalSymbol = checker.getSymbolAtLocation(node.propertyName);
        declaration = findSymbolDeclaration(originalSymbol, allExports, importRenames);
      } else {
        declaration = findSymbolDeclaration(symbol, allExports, importRenames);
      }
      if (declaration) {
        declaration.name = (symbol === null || symbol === void 0 ? void 0 : symbol.getName()) || '';
        documentations.push(declaration);
      }
    }
  });
};

var generate = function generate(files, configPath, outputPath, section) {
  try {
    var config = getTsConfig(configPath);
    var result = '';
    var _iterator = _createForOfIteratorHelper(files),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var file = _step.value;
        if (typeof file === 'string') {
          result += "## ".concat(file);
          var documentations = tsExportDocumentation(file, config);
          console.log(documentations);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
};

var args = yargs(process.argv.slice(2)).options({
  f: {
    type: 'array',
    alias: 'files',
    demandOption: true,
    desc: 'list of input files. use glob. e.g.\n-f src/**/index.ts src/**/lib.ts'
  },
  c: {
    type: 'string',
    alias: 'ts-config-path',
    demandOption: true,
    desc: 'path to the tsconfig.json'
  },
  o: {
    type: 'string',
    alias: 'output',
    "default": 'README.md',
    desc: 'path to the output file'
  },
  s: {
    type: 'string',
    alias: 'section',
    "default": 'Auto generated description',
    desc: 'name ot created / replaced section; Will be replaced all between  `# [section] .... # `'
  }
}).requiresArg('f').parseSync();
generate(args['f'], args['c'], args['o'], args['s']);
