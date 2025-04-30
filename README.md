# doc-gen-mcp

[![Build Status](https://github.com/micha-gh/doc-gen-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/micha-gh/doc-gen-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Changelog](https://img.shields.io/badge/Changelog-0.1.0-blue)](CHANGELOG.md)

**Generic Documentation Generator MCP for Cursor AI**

---

## Using AI Documentation in Cursor

You can use the CLI with AI support directly from within the Cursor editor by defining a custom command. This allows you to generate Markdown documentation for your code using any supported AI provider, right from your development environment.

### Example: Cursor Command for AI-Powered Documentation

Add the following to your Cursor command configuration (e.g., `.cursor/commands.json` or via the Command Panel):

```json
{
  "name": "Generate AI Documentation (OpenAI)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-doc.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY",
  "description": "Generate Markdown documentation from code using OpenAI (GPT) and save to docs/ai-doc.md"
}
```

- Adjust the CLI path (`bin/gendoc.js`), input folder (`./src`), and output file (`./docs/ai-doc.md`) as needed.
- Set your API key as an environment variable (recommended) or insert it directly (not recommended for security reasons).

#### For Other Providers
Change the command line to use your preferred provider and key:

**Anthropic Claude:**
```json
{
  "name": "Generate AI Documentation (Claude)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-claude-doc.md --ai --ai-provider anthropic --anthropic-key $ANTHROPIC_API_KEY",
  "description": "Generate Markdown documentation from code using Anthropic Claude"
}
```

**Google Gemini:**
```json
{
  "name": "Generate AI Documentation (Gemini)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-gemini-doc.md --ai --ai-provider gemini --gemini-key $GEMINI_API_KEY",
  "description": "Generate Markdown documentation from code using Google Gemini"
}
```

**Cohere:**
```json
{
  "name": "Generate AI Documentation (Cohere)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-cohere-doc.md --ai --ai-provider cohere --cohere-key $COHERE_API_KEY",
  "description": "Generate Markdown documentation from code using Cohere"
}
```

**Azure OpenAI:**
```json
{
  "name": "Generate AI Documentation (Azure OpenAI)",
  "command": "bin/gendoc.js --input ./src --output ./docs/ai-azure-doc.md --ai --ai-provider azure-openai --azure-openai-key $AZURE_OPENAI_KEY --azure-openai-endpoint \"https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-02-15-preview\"",
  "description": "Generate Markdown documentation from code using Azure OpenAI"
}
```

#### For the Current File (if supported by Cursor)

```json
{
  "name": "Generate AI Doc for Current File",
  "command": "bin/gendoc.js --input ${file} --output ./docs/ai-doc-${fileBasename}.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY",
  "description": "Generate AI documentation for the current file"
}
```

- `${file}` and `${fileBasename}` are placeholders supported by many editors/Cursor for the currently open file.

### How to Use
- Open the Command Panel in Cursor (usually `Cmd+Shift+P` or `Ctrl+Shift+P`).
- Search for your custom command (e.g., "Generate AI Documentation (OpenAI)").
- Run the command. The generated Markdown documentation will be saved to the specified output file, which you can open directly in Cursor.

---

## CLI Usage

You can generate Markdown documentation from either a JSON/config/rulebase file or directly from code files (extracting JSDoc/TypeScript comments) using the CLI script:

```bash
bin/gendoc.js --input <file|dir> [--output <file>] [--config <file>] [--ai --ai-provider <provider> --<provider>-key <key> ...]
```

- `--input`   Path to a JSON/config file, a code file (.js/.ts), or a directory containing code files
- `--output`  Output Markdown file (default: stdout)
- `--config`  Optional config JSON file (see global config in this README)
- `--ai`      Use AI to generate documentation from code (optional)
- `--ai-provider`  AI provider: `openai`, `anthropic`, `gemini`, `cohere`, `azure-openai`
- `--openai-key`   OpenAI API key (for `openai`)
- `--anthropic-key` Anthropic API key (for `anthropic`)
- `--gemini-key`    Google Gemini API key (for `gemini`)
- `--cohere-key`    Cohere API key (for `cohere`)
- `--azure-openai-key` Azure OpenAI API key (for `azure-openai`)
- `--azure-openai-endpoint` Azure OpenAI endpoint (for `azure-openai`)

### Examples

**Generate documentation from a JSON file:**
```bash
bin/gendoc.js --input ./example-input.json --output ./docs/generated.md
```

**Generate documentation from a single code file:**
```bash
bin/gendoc.js --input ./src/myModule.js --output ./docs/code-doc.md
```

**Generate documentation from all code files in a directory:**
```bash
bin/gendoc.js --input ./src --output ./docs/all-code-doc.md
```

**Generate AI-powered documentation from code (OpenAI):**
```bash
bin/gendoc.js --input ./src --output ./docs/ai-code-doc.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY
```

**Generate AI-powered documentation from code (Anthropic Claude):**
```bash
bin/gendoc.js --input ./src --output ./docs/ai-claude-doc.md --ai --ai-provider anthropic --anthropic-key $ANTHROPIC_API_KEY
```

**Generate AI-powered documentation from code (Google Gemini):**
```bash
bin/gendoc.js --input ./src --output ./docs/ai-gemini-doc.md --ai --ai-provider gemini --gemini-key $GEMINI_API_KEY
```

**Generate AI-powered documentation from code (Cohere):**
```bash
bin/gendoc.js --input ./src --output ./docs/ai-cohere-doc.md --ai --ai-provider cohere --cohere-key $COHERE_API_KEY
```

**Generate AI-powered documentation from code (Azure OpenAI):**
```bash
bin/gendoc.js --input ./src --output ./docs/ai-azure-doc.md --ai --ai-provider azure-openai --azure-openai-key $AZURE_OPENAI_KEY --azure-openai-endpoint "https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-02-15-preview"
```

---

## Overview

This tool is a generic, extensible documentation generator that communicates via the Model Context Protocol (MCP, stdio). It supports various input formats (e.g., rulebases, API definitions, configuration objects) and generates structured Markdown or JSON documentation.  
The architecture is designed for extensibility, robustness, and automation.

---

## Features

- **Node.js MCP server** (communication via stdio, JSON commands)
- **Global configuration (`config`)**
  - Programming languages for code examples/snippets (`languages`)
  - Default output style (`outputStyle`)
  - Default language (`defaultLang`)
  - Feature toggles (`features`)
  - Can be provided globally or per command
- **Command: `generateDocsFromInput`**
  - Automatic detection and normalization of input formats (`entries`, `rules`, `api`, `config`)
  - Grouping by categories, clear section headings
  - Error checking and marking of invalid entries
  - Customizable output style (heading levels, bullet points)
  - Multilingual support (English/German)
  - Output as Markdown (default) or structured JSON documentation
  - Outputs supported programming languages and code blocks if desired
- **Command: `validateDocumentation`**
  - Validates entries for required fields (`title`, `content`)
  - Returns issues with index, error reason, and entry
  - Multilingual output (en/de)
- **Command: `generateDocsFromDiff`**
  - Generates a documentation diff (Added/Changed/Removed) between two states (e.g., feature branch vs. main)
  - Supports all formats like `generateDocsFromInput`
  - Output as Markdown (changelog style) or JSON
- **Automated tests** (Jest, ESM-ready)
- **Extensible** for more commands, formats, languages, output styles

---

## Project Structure

```
index.js                # MCP server entry point, command registry, stdio handling
lib/generateDocs.js     # Core logic for documentation generation & validation
lib/utils.js            # Helper functions (format detection, normalization)
test/                   # Unit tests (Jest, ESM)
```

---

## Usage

### 1. Installation & Start

```bash
npm install
npm start
```

### 2. Communication (MCP server)

The server expects JSON commands via stdin and responds via stdout.  
Example command (as a single line):

```json
{
  "config": {
    "languages": ["python", "typescript"],
    "defaultLang": "en",
    "outputStyle": { "headingLevel": 3, "bullet": "*" },
    "features": { "validate": true }
  },
  "command": "generateDocsFromInput",
  "args": {
    "input": { ... }
  }
}
```
- The config can also be provided directly in `args` (it will be merged).
- All commands respect the config.

### 3. Supported Input Formats

- **entries**:  
  ```json
  { "entries": [ { "category": "API", "title": "getUser", "content": "Returns a user.", "code": { "python": "def get_user(): ...", "typescript": "function getUser() {}" } } ] }
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

### 4. Output Options

- **Markdown** (default):  
  Grouped by categories, customizable heading levels and bullet points.
  - If `languages` is set and entries contain code examples, these will be output as code blocks.
- **JSON**:  
  Structured output, grouped by categories.

### 5. Validation

```json
{
  "command": "validateDocumentation",
  "args": {
    "input": { ... },
    "lang": "en"
  }
}
```
Response:
```json
{
  "result": {
    "valid": false,
    "issues": [
      { "index": 0, "error": "Missing content", "entry": { "title": "T1" } }
    ],
    "message": "Some entries are invalid."
  }
}
```

### 6. Documentation Diff

**Command:** `generateDocsFromDiff`

- **Purpose:** Generates documentation of changes between two states (e.g., feature branch vs. main)
- **Input:**
  ```json
  {
    "command": "generateDocsFromDiff",
    "args": {
      "old": { ... },   // e.g., main/integration
      "new": { ... },   // e.g., feature branch
      "outputFormat": "markdown", // optional
      "lang": "en" // optional
    }
  }
  ```
- **Output:**
  - Markdown with sections "Added", "Changed", "Removed"
  - Or structured JSON output:
    ```json
    {
      "result": {
        "diff": {
          "added": [ ... ],
          "changed": [ { "before": {...}, "after": {...} } ],
          "removed": [ ... ]
        }
      }
    }
    ```
- **Example Markdown Output:**
  ```markdown
  # Documentation Diff

  ## Added
  - getUser: Returns a user.

  ## Changed
  - setUser:
    - Before: Old description
    - After: New description

  ## Removed
  - deleteUser: Deletes a user.
  ```

---

## Global Configuration (`config`)

The central config can be provided at the top level or per command/args. It is automatically merged.

**Supported fields:**
- `languages`: List of supported programming languages (e.g., for code examples)
- `outputStyle`: Default output style (e.g., heading levels, bullet points)
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

**Result (Markdown):**
```
# Documentation

Supported languages: python, typescript

## API

### getUser

Returns a user.

```python
def get_user(): ...
```

```typescript
function getUser() {}
```
```

---

## Extensibility

### Support new input formats

- Extend the `detectFormat` and `normalizeEntries` functions in `lib/utils.js`.
- Example: For a new field `myFormat`, simply add a new case.

### More output styles

- Adjust Markdown generation in `generateDocsFromInput`.
- Additional options (e.g., tables, code blocks, links) can be controlled via the `outputStyle` argument.

### Multilingual support

- All output and error messages are already prepared for English/German.
- Add more languages by extending the text blocks in `generateDocsFromInput` and `validateDocumentation`.

### New commands

- Simply import a new function in `index.js` and register it in the `commands` object.
- Example: `coverageCheck`, `exportToHtml`, `summarizeDocs`, etc.

### Extend tests

- Add new `.test.mjs` files in the `test/` folder.
- Use existing tests as templates.

---

## Best Practices & Notes

- **Invalid entries** are explicitly marked in Markdown; in JSON output, they appear with an error reason.
- **Empty or unknown formats** are rejected with a clear error message.
- **Automated tests** secure the core logic and should be extended with every new feature.
- **ESM-only:** The project uses modern ES modules (`import`/`export`). Jest is configured accordingly.

---

## Useful, not yet implemented features

- **Coverage check:** Check if all expected categories/entries are covered.
- **Format validation:** E.g., check for specific fields in API definitions.
- **Doc export:** Output as HTML, PDF, etc.
- **Interactive CLI:** For local use without MCP.
- **Doc import:** Automatically read from existing Markdown files.
- **Live preview:** Web server for previewing generated documentation.

---

**Questions, requests, or suggestions? Just describe the command or feature – the system is designed for quick adaptation!** 