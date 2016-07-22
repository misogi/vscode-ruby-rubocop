
import * as vscode from 'vscode';
import { Rubocop } from './rubocop';
import { RubocopAutocorrect } from './rubocopAutocorrect';
export function activate(context: vscode.ExtensionContext): void {
    'use strict';

    const diag = vscode.languages.createDiagnosticCollection('ruby');
    context.subscriptions.push(diag);
    const rubocop = new Rubocop(diag);
    const rubocopAutocorrect = new RubocopAutocorrect(diag);

    const disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
        const document = vscode.window.activeTextEditor.document;
        rubocop.execute(document);
    });

    vscode.commands.registerCommand('ruby.rubocopAutocorrect', () => {
        const document = vscode.window.activeTextEditor.document;
        rubocopAutocorrect.execute(document);
    });

    context.subscriptions.push(disposable);

    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
        if (rubocop.isOnSave) {
            rubocop.execute(e);
        }
    });
}
