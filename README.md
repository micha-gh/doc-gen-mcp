# doc-gen-mcp

[![Build Status](https://github.com/micha-gh/doc-gen-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/micha-gh/doc-gen-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Changelog](https://img.shields.io/badge/Changelog-0.1.0-blue)](CHANGELOG.md)

**Generic Documentation Generator MCP for Cursor AI**

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