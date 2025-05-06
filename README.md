# doc-gen-mcp

[![Build Status](https://github.com/micha-gh/doc-gen-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/micha-gh/doc-gen-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Changelog](https://img.shields.io/badge/Changelog-0.1.0-blue)](CHANGELOG.md)

**Generic Documentation Generator MCP for Cursor AI**

---

## Overview

doc-gen-mcp is a generic, extensible documentation generator for codebases, APIs, rulebases, and configs. It supports classic and AI-powered documentation, works with the Model Context Protocol (MCP, stdio), and is designed for robust automation and integration with modern developer tools like Cursor AI.

---

## Features

- **Node.js MCP server** (stdio, JSON commands)
- **Flexible input**: JSON, rulebase, API, config, or code files (JSDoc/TypeScript comments)
- **AI-powered documentation**: OpenAI, Anthropic, Gemini, Cohere, Azure OpenAI
- **Global configuration**: languages, output style, feature toggles
- **Multiple output formats**: Markdown, HTML, PDF, Confluence
- **Plugin architecture for exporters**: Easily add new export formats with the exporter plugin system
- **Validation and diff**: Validate docs, generate changelogs
- **Multilingual**: English/German, easily extensible
- **Extensible**: Add new formats, commands, output styles
- **Automated tests**: Jest, ESM-ready
- **Confluence export**: Publish documentation directly to Confluence pages via REST API

---

## Installation

```bash
# Install globally from npm (coming soon)
npm install -g doc-gen-mcp

# Or install locally
git clone https://github.com/micha-gh/doc-gen-mcp.git
cd doc-gen-mcp
npm install
```

---

## Quick Start / CLI Usage

Generate documentation from source code:

```bash
# Generate documentation from a directory
doc-gen --input ./src --output ./docs/api.md

# Generate AI-powered documentation
doc-gen --input ./src --output ./docs/api.md --ai --ai-provider openai

# Export to different formats
doc-gen --input ./src --output ./docs/api --export-format html
doc-gen --input ./src --output ./docs/api.pdf --export-format pdf

# Export to Confluence
doc-gen --input ./src --confluence --page-title "API Documentation"
```

---

## Input & Output Formats

### Supported Input Formats

- **entries**:
  ```json
  { "entries": [ { "category": "API", "title": "getUser", "content": "Returns a user." } ] }
  ```
- **rules**:
  ```json
  { "rules": [ { "id": "R1", "name": "Rule 1", "description": "Desc" } ] }
  ```
- **api**:
  ```json
  { "api": [ { "group": "User", "name": "getUser", "description": "Returns a user." } ] }
  ```
- **config**:
  ```json
  { "config": [ { "section": "General", "key": "timeout", "value": 30 } ] }
  ```
- **Code files**: Extracts JSDoc/TypeScript comments from `.js`/`.ts` files.

### Output Options

- **Markdown** (default): Grouped by categories, customizable heading levels and bullet points.
- **JSON**: Structured output, grouped by categories.
- **Confluence**: Export directly to Confluence pages (single page, by category, or individual pages).

---

## AI-Powered Documentation & Cursor Integration

You can use the CLI with AI support directly from within the Cursor editor by defining a custom command. This allows you to generate Markdown documentation for your code using any supported AI provider, right from your development environment.

### Example: Cursor Command for AI-Powered Documentation

```json
{
  "name": "Generate AI Documentation (OpenAI)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-doc.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY",
  "description": "Generate Markdown documentation from code using OpenAI (GPT) and save to docs/ai-doc.md"
}
```

- Adjust the CLI path, input folder, and output file as needed.
- Set your API key as an environment variable (recommended).

#### Other Providers
- Change the command line to use your preferred provider and key (see full README for examples for Anthropic, Gemini, Cohere, Azure OpenAI).

#### For the Current File (if supported by Cursor)

```json
{
  "name": "Generate AI Doc for Current File",
  "command": "bin/gendoc.js --input ${file} --output ./docs/ai-doc-${fileBasename}.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY",
  "description": "Generate AI documentation for the current file"
}
```

---

## Confluence Integration

Export documentation directly to Confluence pages:

### CLI Usage

```bash
bin/gendoc.js --input ./src --confluence [--confluence-config <path>] [--page-title <title>] [--by-category] [--labels <labels>]
```

### Options

- `--confluence`: Enable Confluence export
- `--confluence-config`: Path to a custom Confluence configuration file (default: `config/confluence.json`)
- `--page-title`: Export all content to a single page with this title
- `--by-category`: Create separate pages by category
- `--labels`: Comma-separated list of labels to add to pages

### Configuration

Create a configuration file at `config/confluence.json`:

```json
{
  "baseUrl": "https://your-space.atlassian.net/wiki",
  "spaceKey": "DOC",
  "parentPageId": "123456789",
  "auth": {
    "method": "token",
    "token": "$CONFLUENCE_TOKEN"
  },
  "defaultLabels": ["auto-doc", "mcp"]
}
```

For more details, see the [Confluence Integration Documentation](docs/confluence-integration.md).

---

## Global Configuration (`config`)

You can provide a global config at the top level or per command/args. It is automatically merged.

**Supported fields:**
- `languages`: List of supported programming languages (for code examples)
- `outputStyle`: Default output style (heading levels, bullet points)
- `defaultLang`: Default language ("de" or "en")
- `features`: Feature toggles (e.g., `{ "validate": true }`)

**Example:**
```json
{
  "config": {
    "languages": ["python", "typescript"],
    "defaultLang": "en",
    "outputStyle": { "headingLevel": 2, "bullet": "-" },
    "features": { "validate": true }
  },
  "command": "generateDocsFromInput",
  "args": {
    "input": {
      "entries": [
        {
          "category": "API",
          "title": "getUser",
          "content": "Returns a user.",
          "code": {
            "python": "def get_user(): ...",
            "typescript": "function getUser() {}"
          }
        }
      ]
    }
  }
}
```

---

## Commands

### `generateDocsFromInput`
- Detects and normalizes input formats (`entries`, `rules`, `api`, `config`)
- Groups by categories, clear section headings
- Error checking and marking of invalid entries
- Customizable output style
- Multilingual support (English/German)
- Output as Markdown (default) or JSON

### `validateDocumentation`
- Validates entries for required fields (`title`, `content`)
- Returns issues with index, error reason, and entry
- Multilingual output (en/de)

### `generateDocsFromDiff`
- Generates a documentation diff (Added/Changed/Removed) between two states (e.g., feature branch vs. main)
- Output as Markdown (changelog style) or JSON

### `exportToConfluence`
- Exports documentation to Confluence pages via REST API
- Supports multiple export strategies (single page, by category, individual pages)
- Converts Markdown to Confluence-compatible HTML
- Handles authentication and page creation/update

---

## Extensibility

- **Support new input formats**: Extend `detectFormat` and `normalizeEntries` in `lib/utils.js`.
- **More output styles**: Adjust Markdown generation in `generateDocsFromInput`.
- **Multilingual support**: Add more languages by extending text blocks in `generateDocsFromInput` and `validateDocumentation`.
- **New commands**: Import a new function in `index.js` and register it in the `commands` object.
- **Extend tests**: Add new `.test.mjs` files in the `test/` folder.

---

## Testing

Run all tests:
```bash
npm test
```

- Automated tests (Jest, ESM-ready) cover all core logic and CLI integration.
- Extend tests by adding new `.test.mjs` files in the `test/` folder.

---

## Best Practices & Notes

- **Invalid entries** are explicitly marked in Markdown; in JSON output, they appear with an error reason.
- **Empty or unknown formats** are rejected with a clear error message.
- **Automated tests** secure the core logic and should be extended with every new feature.
- **ESM-only:** The project uses modern ES modules (`import`/`export`). Jest is configured accordingly.

---

## Roadmap / Not Yet Implemented

- **Coverage check:** Check if all expected categories/entries are covered.
- **Format validation:** E.g., check for specific fields in API definitions.
- **Doc export:** Output as HTML, PDF, etc.
- **Interactive CLI:** For local use without MCP.
- **Doc import:** Automatically read from existing Markdown files.
- **Live preview:** Web server for previewing generated documentation.

---

## Project Structure

```
index.js                    # MCP server entry point, command registry, stdio handling
lib/generateDocs.js         # Core logic for documentation generation & validation
lib/utils.js                # Helper functions (format detection, normalization)
lib/confluenceCommand.js    # Confluence export command implementation
src/exporters/              # TypeScript modules for exporting to different formats
  confluenceExporter.ts     # Confluence API client and export functions
  markdownConverter.ts      # Markdown to Confluence HTML converter
config/                     # Configuration files
  confluence.json           # Confluence connection settings
docs/                       # Documentation
  confluence-integration.md # Confluence integration guide
test/                       # Unit tests (Jest, ESM)
```

---

## Exporter Plugin Architecture

doc-gen-mcp now supports a flexible plugin architecture for exporters, making it easy to add new export targets. The system is built around:

- **BaseExporter**: An abstract class that defines the interface all exporters must implement
- **ExporterManager**: A manager class that handles registration and instantiation of exporters

### Using Exporters

To use an exporter with the CLI:

```bash
bin/gendoc.js --input ./src --export-format confluence --page-title "API Documentation"
```

Available CLI options for exporters:

- `--export-format`: The format to export to (e.g., confluence, markdown, html)
- `--exporter-config`: Path to exporter configuration file
- `--by-category`: Export separate pages by category
- `--page-title`: For page-based exporters, use a single page with this title
- `--labels`: Comma-separated list of labels for exported content

### Creating Custom Exporters

To create a custom exporter, extend the `BaseExporter` abstract class:

```typescript
import { BaseExporter, ExportContent, ExportOptions, ExportResult } from '../core/plugins/BaseExporter.js';

export class MyCustomExporter extends BaseExporter {
  public readonly name = 'mycustom';
  public readonly description = 'My custom exporter';
  public readonly supportedFormats = ['custom'];
  public readonly defaultConfigPath = './config/mycustom.json';
  
  public async isConfigured(): Promise<boolean> {
    // Check if the exporter is properly configured
  }
  
  public async export(content: ExportContent, options?: ExportOptions): Promise<ExportResult> {
    // Implement export logic
  }
  
  public async loadConfig(configPath?: string): Promise<any> {
    // Load exporter configuration
  }
  
  public async validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
  }> {
    // Validate content before export
  }
}

// Export default for dynamic loading
export default MyCustomExporter;
```

To register your exporter, add it to `src/init/registerExporters.ts`:

```typescript
import MyCustomExporter from '../exporters/MyCustomExporter.js';

export async function registerBuiltinExporters(): Promise<void> {
  // Register built-in exporters
  exporterManager.registerExporter('confluence', () => new ConfluenceExporter());
  exporterManager.registerExporter('mycustom', () => new MyCustomExporter());
  
  console.log('Registered built-in exporters');
}
```

---

## Contributing, License, and Contact

- **License:** MIT (see LICENSE)
- **Contributing:** See CONTRIBUTING.md
- **Code of Conduct:** See CODE_OF_CONDUCT.md
- **Changelog:** See CHANGELOG.md
- **Questions, requests, or suggestions?** Just describe the command or feature – the system is designed for quick adaptation! 