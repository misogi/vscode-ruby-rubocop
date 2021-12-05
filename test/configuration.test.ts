import { expect } from 'chai';
import * as cp from 'child_process';
import * as pq from 'proxyquire';
import * as vsStub from 'vscode';

// override vs.workspace.getConfiguration to return default values for each of the extension's
// defined configuration options, and not depend on what is configured by the user
const { getConfiguration: _getConfiguration } = vsStub.workspace;

vsStub.workspace.getConfiguration = (
  section?: string,
  resource?: vsStub.Uri | null
): any => {
  if (section !== 'ruby.rubocop') {
    return _getConfiguration(section, resource);
  }

  const defaultConfig = {
    configfilePath: '',
    executePath: '',
    onSave: true,
    useBundler: false,
    suppressRubocopWarnings: false,
    enableUnsafeAutoCorrection: false,
  };

  return {
    get: <T>(section: string, defaultValue: T): T =>
      defaultConfig[section] || defaultValue,
  };
};

const childProcessStub: any = {};
const extensionConfig = pq('../src/configuration', {
  child_process: childProcessStub,
  vscode: vsStub,
});

const { RubocopConfig, getConfig } = extensionConfig;
const canFindBundledCop = () => new Buffer('path/to/bundled/rubocop');
const cannotFindBundledCop = () => {
  throw new Error('not found');
};

describe('RubocopConfig', () => {
  describe('getConfig', () => {
    describe('.useBundler', () => {
      it('is set to false', () => {
        expect(getConfig()).to.have.property('useBundler', false);
      });

      it('is set to true if a bundled rubocop is found', () => {
        childProcessStub.execSync = canFindBundledCop;
        expect(getConfig()).to.have.property('useBundler', true);
      });

      it('is unset if a bundled rubocop is not found', () => {
        childProcessStub.execSync = cannotFindBundledCop;
        expect(getConfig()).to.have.property('useBundler', false);
      });
    });

    describe('.suppressRubocopWarnings', () => {
      it('is set to false', () => {
        expect(getConfig()).to.have.property('suppressRubocopWarnings', false);
      });
    });

    describe('.enableUnsafeAutoCorrection', () => {
      it('is set to false', () => {
        expect(getConfig()).to.have.property('enableUnsafeAutoCorrection', false);
      });
    });

    describe('.command', () => {
      describe('win32 platform', () => {
        beforeEach(() => {
          this.originalPlatform = Object.getOwnPropertyDescriptor(
            process,
            'platform'
          );
          Object.defineProperty(process, 'platform', {
            value: 'win32',
          });
        });
        afterEach(() => {
          Object.defineProperty(process, 'platform', this.originalPlatform);
        });

        it('is set to "bundle exec rubocop.bat" if bundled rubocop is present', () => {
          childProcessStub.execSync = canFindBundledCop;
          expect(getConfig()).to.have.property(
            'command',
            'bundle exec rubocop.bat'
          );
        });

        it('is set to "rubocop.bat" otherwise', () => {
          childProcessStub.execSync = cannotFindBundledCop;
          expect(getConfig()).to.have.property('command', 'rubocop.bat');
        });
      });

      describe('non-win32 platform', () => {
        beforeEach(() => {
          this.originalPlatform = Object.getOwnPropertyDescriptor(
            process,
            'platform'
          );
          Object.defineProperty(process, 'platform', {
            value: 'commodore64',
          });
        });
        afterEach(() => {
          Object.defineProperty(process, 'platform', this.originalPlatform);
        });

        it('is set to "bundle exec rubocop" if bundled rubocop is present', () => {
          childProcessStub.execSync = canFindBundledCop;
          expect(getConfig()).to.have.property(
            'command',
            'bundle exec rubocop'
          );
        });

        it('is set to "path/to/rubocop" otherwise', () => {
          childProcessStub.execSync = cannotFindBundledCop;
          expect(getConfig().command).to.match(/.*rubocop$/);
        });
      });

      describe('.configFilePath', () => {
        it('is set', () => {
          expect(getConfig()).to.have.property('configFilePath');
        });
      });

      describe('.onSave', () => {
        it('is set', () => {
          expect(getConfig()).to.have.property('onSave');
        });
      });
    });
  });
});
