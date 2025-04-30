# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-06-07
### Added
- Initial public release.
- Node.js MCP server with stdio transport and command registry.
- `generateDocsFromInput`: Generate documentation from various JSON input formats (entries, rules, api, config).
- `validateDocumentation`: Validate documentation entries for required fields.
- `generateDocsFromDiff`: Generate documentation diffs (Added/Changed/Removed) between two states.
- Global configuration support (`config`): languages, outputStyle, defaultLang, feature toggles.
- Multilingual support (English/German).
- Automated tests (Jest, ESM-ready).
- Extensive README, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE. 