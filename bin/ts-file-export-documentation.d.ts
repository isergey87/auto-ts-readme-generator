import { CompilerOptions } from 'typescript';
export interface DocEntry {
    name?: string;
    documentation?: string;
    type?: string;
    constructors?: DocEntry[];
    parameters?: DocEntry[];
    calls?: DocEntry[];
    returnType?: string;
}
export declare class TsFileExportDocumentation {
    private file;
    private program;
    private checker;
    private allExports;
    private importRenames;
    private documentation;
    private exportSourceFiles;
    constructor(file: string, config: CompilerOptions);
    extractDocumentation(): DocEntry[];
    private collectAllExports;
    private getDocumentationFromExportPoints;
    private collectNodeExports;
    private addExport;
    private serializeClass;
    private serializeSignature;
    private serializeSymbol;
    private getNodeDocumentation;
    private parseExportDeclaration;
    private findSymbolDeclaration;
    private addNodeDeclaration;
    private parseImportDeclaration;
}
