import * as vscode from 'vscode';
import * as cp from 'child_process';
import { RubocopOutput, RubocopFile, RubocopOffense } from './rubocopOutput';
import * as path from 'path';

interface RubocopConfig {
    executePath: string;
    configFilePath: string;
    options: string[];
}

'use strict';
export class Rubocop {
    private config: vscode.WorkspaceConfiguration;
    private diag: vscode.DiagnosticCollection;
    private path: string;
    private command: string;
    private configPath: string;
    private onSave: boolean;

    constructor(diagnostics: vscode.DiagnosticCollection) {
        this.config = vscode.workspace.getConfiguration('ruby.rubocop');
        this.diag = diagnostics;
        this.path = this.config.get('executePath', '');
        this.configPath = this.config.get('configFilePath', undefined);
        this.command = (process.platform === 'win32') ? 'rubocop.bat' : 'rubocop';
        this.onSave = this.config.get('onSave', true);
    }

    public execute(document: vscode.TextDocument): void {
        if (document.languageId !== 'ruby') {
            return;
        }

        if (!this.path || 0 === this.path.length) {
            vscode.window.showWarningMessage('execute path is empty! please check ruby.rubocop.executePath config');
            return;
        }

        const fileName = document.fileName;
        let currentPath = vscode.workspace.rootPath;
        if (!currentPath) {
            currentPath = path.dirname(fileName);
        }

        const executeFile = this.path + this.command;

        let onDidExec = (error: Error, stdout: Buffer, stderr: Buffer) => {
            if (error && (<any>error).code === 'ENOENT') {
                vscode.window.showWarningMessage(`${executeFile} is not executable`);
                return;
            } else if (error && (<any>error).code === 127) {
                let errorMessage = stderr.toString();
                vscode.window.showWarningMessage(errorMessage);
                console.log(error.message);
                return;
            }

            this.diag.clear();
            let out = stdout.toString();
            const rubocop: RubocopOutput = JSON.parse(out || 'undefined');
            if (rubocop === undefined) {
                let errorMessage = stderr.toString();
                vscode.window.showWarningMessage(errorMessage);
                return;
            }

            let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
            rubocop.files.forEach((file: RubocopFile) => {
                let diagnostics = [];
                const url = vscode.Uri.file(fileName);
                file.offenses.forEach((offence: RubocopOffense) => {
                    const loc = offence.location;
                    const range = new vscode.Range(
                        loc.line - 1, loc.column - 1, loc.line - 1, loc.length + loc.column - 1);
                    const sev = this.severity(offence.severity);
                    const message = `${offence.message} (${offence.severity}:${offence.cop_name})`;
                    const diagnostic = new vscode.Diagnostic(
                        range, message, sev);
                    diagnostics.push(diagnostic);
                });
                entries.push([url, diagnostics]);
            });

            this.diag.set(entries);
        };

        let args = this.commandArguments(fileName);
        cp.execFile(executeFile, args, { cwd: currentPath }, onDidExec);
    }

    public get isOnSave(): boolean {
        return this.onSave;
    }

    // extract argument to array
    private commandArguments(fileName: string): Array<string> {
        let commandArguments = [fileName, '--format', 'json'];

        if (this.configPath !== undefined) {
            if (this.configPath.length === 0) {
                let message = 'Config setting has been specified with an empty value. ';
                message += 'Please, use a correct configuration filepath';

                vscode.window.showErrorMessage(message);
                return;
            } else {
                commandArguments.push('--config') && commandArguments.push(this.configPath);
            }
        }

        return commandArguments;
    }

    private severity(sev: string): vscode.DiagnosticSeverity {
        switch (sev) {
            case 'refactor': return vscode.DiagnosticSeverity.Hint;
            case 'convention': return vscode.DiagnosticSeverity.Information;
            case 'warning': return vscode.DiagnosticSeverity.Warning;
            case 'error': return vscode.DiagnosticSeverity.Error;
            case 'fatal': return vscode.DiagnosticSeverity.Error;
            default: return vscode.DiagnosticSeverity.Error;
        }
    }
}
