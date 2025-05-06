# Confluence Integration for doc-gen-mcp

This document describes how to use the Confluence integration feature of doc-gen-mcp to publish generated documentation directly to Confluence pages.

## Setup

### Prerequisites

- Node.js 14 or higher
- A Confluence instance (Cloud or Server)
- API token or credentials for your Confluence instance

### Installation

Make sure all dependencies are installed:

```bash
npm install
npm run build  # Required to compile TypeScript files
```

### Configuration

Create a Confluence configuration file at `config/confluence.json`:

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

You can use environment variables for sensitive information like tokens:

```bash
export CONFLUENCE_TOKEN="your-confluence-api-token"
```

## Usage

### MCP Server Mode

When using the MCP server, a new command `exportToConfluence` is available:

```json
{
  "command": "exportToConfluence",
  "args": {
    "input": {
      "entries": [
        {
          "category": "API",
          "title": "getUser",
          "content": "Returns user information"
        }
      ]
    },
    "configPath": "/path/to/confluence.json",
    "title": "API Documentation",
    "byCategory": false,
    "labels": ["api", "docs"]
  }
}
```

#### Options

- `input`: Documentation entries (same format as other commands)
- `configPath`: (Optional) Path to a custom Confluence configuration file
- `title`: (Optional) Use a single page with this title for all entries
- `byCategory`: (Optional) Create separate pages by category
- `labels`: (Optional) Additional labels to add to pages

### CLI Usage

Use the Confluence export features from the command line:

```bash
bin/gendoc.js --input ./src --confluence --page-title "API Documentation" --labels api,docs
```

#### Options

- `--confluence`: Enable Confluence export
- `--confluence-config`: Path to a custom Confluence configuration
- `--page-title`: Export all entries to a single page with this title
- `--by-category`: Create separate pages by category
- `--labels`: Comma-separated list of labels for the pages

## Export Strategies

The exporter supports three different export strategies:

1. **Single Page**: When `title` (or `--page-title`) is specified, all content is exported to a single page with that title.

2. **By Category**: When `byCategory` (or `--by-category`) is true, entries are grouped by their category and each category gets its own page.

3. **Individual Pages**: When neither of the above is specified, each entry is exported as a separate page with its title.

## Markdown Support

The exporter automatically converts Markdown content to Confluence HTML using the appropriate macros:

- Headings (h1-h6)
- Emphasis and strong text
- Code blocks with language syntax highlighting
- Inline code
- Lists (ordered and unordered)
- Links
- Images
- Special notes and warnings (using blockquote syntax)

### Special Syntax for Confluence Macros

Use the following syntax for special Confluence macros:

```markdown
> INFO: This will be rendered as an info macro

> NOTE: This will be rendered as a note macro

> WARNING: This will be rendered as a warning macro
```

## Examples

### Export Directory of Code Files with JSDoc Comments

```bash
bin/gendoc.js --input ./src --confluence --by-category --labels auto-generated,api
```

### Export with AI-Generated Documentation

```bash
bin/gendoc.js --input ./src --ai --ai-provider openai --openai-key $OPENAI_API_KEY --confluence --page-title "API Documentation"
```

### Export Rules from a JSON File

```bash
bin/gendoc.js --input ./rules.json --confluence --page-title "Business Rules"
```

## Troubleshooting

- **Authentication Issues**: Check your API token or credentials in the configuration file
- **Permission Errors**: Ensure your Confluence user has permission to create/update pages
- **Missing Dependencies**: Run `npm run build` to ensure TypeScript files are compiled
- **Module not found**: Make sure you've installed the required dependencies with `npm install` 