# HTML Exporter Usage Guide

The HTML exporter allows you to generate beautiful, interactive HTML documentation from your codebase. This guide will walk you through using the HTML exporter with doc-gen-mcp.

## Features

- **Customizable Templates**: Use the default template or provide your own HTML template file
- **CSS Styling Options**: Customize the look and feel with inline styles or external stylesheets
- **Interactive Features**: Enable collapsible sections and search functionality
- **Table of Contents**: Automatically generated navigation
- **Category Navigation**: Group documentation by categories
- **Breadcrumbs**: Navigational aid for deep documentation
- **Light/Dark Themes**: Support for different color themes
- **Code Syntax Highlighting**: Proper formatting for code examples

## Basic Usage

To export documentation to HTML using the CLI:

```bash
bin/gendoc.js --input ./src --export-format html --output-file docs/documentation.html
```

## Configuration Options

You can configure the HTML exporter using a configuration file. Create a `html.json` file in your project's `config` directory or specify a path with the `--exporter-config` option.

Here's an example configuration file:

```json
{
  "styles": {
    "theme": "light",
    "cssFile": "path/to/custom.css",
    "externalStylesheets": [
      "https://cdn.example.com/styles.css"
    ]
  },
  "scripts": {
    "enableInteractiveFeatures": true,
    "enableSearch": true,
    "jsFile": "path/to/custom.js",
    "externalScripts": [
      "https://cdn.example.com/script.js"
    ]
  },
  "display": {
    "tableOfContents": true,
    "categoryNavigation": true,
    "breadcrumbs": true,
    "metaInfo": true
  }
}
```

## Using a Custom Template

You can provide your own HTML template file. The template can use the following placeholders:

- `{{title}}`: The document title
- `{{stylesheets}}`: Generated stylesheet links
- `{{styles}}`: Inline CSS styles
- `{{theme}}`: Current theme (light/dark)
- `{{breadcrumbs}}`: Navigation breadcrumbs
- `{{toc}}`: Table of contents
- `{{content}}`: Main documentation content
- `{{date}}`: Generation date
- `{{scripts}}`: External script tags
- `{{inlineScript}}`: Inline JavaScript

Conditional blocks:
- `{{#if showToc}}...{{/if}}`: Only show content if TOC is enabled
- `{{#if showMeta}}...{{/if}}`: Only show content if meta info is enabled

## Programmatic Usage

You can also use the HTML exporter programmatically:

```typescript
import { exporterManager } from './src/core/plugins/ExporterManager.js';
import { HtmlExporter } from './src/exporters/htmlExporter.js';

// Register the HTML exporter
exporterManager.registerExporter('html', () => new HtmlExporter());

// Get exporter instance
const exporter = exporterManager.getExporter('html');

// Load custom configuration
await exporter.loadConfig('./my-config.json');

// Export content
const result = await exporter.export({
  entries: [
    {
      title: 'Getting Started',
      content: '# Introduction\n\nWelcome to the documentation...',
      category: 'Guides'
    },
    {
      title: 'Configuration',
      content: '# Configuration Options\n\n...',
      category: 'Guides',
      code: {
        json: '{\n  "option": "value"\n}'
      }
    }
  ]
}, {
  title: 'Project Documentation',
  outputFile: 'docs/output.html',
  byCategory: true
});

if (result.success) {
  console.log('Documentation exported successfully!');
} else {
  console.error('Error exporting documentation:', result.error);
}
```

## Customizing the Output

### Themes

The HTML exporter supports light and dark themes. You can set the theme in the configuration:

```json
{
  "styles": {
    "theme": "dark"
  }
}
```

Valid options: `"light"`, `"dark"`, `"auto"` (uses system preference)

### Interactive Features

Enable or disable interactive features:

```json
{
  "scripts": {
    "enableInteractiveFeatures": true,
    "enableSearch": true
  }
}
```

When enabled, code examples will be collapsible, and a search box will be added to filter documentation entries.

## Migrating from Other Exporters

If you're migrating from other exporters like Markdown, the HTML exporter will automatically convert Markdown content to HTML. No additional configuration is needed.

## Troubleshooting

If you encounter issues with the HTML exporter:

1. Check your configuration file for syntax errors
2. Ensure any custom template files exist and are properly formatted
3. Verify that custom CSS and JS files are accessible

For more detailed diagnostics, run with the `--verbose` flag:

```bash
bin/gendoc.js --input ./src --export-format html --verbose
``` 