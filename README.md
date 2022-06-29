# Rubocop for Visual Studio Code

![travis status](https://travis-ci.org/misogi/vscode-ruby-rubocop.svg?branch=master)

Visual Studio Code で rubocop を実行するエクステンションです。

This extension provides interfaces to rubocop for vscode.

[rubocop](https://github.com/bbatsov/rubocop) is a code analyzer for ruby.

[ruby rubocop in Code Market Place](https://marketplace.visualstudio.com/items/misogi.ruby-rubocop)

![exec on save](./images/onsave.gif)

## Problems

This extension may have problems when using a rvm or chruby environment.
We recommend [vscode-ruby](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby). It can also lint ruby code.

When autoCorrect is enabled, the history of changing file is broken.

## Features

- lint by executing the command "Ruby: lint by rubocop" (cmd+shift+p and type command)
- auto invoke when saving file
- auto correct command "Ruby: autocorrect by rubocop"

### Exclude file

The extension forces rubocop's `force-exclusion` option.

If you do not want rubocop to be executed on some file, you can add AllCops/Exclude in rubocop.yml. The file can be saved without executing rubocop.

# Installation

Installation of ruby and rubocop is required.

```
gem install rubocop
```

- Type F1 (or Command + Shift + P)
- execute "Extensions: install extension"
- type rubocop and execute `ext install ruby-rubocop`

If VSCode market place is not configured in your FLOSS distribution of code (you have Open VSX instead):

1. Go on [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=misogi.ruby-rubocop) and clic on the [Download Extension](https://marketplace.visualstudio.com/_apis/public/gallery/publishers/misogi/vsextensions/ruby-rubocop/0.8.5/vspackage) button.
2. Install the extension manually from the CLI: `code --install-extension misogi.ruby-rubocop-0.8.5.vsix`

# ChangeLog

[ChangeLog](CHANGELOG.md)

## Configuration

Specify configuration (via navigating to `File > Preferences > Workspace Settings` and editing file `settings.json):`

```javascript
{
  // If not specified searches for 'rubocop' executable available on PATH (default and recommended)
  "ruby.rubocop.executePath": "",

  // You can use specific path
  // "ruby.rubocop.executePath": "/Users/you/.rbenv/shims/"
  // "ruby.rubocop.executePath": "/Users/you/.rvm/gems/ruby-2.3.2/bin/"
  // "ruby.rubocop.executePath": "D:/bin/Ruby22-x64/bin/"

  // Set to "--auto-correct-all" to enable "unsafe" auto-corrections
  "ruby.rubocop.autocorrectArg": "--auto-correct",

  // If not specified, it assumes a null value by default.
  "ruby.rubocop.configFilePath": "/path/to/config/.rubocop.yml",

  // default: true
  "ruby.rubocop.onSave": true
}
```

### Keybindings

You can change the keybinding (via editing `keybindings.json`)

```javascript
{ "key": "ctrl+alt+l",          "command": "ruby.rubocopAutocorrect",
                                "when": "editorLangId == 'ruby'" }
```

# todo

- more configurable command line options (like -R)
- integration with rbenv
- testing & CI support

# Contribute with this extension

Please install packages with yarn.

    yarn install

You could install TSLint extension for .ts files.

Please format code using prettier.

```
yarn prettier src/* test/* --write
```

# License

このソフトウェアは MIT ライセンスの元で公開されています。[LICENSE.txt](LICENSE.txt) をご覧下さい。

This software is released under the MIT License, see [LICENSE.txt](LICENSE.txt).
