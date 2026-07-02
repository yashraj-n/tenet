# aura-ai-agent

> A GitHub App built with [Probot](https://github.com/probot/probot) that  Automatically generate, review code from Github Issues &amp; Pull Requests

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t aura-ai-agent .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> aura-ai-agent
```

## Contributing

If you have suggestions for how aura-ai-agent could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2026 Yashraj Narke
