import * as vscode from 'vscode';
import * as cp from 'child_process';
import { RubocopOutput } from './rubocopOutput';

interface RubocopConfig {
	executePath: string;
	options: string[];
}

'use strict';
export class Rubocop {
	private config: vscode.WorkspaceConfiguration;
	private diag: vscode.DiagnosticCollection;
	private path: string;
	private command: string;

	constructor(diagnostics: vscode.DiagnosticCollection) {
		this.config = vscode.workspace.getConfiguration('ruby.rubocop');
		this.diag = diagnostics;
		this.path = this.config.get('executePath', '');
		if (process.platform === 'win32') {
			this.command = 'rubocop.bat';
		} else {
			this.command = 'rubocop';
		}
	}

	public execute(document: vscode.TextDocument): void {
		if (!this.path || 0 === this.path.length) {
			vscode.window.showErrorMessage('execute path is empty! please check ruby.rubocop.executePath config');
			return;
		}

		const fileName = document.fileName;

		cp.execFile(this.path + this.command, [fileName, '--format', 'json'], {cwd: this.path}, (err, stdout, stderr) => {
			this.diag.clear();
			const rubocop: RubocopOutput = JSON.parse(stdout.toString());
			console.log(stderr);

			let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
			rubocop.files.forEach((file) => {
				let diagnostics = [];
				const url = vscode.Uri.file(fileName);
				file.offenses.forEach((offence) => {
					const loc = offence.location;
					const range = new vscode.Range(
						loc.line - 1, loc.column - 1, loc.line - 1, loc.length + loc.column - 1);
					const sev = this.severity(offence.severity);
					const diagnostic = new vscode.Diagnostic(
						range, offence.message, sev);
					diagnostics.push(diagnostic);
				});
				entries.push([url, diagnostics]);
			});

			this.diag.set(entries);
		});
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