import * as vscode from 'vscode';
import * as cp from 'child_process';
import { RubocopOutput, RubocopFile, RubocopOffense } from './rubocopOutput';
import * as path from 'path';
import * as fs from 'fs';
import {ChildProcess} from 'child_process';

interface RubocopConfig {
    executePath: string;
    configFilePath: string;
    options: string[];
}

export class Rubocop {
    private diag: vscode.DiagnosticCollection;
    private path: string;
    private command: string;
    private configPath: string;
    private onSave: boolean;

    constructor(diagnostics: vscode.DiagnosticCollection) {
        this.diag = diagnostics;
        this.command = (process.platform === 'win32') ? 'rubocop.bat' : 'rubocop';
        this.resetConfig();
    }

    public execute(document: vscode.TextDocument): ChildProcess {
        if (document.languageId !== 'ruby') {
            return;
        }

        this.resetConfig();
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
            let output: string = stdout.toString();
            let rubocop: RubocopOutput;
            try {
                rubocop = JSON.parse(output);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    let regex = /[\r\n \t]/g;
                    let message = output.replace(regex, ' ');
                    let errorMessage = `Error on parsing output (It might non-JSON output) : "${message}"`;
                    vscode.window.showWarningMessage(errorMessage);
                    return;
                }
            }

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
        return cp.execFile(executeFile, args, { cwd: currentPath }, onDidExec);
    }

    public get isOnSave(): boolean {
        return this.onSave;
    }

    // extract argument to an array
    protected commandArguments(fileName: string): Array<string> {
        let commandArguments = [fileName, '--format', 'json'];

        if (this.configPath !== '') {
            if (fs.existsSync(this.configPath)) {
                const config = ['--config', this.configPath];
                commandArguments = commandArguments.concat(config);
            } else {
                vscode.window.showWarningMessage(`${this.configPath} file does not exist. Ignoring...`);
            }
        }

        return commandArguments;
    }

    private resetConfig(): void {
        const conf = vscode.workspace.getConfiguration('ruby.rubocop');
        this.path = conf.get('executePath', '');
        // try to autodetect the path (if it's not specified explicitly)
        if (!this.path || 0 === this.path.length) {
            this.path = this.autodetectExecutePath();
        }
        this.configPath = conf.get('configFilePath', '');
        this.onSave = conf.get('onSave', true);
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

    private autodetectExecutePath(): string {
        const key: string = 'PATH';
        let paths = process.env[key];
        if (!paths) {
            return '';
        }

        let pathparts = paths.split(path.delimiter);
        for (let i = 0; i < pathparts.length; i++) {
            let binpath = path.join(pathparts[i], this.command);
            if (fs.existsSync(binpath)) {
                return pathparts[i] + path.sep;
            }
        }

        return '';
    }

}
