import { RubocopOutput, RubocopFile, RubocopOffense } from './rubocopOutput';
import { TaskQueue, Task } from './taskQueue';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig, RubocopConfig } from './configuration';
import { ExecFileException } from 'child_process';

export class RubocopAutocorrectProvider
  implements vscode.DocumentFormattingEditProvider
{
  public provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): vscode.TextEdit[] {
    const config = getConfig();
    try {
      const args = [
        ...getCommandArguments(document.fileName),
        '--auto-correct',
      ];
      const options = {
        cwd: getCurrentPath(document.uri),
        input: document.getText(),
      };
      let stdout;
      if (config.useBundler) {
        stdout = cp.execSync(`${config.command} ${args.join(' ')}`, options);
      } else {
        stdout = cp.execFileSync(config.command, args, options);
      }

      return this.onSuccess(document, stdout);
    } catch (e) {
      // if there are still some offences not fixed RuboCop will return status 1
      if (e.status !== 1) {
        vscode.window.showWarningMessage(
          'An error occurred during auto-correction'
        );
        console.log(e);
        return [];
      } else {
        return this.onSuccess(document, e.stdout);
      }
    }
  }

  // Output of auto-correction looks like this:
  //
  // {"metadata": ... {"offense_count":5,"target_file_count":1,"inspected_file_count":1}}====================
  // def a
  //   3
  // end
  //
  // So we need to parse out the actual auto-corrected ruby
  private onSuccess(document: vscode.TextDocument, stdout: Buffer) {
    const stringOut = stdout.toString();
    const autoCorrection = stringOut.match(
      /^.*\n====================(?:\n|\r\n)([.\s\S]*)/m
    );
    if (!autoCorrection) {
      throw new Error(`Error parsing auto-correction from CLI: ${stringOut}`);
    }
    return [
      new vscode.TextEdit(this.getFullRange(document), autoCorrection.pop()),
    ];
  }

  private getFullRange(document: vscode.TextDocument): vscode.Range {
    return new vscode.Range(
      new vscode.Position(0, 0),
      document.lineAt(document.lineCount - 1).range.end
    );
  }
}

function isFileUri(uri: vscode.Uri): boolean {
  return uri.scheme === 'file';
}

function getCurrentPath(fileUri: vscode.Uri): string {
  const wsfolder = vscode.workspace.getWorkspaceFolder(fileUri);
  return (wsfolder && wsfolder.uri.fsPath) || path.dirname(fileUri.fsPath);
}

// extract argument to an array
function getCommandArguments(fileName: string): string[] {
  let commandArguments = ['--stdin', fileName, '--force-exclusion'];
  const extensionConfig = getConfig();
  if (extensionConfig.useServer) {
    commandArguments = commandArguments.concat('--server');
  }
  if (extensionConfig.configFilePath !== '') {
    const found = [extensionConfig.configFilePath]
      .concat(
        (vscode.workspace.workspaceFolders || []).map((ws) =>
          path.join(ws.uri.path, extensionConfig.configFilePath)
        )
      )
      .filter((p: string) => fs.existsSync(p));

    if (found.length == 0) {
      vscode.window.showWarningMessage(
        `${extensionConfig.configFilePath} file does not exist. Ignoring...`
      );
    } else {
      if (found.length > 1) {
        vscode.window.showWarningMessage(
          `Found multiple files (${found}) will use ${found[0]}`
        );
      }
      const config = ['--config', found[0]];
      commandArguments = commandArguments.concat(config);
    }
  }

  return commandArguments;
}

export class Rubocop {
  public config: RubocopConfig;
  private diag: vscode.DiagnosticCollection;
  private additionalArguments: string[];
  private taskQueue: TaskQueue = new TaskQueue();

  constructor(
    diagnostics: vscode.DiagnosticCollection,
    additionalArguments: string[] = []
  ) {
    this.diag = diagnostics;
    this.additionalArguments = additionalArguments;
    this.config = getConfig();
  }

