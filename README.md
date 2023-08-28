# auto-ts-readme-generator
Generate description of TypeScript exports

note: Currently don't support several imports with same name

```
Options:
--help            Show help                                      [boolean]
--version         Show version number                            [boolean]
-f, --files           list of input files. use glob. e.g.
-f src/**/index.ts src/**/lib.ts      [array] [required]
-c, --ts-config-path  path to the tsconfig.json            [string] [required]
-o, --output          path to the output file  [string] [default: "README.md"]
-s, --section         name ot created / replaced section; Will be replaced all
between  `# [section] .... # `
[string] [default: "Auto generated description"]
```
