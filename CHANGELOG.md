# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Comprehensive maintenance plan with short-, mid-, and long-term measures
- Enhanced Cursor Rules with JavaScript to TypeScript migration support
- New Cursor commands for documentation generation and code maintenance
- Wartungsplan category added to Cursor rules
- Generation of maintenance reports and TypeScript skeleton files
- Tests for exporters (HTML, Markdown, BaseExporter, ExporterManager)
- HTML exporter using the plugin architecture
  - Customizable templates and CSS styling
  - Interactive features including collapsible sections and search
  - Table of contents generation
  - Category navigation and breadcrumbs
  - Light/Dark theme support
  - Code syntax highlighting
- Markdown exporter using the plugin architecture
  - Support for different Markdown flavors
  - Table of contents generation
  - Configurable heading levels and styling
  - File output capabilities
- Plugin architecture for exporters with BaseExporter abstract class and ExporterManager
- Modular export system supporting multiple export targets through plugins
- Refactored Confluence exporter to use the new plugin architecture
- New command line flag `--export-format` to use the plugin-based exporters
- Support for exporter configuration via `--exporter-config` flag
- Confluence integration for exporting documentation to Confluence pages
- TypeScript support and transpilation with `npm run build`
- Enhanced Markdown to Confluence HTML converter with support for code blocks, macros, and special formatting
- CLI support for Confluence export with `--confluence` flag
- Support for multiple export strategies: single page, by category, or individual pages
- New command `exportToConfluence` for programmatic use via MCP
- Comprehensive documentation in `docs/confluence-integration.md`
- Initial PDF exporter based on PDFKit with configurable pages, fonts, and styling
  - Cover page generation with custom titles and styling
  - Table of contents generation with configurable styles
  - Customizable headers and footers
  - Support for code blocks with syntax formatting
  - Category-based content organization
  - Custom color schemes and page styling
- Implementation plan for future development and feature enhancements
- Enhanced package.json with npm publishing support
- Support for global CLI command via npm installation

### Changed
- Updated Cursor rules to version 1.1.0 with improved documentation and migration support
- Updated documentation to reflect new export formats and features
- Improved README with clearer installation and usage instructions

### Fixed
- Fixed compatibility issues in Confluence exporter with new plugin architecture
- Fixed TypeScript type errors in exporter implementations
- Fixed TypeScript compilation issues with module resolution
- Fixed compatibility issues with marked v4.3.0
- Added custom type definitions for third-party libraries
- Improved error handling in Confluence API requests
- Fixed postinstall script to work with ES modules
- Ensured directory structure is preserved during TypeScript compilation
- Fixed HTTP headers handling in API requests
- Fixed type error in ruleLoader.ts with the correct return type for the ignore library

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