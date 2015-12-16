# Rubocop for Visual Studio Code

Visual Studio Code でrubocopを実行するエクステンションです。

[rubocop](https://github.com/bbatsov/rubocop) is code analyzer for ruby.

[ruby rubocop in Code Market Place](https://marketplace.visualstudio.com/items/misogi.ruby-rubocop)

execute rubocop
- by execute command "Ruby: execute rubocop" (press F1)
- on Saving .rb file

![exec on save](./images/onsave.gif)

# Installation

Installation of ruby and rubocop is required.

```
gem install rubocop
```

- Type F1
- execute "Extensions: install extension"
- type rubocop and execute `ext install ruby-rubocop`

## Configuration

Speciry configuration

```
{
	"ruby.rubocop.executePath": "D:/bin/Ruby22-x64/bin/",
	"ruby.rubocop.onSave": true
}
```

`onSave` is default `true`

# todo

- more configurable command line option (like -R)
- integration with rbenv