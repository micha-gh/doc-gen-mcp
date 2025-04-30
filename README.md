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
- **Markdown or JSON output**: Grouped by category, customizable
- **Validation and diff**: Validate docs, generate changelogs
- **Multilingual**: English/German, easily extensible
- **Extensible**: Add new formats, commands, output styles
- **Automated tests**: Jest, ESM-ready

---

## Installation

```bash
npm install
```

---

## Quick Start / CLI Usage

Generate Markdown documentation from JSON/config/rulebase or code files:

```bash
bin/gendoc.js --input <file|dir> [--output <file>] [--config <file>] [--ai --ai-provider <provider> --<provider>-key <key> ...]
```

**Examples:**

- From JSON:
  ```bash
  bin/gendoc.js --input ./example-input.json --output ./docs/generated.md
  ```
- From a code file:
  ```bash
  bin/gendoc.js --input ./src/myModule.js --output ./docs/code-doc.md
  ```
- From a directory of code files:
  ```bash
  bin/gendoc.js --input ./src --output ./docs/all-code-doc.md
  ```
- AI-powered (OpenAI):
  ```bash
  bin/gendoc.js --input ./src --output ./docs/ai-code-doc.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY
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
index.js                # MCP server entry point, command registry, stdio handling
lib/generateDocs.js     # Core logic for documentation generation & validation
lib/utils.js            # Helper functions (format detection, normalization)
test/                   # Unit tests (Jest, ESM)
```

---

## Contributing, License, and Contact

- **License:** MIT (see LICENSE)
- **Contributing:** See CONTRIBUTING.md
- **Code of Conduct:** See CODE_OF_CONDUCT.md
- **Changelog:** See CHANGELOG.md
- **Questions, requests, or suggestions?** Just describe the command or feature – the system is designed for quick adaptation! 