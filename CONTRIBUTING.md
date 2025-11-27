# Contributing to API Relay

Thank you for your interest in contributing to API Relay! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read and follow it in all your interactions with the project.

## Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Git
- A modern web browser (for extension testing)

### Setup Steps

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/API-relay.git
   cd API-relay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file for local development
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Load the browser extension**
   - Open your browser's extension management page
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

### Project Structure

```
API-relay/
├── src/                     # Server-side code
│   ├── apiKeys.ts          # API key management
│   ├── server.ts           # Main HTTP server
│   ├── ws.ts               # WebSocket server
│   ├── queue.ts            # Request queue management
│   ├── settings.ts         # Configuration settings
│   └── types.d.ts          # TypeScript type definitions
├── extension/              # Browser extension
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Background script
│   ├── content.js          # Content script
│   ├── provider-utils.js   # Utility functions
│   └── providers/          # Provider-specific code
│       ├── chatgpt.js      # ChatGPT provider
│       └── perplexity.js   # Perplexity provider
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── tests/                  # Test files
```

### Default Configuration

- **Server Port**: 8647 (configurable via `PORT` environment variable)
- **API Endpoints**: 
  - OpenAI Compatible: `http://localhost:8647/openai/v1/chat/completions`
  - Anthropic Compatible: `http://localhost:8647/anthropic/v1/messages`
  - API Key Management: `http://localhost:8647/api-keys`

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with the "bug" label
3. Provide detailed information:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, browser, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue with the "enhancement" label
3. Describe the feature and its use case
4. Explain why it would be valuable

### Code Contributions

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test your changes thoroughly
5. Submit a pull request

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for server-side code
- Use modern JavaScript (ES6+) for browser extension
- Follow consistent naming conventions:
  - camelCase for variables and functions
  - PascalCase for classes and interfaces
  - UPPER_SNAKE_CASE for constants

### Code Style

- Use 2 spaces for indentation
- Include JSDoc comments for functions and classes
- Keep lines under 100 characters
- Use meaningful variable and function names

### Example

```typescript
/**
 * Sends a request to the AI provider
 * @param clientId - The ID of the client to send the request to
 * @param job - The job containing request details
 * @returns Promise that resolves with the response
 */
async function sendRequestToClient(clientId: string, job: RelayJob): Promise<any> {
  // Implementation...
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Mock external dependencies (AI providers)

### Test Structure

```
tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── e2e/                   # End-to-end tests
└── fixtures/              # Test data and mocks
```

## Documentation

### Types of Documentation

1. **API Documentation** - Details about endpoints and parameters
2. **User Documentation** - Guides for end users
3. **Developer Documentation** - Technical details for contributors

### Writing Documentation

- Use clear, concise language
- Include code examples
- Add screenshots where helpful
- Keep documentation up to date with code changes

## Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update API documentation

2. **Run Tests**
   ```bash
   npm run test
   npm run lint
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release tag:
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```
4. Create a GitHub release with notes

## Getting Help

- Create an issue for questions or problems
- Join our discussions for general questions
- Check existing documentation first

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special thanks in project announcements

Thank you for contributing to API Relay! 🚀