  public execute(document: vscode.TextDocument, onComplete?: () => void): void {
    if (
      (document.languageId !== 'gemfile' && document.languageId !== 'ruby') ||
      document.isUntitled ||
      !isFileUri(document.uri)
    ) {
      // git diff has ruby-mode. but it is Untitled file.
      return;
    }

    const fileName = document.fileName;
    const uri = document.uri;
    const currentPath = getCurrentPath(uri);

    const onDidExec = (error: Error, stdout: string, stderr: string) => {
      this.reportError(error, stderr);
      const rubocop = this.parse(stdout);
      if (rubocop === undefined || rubocop === null) {
        return;
      }

      this.diag.delete(uri);

      const entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
      rubocop.files.forEach((file: RubocopFile) => {
        const diagnostics = [];
        file.offenses.forEach((offence: RubocopOffense) => {
          const loc = offence.location;
          const range = new vscode.Range(
            loc.line - 1,
            loc.column - 1,
            loc.line - 1,
            loc.length + loc.column - 1
          );
          const sev = this.severity(offence.severity);
          const message = `${offence.message} (${offence.severity}:${offence.cop_name})`;
          const diagnostic = new vscode.Diagnostic(range, message, sev);
          diagnostics.push(diagnostic);
        });
        entries.push([uri, diagnostics]);
      });

      this.diag.set(entries);
    };

    const jsonOutputFormat = ['--format', 'json'];
    const args = getCommandArguments(fileName)
      .concat(this.additionalArguments)
      .concat(jsonOutputFormat);

    const task = new Task(uri, (token) => {
      const process = this.executeRubocop(
        args,
        document.getText(),
        { cwd: currentPath },
        (error, stdout, stderr) => {
          if (token.isCanceled) {
            return;
          }
          onDidExec(error, stdout, stderr);
          token.finished();
          if (onComplete) {
            onComplete();
          }
        }
      );
      return () => process.kill();
    });
    this.taskQueue.enqueue(task);
  }

  public get isOnSave(): boolean {
    return this.config.onSave;
  }

  public clear(document: vscode.TextDocument): void {
    const uri = document.uri;
    if (isFileUri(uri)) {
      this.taskQueue.cancel(uri);
      this.diag.delete(uri);
    }
  }

  public restart(): void {
    const folders = vscode.workspace.workspaceFolders;
    if (this.config.useServer && folders && folders.length) {
      cp.execSync(`${this.config.command} --restart-server`, {
        cwd: folders[0].uri.fsPath,
      });
    }
  }

  public stop(): void {
    const folders = vscode.workspace.workspaceFolders;
    if (this.config.useServer && folders && folders.length) {
      cp.execSync(`${this.config.command} --stop-server`, {
        cwd: folders[0].uri.fsPath,
      });
    }
  }

  // execute rubocop
  private executeRubocop(
    args: string[],
    fileContents: string,
    options: cp.ExecOptions,
    cb: (err: Error, stdout: string, stderr: string) => void
  ): cp.ChildProcess {
    let child;
    if (this.config.useBundler) {
      child = cp.exec(`${this.config.command} ${args.join(' ')}`, options, cb);
    } else {
      child = cp.execFile(this.config.command, args, options, cb);
    }
    child.stdin.write(fileContents);
    child.stdin.end();
    return child;
  }

  // parse rubocop(JSON) output
  private parse(output: string): RubocopOutput | null {
    let rubocop: RubocopOutput;
    if (output.length < 1) {
      const message = `command ${this.config.command} returns empty output! please check configuration.`;
      vscode.window.showWarningMessage(message);

      return null;
    }

    try {
      rubocop = JSON.parse(output);
    } catch (e) {
      if (e instanceof SyntaxError) {
        const regex = /[\r\n \t]/g;
        const message = output.replace(regex, ' ');
        const errorMessage = `Error on parsing output (It might non-JSON output) : "${message}"`;
        vscode.window.showWarningMessage(errorMessage);

        return null;
      }
    }

    return rubocop;
  }

  // checking rubocop output has error
  private reportError(error: ExecFileException, stderr: string): boolean {
    const errorOutput = stderr.toString();
    if (error && error.code === 'ENOENT') {
      vscode.window.showWarningMessage(
        `${this.config.command} is not executable`
      );
      return true;
    } else if (error && error.code === 127) {
      vscode.window.showWarningMessage(stderr);
      return true;
    } else if (errorOutput.length > 0 && !this.config.suppressRubocopWarnings) {
      vscode.window.showWarningMessage(stderr);
      return true;
    }

    return false;
  }

  private severity(sev: string): vscode.DiagnosticSeverity {
    switch (sev) {
      case 'refactor':
        return vscode.DiagnosticSeverity.Hint;
      case 'convention':
      case 'info':
        return vscode.DiagnosticSeverity.Information;
      case 'warning':
        return vscode.DiagnosticSeverity.Warning;
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'fatal':
        return vscode.DiagnosticSeverity.Error;
      default:
        return vscode.DiagnosticSeverity.Error;
    }
  }
}
