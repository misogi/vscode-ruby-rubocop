# 0.7.0

- Fix autocorrect was not respecting the .rubocop.yml

# 0.6.1

- Accepts a command is prefixed like 'bundle exec'

# 0.6.0

- Set autocorrect as a formatter

# 0.5.0

- Automatically detect and use bundled rubocop

# 0.4.0

- Lint files opened before the extension is loaded.
- Don't clear diagnostics of other files.
- Kill running rubocop process on close a file.
- Run single process at a time (to avoid accidential process bomb) (using queue).
  - This is caused by vscode's project-wide replace (opens all matched file at once).

# 0.3.5

- force `force-exclude` option

# 0.3.4

- don't execute when starting git diff mode

# 0.3.3

- output error when stderr presented
- show specific error message for empty output (to identify problem)

# 0.3.2

- execute on open

# 0.3.1

- Rubocop saves the file before correcting it and runs checks again

# 0.3.0

- Add auto correct command
- display message when config file is not exist

# 0.2.2

- show message when occur errors on parsing JSON

# 0.2.1

- find rubocop from PATH

# 0.2.0

- enable specify config file (e.g. .rubocop.yml)

# 0.1.11

- show warning when rubocop output is empty

# 0.1.10

- handling JSON syntax error
