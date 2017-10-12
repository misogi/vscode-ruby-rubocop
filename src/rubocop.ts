import { RubocopOutput, RubocopFile, RubocopOffense } from './rubocopOutput';
import { TaskQueue, Task } from './taskQueue';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig, RubocopConfig } from './configuration';

function isFileUri(uri: vscode.Uri): boolean {
    return uri.scheme === 'file';
}

export default class Rubocop {
    public config: RubocopConfig;
    private diag: vscode.DiagnosticCollection;
    private additionalArguments: string[];
    private taskQueue: TaskQueue = new TaskQueue();

    constructor(
        diagnostics: vscode.DiagnosticCollection,
        additionalArguments: string[] = [],
    ) {
        this.diag = diagnostics;
        this.additionalArguments = additionalArguments;
        this.config = getConfig();
    }

    public execute(document: vscode.TextDocument, onComplete?: () => void): void {
        if (document.languageId !== 'ruby' || document.isUntitled || !isFileUri(document.uri)) {
            // git diff has ruby-mode. but it is Untitled file.
            return;
        }

        const fileName = document.fileName;
        const uri = document.uri;
        let currentPath = vscode.workspace.rootPath;
        if (!currentPath) {
            currentPath = path.dirname(fileName);
        }

        let onDidExec = (error: Error, stdout: string, stderr: string) => {
            if (this.hasError(error, stderr)) {
                return;
            }

            this.diag.delete(uri);
            let rubocop = this.parse(stdout);

            if (rubocop === undefined || rubocop === null) {
                return;
            }

            let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
            rubocop.files.forEach((file: RubocopFile) => {
                let diagnostics = [];
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
                entries.push([uri, diagnostics]);
            });

            this.diag.set(entries);
        };

        const args = this.commandArguments(fileName);

        let task = new Task(uri, token => {
            let process = this.executeRubocop(args, { cwd: currentPath }, (error, stdout, stderr) => {
                if (token.isCanceled) {
                    return;
                }
                onDidExec(error, stdout, stderr);
                token.finished();
                if (onComplete) {
                    onComplete();
                }
            });
            return () => process.kill();
        });
        this.taskQueue.enqueue(task);
    }

    public get isOnSave(): boolean {
        return this.config.onSave;
    }

    public clear(document: vscode.TextDocument): void {
        let uri = document.uri;
        if (isFileUri(uri)) {
            this.taskQueue.cancel(uri);
            this.diag.delete(uri);
        }
    }

    // extract argument to an array
    protected commandArguments(fileName: string): string[] {
        let commandArguments = [fileName, '--format', 'json', '--force-exclusion'];

        if (this.config.configFilePath !== '') {
            if (fs.existsSync(this.config.configFilePath)) {
                const config = ['--config', this.config.configFilePath];
                commandArguments = commandArguments.concat(config);
            } else {
                vscode.window.showWarningMessage(`${this.config.configFilePath} file does not exist. Ignoring...`);
            }
        }

        return commandArguments.concat(this.additionalArguments);
    }

    // execute rubocop
    private executeRubocop(
        args: string[],
        options: cp.ExecFileOptions,
        cb: (err: Error, stdout: string, stderr: string) => void): cp.ChildProcess {
        if (this.config.useBundler) {
            return cp.exec(`${this.config.command} ${args.join(' ')}`, options, cb);
        } else {
            return cp.execFile(this.config.command, args, options, cb);
        }
    }

    // parse rubocop(JSON) output
    private parse(output: string): RubocopOutput | null {
        let rubocop: RubocopOutput;
        if (output.length < 1) {
            let message = `command ${this.config.command} returns empty output! please check configuration.`;
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
            vscode.window.showWarningMessage(`${this.config.command} is not executable`);
            return true;
        } else if (error && (<any>error).code === 127) {
            vscode.window.showWarningMessage(stderr);
            return true;
        } else if (errorOutput.length > 0) {
            vscode.window.showErrorMessage(stderr);
            return true;
        }

        return false;
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
