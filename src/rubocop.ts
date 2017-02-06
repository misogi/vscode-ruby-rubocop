import * as vscode from 'vscode';
import * as cp from 'child_process';
import { RubocopOutput, RubocopFile, RubocopOffense } from './rubocopOutput';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess } from 'child_process';

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

        let onDidExec = (error: Error, stdout: string, stderr: string) => {
            if (this.hasError(error, stderr)) {
                return;
            }

            this.diag.clear();
            let rubocop = this.parse(stdout);

            if (rubocop === undefined || rubocop === null) {
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

        const executeFile = this.path + this.command;
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

    // parse rubocop(JSON) output
    private parse(output: string): RubocopOutput | null {
        let rubocop: RubocopOutput;
        if (output.length < 1) {
            var message = `command ${this.path}${this.command} returns empty output! please check configuration.`;
            vscode.window.showWarningMessage(message);

            return null;
        }

        try {
            rubocop = JSON.parse(output);
        } catch (e) {
            if (e instanceof SyntaxError) {
                let regex = /[\r\n \t]/g;
                let message = output.replace(regex, ' ');
                let errorMessage = `Error on parsing output (It might non-JSON output) : "${message}"`;
                vscode.window.showWarningMessage(errorMessage);

                return null;
            }
        }

        return rubocop;
    }

    // checking rubocop output has error
    private hasError(error: Error, stderr: string): boolean {
        let errorOutput = stderr.toString();
        if (error && (<any>error).code === 'ENOENT') {
            vscode.window.showWarningMessage(`${this.path} + ${this.command} is not executable`);
            return true;
        } else if (error && (<any>error).code === 127) {
            vscode.window.showWarningMessage(stderr);
            console.log(error.message);
            return true;
        } else if (errorOutput.length > 0) {
            vscode.window.showErrorMessage(stderr);
            console.log(this.path + this.command);
            console.log(errorOutput);
            return true;
        }

        return false;
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
