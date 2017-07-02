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

    describe('.command', () => {
      describe('when process.platform is "win32"', () => {
        beforeEach(() => {
          instance = new Rubocop(diagnostics, undefined, 'win32');
        });

        it('is set to "rubocop.bat"', () => {
          expect(instance).to.have.property('command', 'rubocop.bat');
        });
      });

      describe('when process.platform is not "win32"', () => {
        beforeEach(() => {
          instance = new Rubocop(diagnostics, undefined, 'linux');
        });

        it('is set to "rubocop"', () => {
          expect(instance).to.have.property('command', 'rubocop');
        });
      });
    });

    // note: these properties are currently set by Rubocop.resetConfig
    describe('configuration', () => {
      describe('.path', () => {
        it('is set', () => {
          expect(instance).to.have.property('path');
        });
      });

      describe('.configPath', () => {
        it('is set', () => {
          expect(instance).to.have.property('configPath');
        });
      });

      describe('.onSave', () => {
        it('is set', () => {
          expect(instance).to.have.property('onSave');
        });
      });
    });
  });
});
