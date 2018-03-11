# Rubocop for Visual Studio Code

![travis status](https://travis-ci.org/misogi/vscode-ruby-rubocop.svg?branch=master)

Visual Studio Code でrubocopを実行するエクステンションです。

This extension provides interfaces to rubocop for vscode.

[rubocop](https://github.com/bbatsov/rubocop) is code analyzer for ruby.

[ruby rubocop in Code Market Place](https://marketplace.visualstudio.com/items/misogi.ruby-rubocop)

![exec on save](./images/onsave.gif)

## problems

This extension may have a problem when using a rvm or chruby environment.
We recommend [vscode-ruby](https://marketplace.visualstudio.com/items?itemName=rebornix.Ruby). It can also lint ruby code.

When autoCorrect, History of changing file is broken.

## features

- lint by execute command "Ruby: lint by rubocop" (cmd+shift+p and type command)
- auto invoke when saving file
- auto correct command "Ruby: autocorrect by rubocop"

### Exclude file

An extension forces rubocop's `force-exclusion` option.

If you want not to execute rubocop on some file, You could add AllCops/Exclude on rubocop.yml. This can saving without executing rubocop.

# Installation

Installation of ruby and rubocop is required.

```
gem install rubocop
```

- Type F1 (or Command + Shift + P)
- execute "Extensions: install extension"
- type rubocop and execute `ext install ruby-rubocop`

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

  // If not specified, it assumes a null value by default.
  "ruby.rubocop.configFilePath": "/path/to/config/.rubocop.yml",

  // default true
  "ruby.rubocop.onSave": true
}
```

### Keybindings

You can change keybinding (via editing `keybindings.json`)

```javascript
{ "key": "ctrl+alt+l",          "command": "ruby.rubocopAutocorrect",
                                "when": "editorLangId == 'ruby'" }
```

# todo

- more configurable command line option (like -R)
- integration with rbenv
- testing & CI support

# Contribute with this extension

Please install packages with yarn.

    yarn install

You could install TSLint extension for .ts files.

Formatting code using [vvakame/typescript-formatter](https://github.com/vvakame/typescript-formatter)

    tsfmt -r src/*

# License

このソフトウェアはMITライセンスの元で公開されています。[LICENSE.txt](LICENSE.txt) をご覧下さい。

This software is released under the MIT License, see [LICENSE.txt](LICENSE.txt).
