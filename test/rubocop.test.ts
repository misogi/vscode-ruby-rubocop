import { expect } from 'chai';
import * as vscode from 'vscode';
import Rubocop from '../src/rubocop';

describe('Rubocop', () => {
  let instance: Rubocop;
  let diagnostics: vscode.DiagnosticCollection;

  beforeEach(() => {
    diagnostics = vscode.languages.createDiagnosticCollection();
    instance = new Rubocop(diagnostics);
  });

  describe('initialization', () => {
    describe('.diag', () => {
      it('is set to the provided DiagnosticCollection', () => {
        expect(instance).to.have.property('diag', diagnostics);
      });
    });
  });
});
