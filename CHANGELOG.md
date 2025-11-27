# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2023-11-27

### Added
- ✨ API Key Management System
  - Generate API keys with optional expiration
  - List, update, and revoke API keys
  - Secure storage of API keys in `api.keys.json`
- 🛡️ Authentication middleware for all sensitive endpoints
- ⚡ Stream inactivity detection (5-second timeout)
- 🔧 Automatic processing state reset on errors or timeouts
- 📚 Comprehensive API documentation
- 🏷️ Version tracking and changelog

### Changed
- 🔑 Authorization is now required for all API endpoints (except `/ping`, `/health`, `/admin`, `/api-keys`)
- 📁 Updated project structure to include `src/apiKeys.ts`
- 📝 Improved README.md with detailed usage examples and troubleshooting
- 🚀 Enhanced server startup logs with API key management info

### Fixed
- 🐛 Fixed "Provider is currently processing another request" error
- 🔧 Improved error handling and recovery mechanisms
- 🔄 Better state management for streaming requests
- ⏰ Prevented infinite stuck states when streams fail

## [1.0.0] - 2023-10-XX

### Added
- 🎉 Initial release of API Relay
- 🌐 OpenAI-compatible API endpoints (`/openai/v1/chat/completions`)
- 🤖 Anthropic-compatible API endpoints (`/anthropic/v1/messages`)
- 🔄 Support for both streaming and non-streaming requests
- 📊 Request queue management system
- 🔌 WebSocket server for browser extension communication
- 🌍 Browser extension for ChatGPT and Perplexity integration
- ⚙️ Configuration settings system
- ❤️ Health check and monitoring endpoints
- 📚 Initial documentation

## [Unreleased]

### Planned
- [ ] Rate limiting for API keys
- [ ] Usage analytics and dashboard
- [ ] Support for additional AI providers
- [ ] CLI tool for easier management
- [ ] Docker containerization
- [ ] Enhanced logging and debugging tools

---

## How to Update

From v1.0.0 to v1.1.0:
1. Update your codebase with the latest changes
2. Generate API keys using the new `/api-keys` endpoint
3. Update your API calls to include the Authorization header
4. No migration needed for existing data

### Breaking Changes

- **Authorization Required**: All API endpoints now require an API key in the Authorization header
  - Before: `curl -X POST http://localhost:8647/openai/v1/chat/completions`
  - After: `curl -X POST http://localhost:8647/openai/v1/chat/completions -H "Authorization: Bearer <API_KEY>"`