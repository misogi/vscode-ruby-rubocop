import * as vscode from 'vscode';
import { Rubocop } from './rubocop';
export function activate(context: vscode.ExtensionContext) {
	'use strict';

	const diag = vscode.languages.createDiagnosticCollection('ruby');
	context.subscriptions.push(diag);
	const rubocop = new Rubocop(diag);

	const disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
		const document = vscode.window.activeTextEditor.document;
		rubocop.execute(document);
	});

	context.subscriptions.push(disposable);

	vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
		rubocop.execute(e);
	});
}
