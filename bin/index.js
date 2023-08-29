#!/usr/bin/env node
'use strict';

var yargs = require('yargs/yargs');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var ts = require('typescript');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
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
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
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
  ts.forEachChild(node.declarationList, function (childNode) {
    if (ts.isVariableDeclaration(childNode)) {
      callback(childNode);
    }
  });
};

var isNodeExported = function isNodeExported(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
};

var TsFileExportDocumentation = /*#__PURE__*/function () {
  function TsFileExportDocumentation(file, config) {
    _classCallCheck(this, TsFileExportDocumentation);
    this.allExports = new Map();
    this.importRenames = new Map();
    this.documentation = [];
    this.exportSourceFiles = [];
    this.file = file;
    this.program = ts.createProgram([file], config);
    this.checker = this.program.getTypeChecker();
  }
  _createClass(TsFileExportDocumentation, [{
    key: "extractDocumentation",
    value: function extractDocumentation() {
      this.allExports.clear();
      this.importRenames.clear();
      this.exportSourceFiles = [this.program.getSourceFile(this.file)];
      this.documentation = [];
      this.collectAllExports();
      this.getDocumentationFromExportPoints();
      return this.documentation;
    }
  }, {
    key: "collectAllExports",
    value: function collectAllExports() {
      var _this = this;
      var _iterator = _createForOfIteratorHelper(this.program.getSourceFiles()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var sourceFile = _step.value;
          if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, function (node) {
              _this.collectNodeExports(node);
            });
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "getDocumentationFromExportPoints",
    value: function getDocumentationFromExportPoints() {
      var _this2 = this;
      var _iterator2 = _createForOfIteratorHelper(this.exportSourceFiles),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var sourceFile = _step2.value;
          if (sourceFile && !sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, function (childNode) {
              _this2.getNodeDocumentation(childNode);
            });
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "collectNodeExports",
    value: function collectNodeExports(node) {
      var _this3 = this;
      if (isNodeExported(node)) {
        if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name) {
          // This is a top level class, get its symbol
          this.addExport(node.name);
          // No need to walk any further, class expressions/inner declarations
          // cannot be exported
        } else if (ts.isModuleDeclaration(node)) {
          // This is a namespace, visit its children
          ts.forEachChild(node, function (childNode) {
            return _this3.collectNodeExports(childNode);
          });
        } else if (ts.isVariableStatement(node)) {
          forEachVariableStatement(node, function (childNode) {
            return _this3.addExport(childNode.name);
          });
        }
      }
    }
  }, {
    key: "addExport",
    value: function addExport(node) {
      var symbol = this.checker.getSymbolAtLocation(node);
      if (symbol) {
        this.allExports.set(symbol.getEscapedName(), this.serializeClass(symbol));
      }
    }
  }, {
    key: "serializeClass",
    value: function serializeClass(symbol) {
      var _this4 = this;
      var details = this.serializeSymbol(symbol);
      // Get the construct signatures
      var constructorType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
      details.constructors = constructorType.getConstructSignatures().map(function (signature) {
        return _this4.serializeSignature(signature);
      });
      details.calls = constructorType.getCallSignatures().map(function (signature) {
        return _this4.serializeSignature(signature);
      });
      return details;
    }
  }, {
    key: "serializeSignature",
    value: function serializeSignature(signature) {
      var _this5 = this;
      return {
        parameters: signature.parameters.map(function (symbol) {
          return _this5.serializeSymbol(symbol);
        }),
        returnType: this.checker.typeToString(signature.getReturnType()),
        documentation: ts.displayPartsToString(signature.getDocumentationComment(this.checker))
      };
    }
  }, {
    key: "serializeSymbol",
    value: function serializeSymbol(symbol) {
      return {
        name: symbol.getName(),
        documentation: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
        type: this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
      };
    }
  }, {
    key: "getNodeDocumentation",
    value: function getNodeDocumentation(node) {
      var _this6 = this;
      if (ts.isExportDeclaration(node)) {
        if (node.exportClause) {
          this.parseExportDeclaration(node.exportClause);
        } else if (node.moduleSpecifier) {
          var _this$exportSourceFil;
          var symbol = this.checker.getSymbolAtLocation(node.moduleSpecifier);
          (_this$exportSourceFil = this.exportSourceFiles).push.apply(_this$exportSourceFil, _toConsumableArray((symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations()) || []));
        }
      } else if (ts.isImportDeclaration(node)) {
        this.parseImportDeclaration(node.importClause);
      } else if (isNodeExported(node)) {
        if (ts.isModuleDeclaration(node)) {
          // This is a namespace, visit its children
          ts.forEachChild(node, function (childNode) {
            _this6.getNodeDocumentation(childNode);
          });
        } else if (ts.isVariableStatement(node)) {
          forEachVariableStatement(node, function (childNode) {
            return _this6.addNodeDeclaration(childNode.name);
          });
        } else if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name) {
          this.addNodeDeclaration(node.name);
        }
      }
    }
  }, {
    key: "parseExportDeclaration",
    value: function parseExportDeclaration(parentNode) {
      var _this7 = this;
      ts.forEachChild(parentNode, function (node) {
        if (ts.isExportSpecifier(node) && node.name) {
          var symbol = _this7.checker.getSymbolAtLocation(node.name);
          var declaration;
          //was renamed
          if (node.propertyName) {
            var originalSymbol = _this7.checker.getSymbolAtLocation(node.propertyName);
            declaration = _this7.findSymbolDeclaration(originalSymbol);
          } else {
            declaration = _this7.findSymbolDeclaration(symbol);
          }
          if (declaration) {
            declaration.name = (symbol === null || symbol === void 0 ? void 0 : symbol.getName()) || '';
            _this7.documentation.push(declaration);
          }
        }
      });
    }
  }, {
    key: "findSymbolDeclaration",
    value: function findSymbolDeclaration(symbol) {
      if (!symbol) {
        return;
      }
      var searchName = symbol.getEscapedName();
      if (this.importRenames.has(searchName)) {
        searchName = this.importRenames.get(searchName);
      }
      return this.allExports.get(searchName);
    }
  }, {
    key: "addNodeDeclaration",
    value: function addNodeDeclaration(node) {
      var symbol = this.checker.getSymbolAtLocation(node);
      var declaration = this.findSymbolDeclaration(symbol);
      if (declaration) {
        this.documentation.push(declaration);
      }
    }
  }, {
    key: "parseImportDeclaration",
    value: function parseImportDeclaration(parentNode) {
      var _this8 = this;
      if (!parentNode) {
        return;
      }
      ts.forEachChild(parentNode, function (importNode) {
        if (ts.isNamedImports(importNode)) {
          ts.forEachChild(importNode, function (node) {
            if (ts.isImportSpecifier(node) && node.name && node.propertyName) {
              var fileSymbol = _this8.checker.getSymbolAtLocation(node.name);
              //was renamed
              var originalSymbol = _this8.checker.getSymbolAtLocation(node.propertyName);
              if (fileSymbol && originalSymbol) {
                _this8.importRenames.set(fileSymbol.getEscapedName(), originalSymbol.getEscapedName());
              }
            }
          });
        }
      });
    }
  }]);
  return TsFileExportDocumentation;
}();

