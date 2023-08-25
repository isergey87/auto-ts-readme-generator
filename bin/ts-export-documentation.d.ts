import { CompilerOptions } from 'typescript';
interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: string;
    constructors?: DocEntry[];
    parameters?: DocEntry[];
    returnType?: string;
}
export declare const tsExportDocumentation: (file: string, config: CompilerOptions) => DocEntry[];
export {};
