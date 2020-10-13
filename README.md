# serverless-github-kanban-link
Link your github PR state to your kanban:
- Update your kanban stories states
- Update kanban stories metadata

## Installation
Run: `npm install`

## Serverless Online
Deploy: `sls deploy`

## Serverless offline plugin
Command: `sls offline`

**Note**: Be sure your current hosts configuration doesn't interfere with the default offline plugin configuration.

## ESlint
ESLinter based on airbnb and 20minutes lint rules

- **Installed locally**:
Command: `eslint [YOUR_FILE]`

- **Installed globally**:
Command: `./node_modules/.bin/eslint [YOUR_FILE]`

### Notes
If you don't use vscode, please take care of the configuration. It could prevent you from running eslint.

### TODO
Generate a robot account on zube kanban for story signature
