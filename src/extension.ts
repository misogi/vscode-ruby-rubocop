// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'; 
import cp = require('child_process');
import { RubocopOutput } from './rubocopOutput'

let diag: vscode.DiagnosticCollection;


function severity(sev: string) {
	switch (sev) {
		// refactor, convention, warning, error and fatal.
		case "refactor": return vscode.DiagnosticSeverity.Hint;
		case "convention": return vscode.DiagnosticSeverity.Information;
		case "warning": return vscode.DiagnosticSeverity.Warning;
		case "error": return vscode.DiagnosticSeverity.Error;
		case "fatal": return vscode.DiagnosticSeverity.Error;
		default: return vscode.DiagnosticSeverity.Error;
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	diag = vscode.languages.createDiagnosticCollection('ruby');
	context.subscriptions.push(diag);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ruby-rubocop" is now active!'); 
	const path = 'D:/bin/Ruby22-x64/bin/';
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
		const fileName = vscode.window.activeTextEditor.document.fileName;
		// The code you place here will be executed every time your command is executed
		cp.execFile(path + 'rubocop.bat', [fileName, '--format', 'json'], {cwd: path}, (err, stdout, stderr) => {
			diag.clear();
			const rubocop: RubocopOutput = JSON.parse(stdout.toString());
			console.log(rubocop);
			console.log(stderr);
			console.log(err);
			vscode.window.showInformationMessage(`Hello World! ${fileName}`);
			
			let entries: [vscode.Uri, vscode.Diagnostic[]][] = [];
			rubocop.files.forEach((file) => {
				let diagnostics = [];
				const url = vscode.Uri.file(fileName);
				file.offenses.forEach((offence) => {
					const loc = offence.location;
					const range = new vscode.Range(
						loc.line - 1, loc.column - 1, loc.line - 1, loc.length + loc.column - 1);
					const sev = severity(offence.severity);
					const diagnostic = new vscode.Diagnostic(
						range, offence.message, sev);
					diagnostics.push(diagnostic);
				});
				entries.push([url, diagnostics]);
			});
			
			diag.set(entries);
		});
		
		// Display a message box to the user
	});
	
	context.subscriptions.push(disposable);
}
