# serverless-github-kanban-link

[![serverless](http://public.serverless.com/badges/v3.svg)](https://serverless.com/)
[![GitHub version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/JamesLaviron/serverless-github-kanban-link)

Link your github PR state to your kanban:
- Update your kanban stories states
- Update kanban stories description when merged/deployed

## Prerequisites

- Node.js 12
- Serverless CLI v2.0.0 or later (`npm install -g serverless`)
- An AWS account
- Defined [provider credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

## Setup

### Deploy the code

- Generate a specific 'robot' account on zube kanban for card signature
- Get a [new personal .pem file](https://zube.io/docs/api) on Zube (Please add newline with `\n` to keep file consistancy)
- Set it in [AWS Secret manager](https://eu-west-1.console.aws.amazon.com/secretsmanager/home?region=eu-west-1#/newSecret?step=selectSecret) with name: `{stage}/kanban/zube` and key `zubeApiKey`, select `other secret types` - apart of that use default configuration.
- Deploy the service using: `serverless deploy`

### Configure serverless environment variables

Add following environment variables to your serverless configuration:
- `kanbanClientId`: your zube robot client ID.

Define also the zube categories you want to support and their associated triggering labels:
- `inProgress`: name of the zube's WIP category.
- `inProgressLabel`: name of the github's WIP label.
- `readyForReview`: name of the zube's RFR category.
- `readyForReviewLabel`: name of the github's RFR label (with `+` instead of each space)
- `deployed`: name of the zube's validation category - link it to your code validation state. By default it assumes merge on master is followed by an automatic deployment.
- `deployBranch`: name of the base ref that triggers deployment on your main preproduction environment.

### Setup GitHub webhook

Configure the webhook in [the GitHub repository settings](https://developer.github.com/webhooks/creating/#setting-up-a-webhook).

- In the Payload URL, enter the URL you received after deploying. It would be something like `https://<your_url>.amazonaws.com/dev/webhook`.
- Choose the "application/json" in Content type.
- In the types of events to trigger the webhook, select "Let me select individual events", then select at least `Pull Requests`. You can also select the `push` event if you have automatic deployment on merge.

### JS Linter
ESLinter based on airbnb and 20minutes lint rules

- **Installed locally**:
Command: `eslint [YOUR_FILE]`

- **Installed globally**:
Command: `./node_modules/.bin/eslint [YOUR_FILE]`

### Notes

- This webhook doesn't depend on a specific workspace or project. Feel free to add it on any project, as soon as it uses both github and zube :smiley:
- If you don't use vscode, please take care of the configuration. It could prevent you from running eslint.
- FYI: when deploying, `Configuration warning at 'custom.safeguards': should be object` is a wrong warning.
- Don't forget to disable your CI software on pull request creation to avoid useless builds on `WIP` PRs.

### Acknowledgments
This project was inspired by [20 minutes github check](https://github.com/20minutes/serverless-github-check)
