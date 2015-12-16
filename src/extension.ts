import * as vscode from 'vscode';
import cp = require('child_process');
import { RubocopOutput } from './rubocopOutput'
import { Rubocop } from './rubocop'

export function activate(context: vscode.ExtensionContext) {

	const diag = vscode.languages.createDiagnosticCollection('ruby');
	context.subscriptions.push(diag);
	const rubocop = new Rubocop(diag);

	var disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
		const document = vscode.window.activeTextEditor.document;
		rubocop.execute(document);
	});

	context.subscriptions.push(disposable);
}
