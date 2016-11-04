# Rubocop for Visual Studio Code

Visual Studio Code でrubocopを実行するエクステンションです。

This extension provides interfaces to rubocop for vscode.

[rubocop](https://github.com/bbatsov/rubocop) is code analyzer for ruby.

[ruby rubocop in Code Market Place](https://marketplace.visualstudio.com/items/misogi.ruby-rubocop)

![exec on save](./images/onsave.gif)

## features

- lint by execute command "Ruby: lint by rubocop" (cmd+shift+p and type command)
- auto invoke when saving file
- auto correct command "Ruby: autocorrect by rubocop"

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
  //  or "ruby.rubocop.executePath": "/Users/you/.rbenv/shims/"
  // if not specified searches for 'rubocop' executable available on PATH
  "ruby.rubocop.executePath": "D:/bin/Ruby22-x64/bin/",

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

Use yarn

    yarn install

Formatting code using [vvakame/typescript-formatter](https://github.com/vvakame/typescript-formatter)

    tsfmt -r src/*
