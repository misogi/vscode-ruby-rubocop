import * as testRunner from 'vscode/lib/testrunner';

// see https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
testRunner.configure({
  reporter: 'spec',
  ui: 'bdd',
  useColors: true,
});

module.exports = testRunner;
