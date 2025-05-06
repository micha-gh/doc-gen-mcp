# MCP Confluence Integration Usage Guide

This guide explains how to use the Model Context Protocol (MCP) with the Confluence integration for the `doc-gen-mcp` tool.

## Prerequisites

Before you begin, ensure you have:

- Node.js 14 or higher installed
- Access to a Confluence instance (Cloud or Server)
- A Confluence API token or appropriate credentials
- Permissions to create/update pages in your Confluence space

## Installation

1. Install the package and its dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript files:
   ```bash
   npm run build
   ```

## Configuration

### Confluence Configuration File

Create a configuration file at `config/confluence.json`:

```json
{
  "baseUrl": "https://your-company.atlassian.net/wiki",
  "spaceKey": "DOC",
  "parentPageId": "123456789",
  "auth": {
    "method": "token",
    "token": "$CONFLUENCE_TOKEN"
  },
  "defaultLabels": ["auto-doc", "mcp"]
}
```

### Configuration Options

| Option | Description | Required |
|--------|-------------|----------|
| `baseUrl` | The base URL of your Confluence instance | Yes |
| `spaceKey` | The key of the Confluence space where pages will be created | Yes |
| `parentPageId` | The ID of the parent page under which new pages will be created | No |
| `auth.method` | Authentication method: `token` or `basic` | Yes |
| `auth.token` | API token (for `token` method) | Yes, if using token auth |
| `auth.username` | Username (for `basic` method) | Yes, if using basic auth |
| `auth.password` | Password (for `basic` method) | Yes, if using basic auth |
| `defaultLabels` | Array of labels to apply to all pages | No |

### Environment Variables

For security reasons, you can use environment variables for sensitive information:

1. In your config file, prefix the value with `$`:
   ```json
   "token": "$CONFLUENCE_TOKEN"
   ```

2. Set the environment variable:
   ```bash
   export CONFLUENCE_TOKEN="your-actual-token"
   ```

## Using with MCP

### Starting the MCP Server

Run the MCP server:

```bash
node index.js
```

The server will output a list of available commands, including `exportToConfluence`.

### MCP Command Format

Send commands to the MCP server in JSON format:

```json
{
  "command": "exportToConfluence",
  "args": {
    "input": {
      "entries": [
        {
          "category": "API",
          "title": "getUser",
          "content": "Returns user information based on ID."
        },
        {
          "category": "Config",
          "title": "timeout",
          "content": "Sets connection timeout in seconds."
        }
      ]
    },
    "configPath": "./config/custom-confluence.json",
    "title": "API Documentation",
    "byCategory": false,
    "labels": ["api", "generated"]
  }
}
```

### Available Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `input` | The documentation entries to export | Required |
| `configPath` | Path to a custom Confluence configuration | `config/confluence.json` |
| `title` | Title for a single page export | None |
| `byCategory` | Whether to create pages by category | `false` |
| `labels` | Additional labels to add to pages | None |
| `validateBeforeExport` | Whether to validate docs before export | `true` |

### Input Formats

The MCP accepts several input formats:

#### 1. Entries Format

```json
{
  "entries": [
    {
      "category": "API",
      "title": "getUser",
      "content": "Returns user information"
    }
  ]
}
```

#### 2. Rules Format

```json
{
  "rules": [
    {
      "id": "R1",
      "name": "Password Complexity",
      "description": "Passwords must contain letters, numbers, and symbols"
    }
  ]
}
```

#### 3. API Format

```json
{
  "api": [
    {
      "group": "User Management",
      "name": "getUser",
      "description": "Returns user information"
    }
  ]
}
```

#### 4. Config Format

```json
{
  "config": [
    {
      "section": "Security",
      "key": "timeout",
      "value": 30
    }
  ]
}
```

### Export Strategies

The exporter supports three different export strategies:

1. **Single Page**: When `title` is specified, all content is exported to a single page with that title.

2. **By Category**: When `byCategory` is true, entries are grouped by their category and each category gets its own page.

3. **Individual Pages**: When neither of the above is specified, each entry is exported as a separate page with its title.

## Using via CLI

You can also use the Confluence integration via the command line:

```bash
bin/gendoc.js --input ./src --confluence --page-title "API Documentation" --labels api,docs
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--input` | Path to input file or directory |
| `--confluence` | Enable Confluence export |
| `--confluence-config` | Path to custom Confluence config |
| `--page-title` | Title for single page export |
| `--by-category` | Create separate pages by category |
| `--labels` | Comma-separated list of labels |

## Processing Rules

The Confluence integration follows these rules:

1. Only files that match the CursorRules in `cursorrules.json` or the `.cursorrules/` directory will be processed.

2. Files and directories listed in `.gitignore` or `docignore` are excluded.

3. Markdown files are used as sources but not as export targets.

4. Comments in code files are the primary source for technical documentation.

## Markdown Support

When exporting Markdown content to Confluence, the following elements are converted:

- Headings (h1-h6)
- Emphasis and strong text
- Code blocks with language syntax highlighting
- Lists (ordered and unordered)
- Links
- Images

### Special Confluence Macros

You can use these special syntaxes for Confluence macros:

```markdown
> INFO: This will be rendered as an info macro

> NOTE: This will be rendered as a note macro

> WARNING: This will be rendered as a warning macro
```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**:
   - Ensure you've run `npm install` and `npm run build`
   - Check that all TypeScript files are compiled properly

2. **Authentication Errors**:
   - Verify your token or credentials are correct
   - Check that environment variables are properly set
   - Ensure your token has not expired

3. **Failed to Create Pages**:
   - Verify you have permission to create pages in the specified space
   - Check that the parent page ID exists and is accessible

4. **Formatting Issues**:
   - Complex Markdown might not convert perfectly to Confluence
   - Try simplifying the Markdown or test with smaller documents first

### Debugging

For additional debug information, you can run the CLI with Node's debug flag:

```bash
NODE_DEBUG=doc-gen-mcp bin/gendoc.js --input ./src --confluence
```

## Examples

### Generate Documentation from Code Comments

```bash
bin/gendoc.js --input ./src --confluence --page-title "API Documentation"
```

### Export Rules from JSON File by Category

```bash
bin/gendoc.js --input ./rules/cursorrules.json --confluence --by-category
```

### Export with AI-Generated Documentation

```bash
bin/gendoc.js --input ./src --ai --ai-provider openai --openai-key $OPENAI_API_KEY --confluence --page-title "API Documentation"
``` 