var mdUnderDash = /_([^_]+)_/g;
var commonsMdSymbols = /([\\`*#+\-!])/g;
var tableMdSymbols = /([\\`*#+\-!|])/g;
var commonEscapeMd = function commonEscapeMd(src) {
  if (src) {
    return src.replaceAll(commonsMdSymbols, '\\$1').replaceAll(mdUnderDash, '\\_$1\\_');
  }
  return '';
};
var tableEscapeMd = function tableEscapeMd(src) {
  if (src) {
    return src.replaceAll(tableMdSymbols, '\\$1');
  }
  return '';
};
var generate = function generate(files, configPath, outputPath, section) {
  try {
    var config = getTsConfig(configPath);
    var result = '';
    var listOfFiles = glob.globSync(files.map(function (f) {
      return f.toString();
    }));
    var _iterator = _createForOfIteratorHelper(listOfFiles),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var file = _step.value;
        var link = commonEscapeMd(path.relative('.', file));
        var tsFileExport = new TsFileExportDocumentation(file, config);
        var documentations = tsFileExport.extractDocumentation();
        if (documentations.length) {
          result += "[".concat(link, "](").concat(link, ")\n\n");
          result += documentations.map(function (doc) {
            return docEntryToMd(doc);
          }).join('\n\n');
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    writeToOutput(result, outputPath, section);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('error', e);
  }
};
function docEntryToMd(docEntry) {
  var result = '';
  if (docEntry.name) {
    result += "### ".concat(commonEscapeMd(docEntry.name), "\n\n");
    if (docEntry.type) {
      result += "type: ".concat(commonEscapeMd(docEntry.type), "\n\n");
    }
  }
  if (docEntry.documentation) {
    result += "".concat(commonEscapeMd(docEntry.documentation), "\n\n");
  }
  if (docEntry.constructors && docEntry.constructors.length) {
    result += generateTable('Constructors');
    result += docEntry.constructors.map(function (doc) {
      return docEntryToTable(doc);
    }).join('\n');
    result += '\n\n';
  }
  if (docEntry.parameters && docEntry.parameters.length) {
    result += generateTable('Parameters');
    result += docEntry.parameters.map(function (doc) {
      return docEntryToTable(doc);
    }).join('\n');
    result += '\n\n';
  }
  if (docEntry.calls && docEntry.calls.length) {
    result += generateTable('Parameters');
    result += docEntry.calls.map(function (doc) {
      if (doc.parameters) {
        return doc.parameters.map(docEntryToTable).join('\n');
      }
      return '';
    }).join('\n');
    result += '\n\n';
  }
  if (docEntry.returnType) {
    result += "#### Return\n\n".concat(commonEscapeMd(docEntry.returnType));
  }
  return result;
}
function generateTable(name) {
  return "#### ".concat(name, ":\n\n| name  |  type  | description |\n|-------|------|-------------|\n");
}
function docEntryToTable(docEntry) {
  return "| **".concat(tableEscapeMd(docEntry.name), "** | ").concat(tableEscapeMd(docEntry.type), " | ").concat(tableEscapeMd(docEntry.documentation), " |");
}
function writeToOutput(result, outputPath, section) {
  if (!result) {
    return;
  }
  var sectionName = "# ".concat(section);
  var commonResult = "".concat(sectionName, "\n").concat(result, "\n\n");
  var regexp = new RegExp("(# ".concat(section, ".*[^#]# )|(# ").concat(section, ".*$)"), 'gs');
  var content = '';
  try {
    content = fs.readFileSync(outputPath, 'utf8');
  } catch (e) {
    /* empty */
  }
  if (!content) {
    fs.writeFileSync(outputPath, commonResult.trim());
  } else {
    if (regexp.test(content)) {
      content = content.replaceAll(regexp, commonResult);
    } else {
      content += "\n\n".concat(commonResult);
    }
    fs.writeFileSync(outputPath, content.trim());
  }
}

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
