import * as vscode from 'vscode';
import { Rubocop, RubocopAutocorrectProvider } from './rubocop';
import { onDidChangeConfiguration } from './configuration';

// entry point of extension
export function activate(context: vscode.ExtensionContext): void {
  'use strict';

  const diag = vscode.languages.createDiagnosticCollection('ruby');
  context.subscriptions.push(diag);

  const rubocop = new Rubocop(diag);
  const disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
    const document = vscode.window.activeTextEditor.document;
    rubocop.execute(document);
  });

  context.subscriptions.push(disposable);

  const ws = vscode.workspace;

  ws.onDidChangeConfiguration(onDidChangeConfiguration(rubocop));

  ws.textDocuments.forEach((e: vscode.TextDocument) => {
    rubocop.execute(e);
  });

  ws.onDidOpenTextDocument((e: vscode.TextDocument) => {
    rubocop.execute(e);
  });

  ws.onDidSaveTextDocument((e: vscode.TextDocument) => {
    if (rubocop.isOnSave) {
      rubocop.execute(e);
    }
  });

  ws.onDidCloseTextDocument((e: vscode.TextDocument) => {
    rubocop.clear(e);
  });
  const formattingProvider = new RubocopAutocorrectProvider();
  vscode.languages.registerDocumentFormattingEditProvider(
    'ruby',
    formattingProvider
  );
  vscode.languages.registerDocumentFormattingEditProvider(
    'gemfile',
    formattingProvider
  );

  const autocorrectDisposable = vscode.commands.registerCommand('ruby.rubocop.autocorrect', () => {
    vscode.window.activeTextEditor.edit((editBuilder) => {
      const document = vscode.window.activeTextEditor.document;
      const edits = formattingProvider.provideDocumentFormattingEdits(document);
      // We only expect one edit from our formatting provider.
      if (edits.length === 1) {
        const edit = edits[0];
        editBuilder.replace(edit.range, edit.newText);
      }
      if (edits.length > 1) {
        throw new Error("Unexpected error: Rubocop document formatter returned multiple edits.");
      }
    });
  });
  context.subscriptions.push(autocorrectDisposable);
}
