import * as vscode from 'vscode';
import * as cp from 'child_process';
import { RubocopOutput } from './rubocopOutput';
import * as path from 'path';

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
	private onSave: boolean;

	constructor(diagnostics: vscode.DiagnosticCollection) {
		this.config = vscode.workspace.getConfiguration('ruby.rubocop');
		this.diag = diagnostics;
		this.path = this.config.get('executePath', '');
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
		cp.execFile(executeFile, [fileName, '--format', 'json'], {cwd: currentPath}, (error, stdout, stderr) => {
			if ((<any>error).code === 'ENOENT') {
				vscode.window.showWarningMessage(`${executeFile} is not executable`);
				return;
			}

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
					const message = `${offence.message} (${offence.severity}:${offence.cop_name})`;
					const diagnostic = new vscode.Diagnostic(
						range, message, sev);
					diagnostics.push(diagnostic);
				});
				entries.push([url, diagnostics]);
			});

			this.diag.set(entries);
		});
	}

	public get isOnSave(): boolean {
		return this.onSave;
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
