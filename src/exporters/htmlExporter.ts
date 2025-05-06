/**
 * HTML Exporter for doc-gen-mcp
 * 
 * This exporter generates HTML documentation from the provided content.
 * It supports customizable templates, CSS styling, and interactive features.
 */
import fs from 'fs';
import path from 'path';
import { BaseExporter, ExportContent, ExportOptions, ExportResult } from '../core/plugins/BaseExporter.js';

interface HtmlConfig {
  /**
   * Path to custom HTML template file
   */
  templateFile?: string;
  
  /**
   * CSS styling options
   */
  styles?: {
    /**
     * Path to custom CSS file
     */
    cssFile?: string;
    
    /**
     * Inline CSS styles as string
     */
    inlineStyles?: string;
    
    /**
     * External CSS stylesheets to include
     */
    externalStylesheets?: string[];
    
    /**
     * Theme to use (default: 'light')
     */
    theme?: 'light' | 'dark' | 'auto';
  };
  
  /**
   * JavaScript options
   */
  scripts?: {
    /**
     * Path to custom JS file
     */
    jsFile?: string;
    
    /**
     * Inline JavaScript as string
     */
    inlineScript?: string;
    
    /**
     * External JavaScript files to include
     */
    externalScripts?: string[];
    
    /**
     * Enable interactive features like collapsible sections
     */
    enableInteractiveFeatures?: boolean;
    
    /**
     * Enable search functionality
     */
    enableSearch?: boolean;
  };
  
  /**
   * Content display options
   */
  display?: {
    /**
     * Show table of contents (default: true)
     */
    tableOfContents?: boolean;
    
    /**
     * Add category navigation (default: true)
     */
    categoryNavigation?: boolean;
    
    /**
     * Add breadcrumbs (default: true)
     */
    breadcrumbs?: boolean;
    
    /**
     * Add meta information like generation date (default: true)
     */
    metaInfo?: boolean;
  };
}

// Simple content validation function
function validateHtmlContent(content: ExportContent): {
  valid: boolean;
  issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
} {
  const issues: Array<{message: string; severity: 'error' | 'warning' | 'info'}> = [];
  
  // Check if there's any content to export
  if (!content.rawContent && (!content.entries || content.entries.length === 0)) {
    issues.push({
      message: 'No content to export',
      severity: 'error'
    });
  }
  
  // Check entries for required fields
  if (content.entries) {
    content.entries.forEach((entry, index) => {
      if (!entry.title) {
        issues.push({
          message: `Entry at index ${index} has no title`,
          severity: 'error'
        });
      }
      
      if (!entry.content) {
        issues.push({
          message: `Entry at index ${index} has no content`,
          severity: 'warning'
        });
      }
    });
  }
  
  return {
    valid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues
  };
}

/**
 * HtmlExporter - Implements the export of documentation to HTML files
 */
export class HtmlExporter extends BaseExporter {
  /**
   * Unique name of the exporter
   */
  public readonly name = 'html';
  
  /**
   * Description of the exporter
   */
  public readonly description = 'Exports documentation to HTML files';
  
  /**
   * Supported formats
   */
  public readonly supportedFormats = ['html', 'htm', 'xhtml'];
  
  /**
   * Path to the default configuration file
   */
  public readonly defaultConfigPath = path.resolve(process.cwd(), 'config', 'html.json');
  
  /**
   * Current configuration
   */
  private config: HtmlConfig = {
    styles: {
      theme: 'light'
    },
    scripts: {
      enableInteractiveFeatures: true,
      enableSearch: true
    },
    display: {
      tableOfContents: true,
      categoryNavigation: true,
      breadcrumbs: true,
      metaInfo: true
    }
  };
  
  /**
   * Default HTML template
   */
  private readonly DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  {{stylesheets}}
  <style>{{styles}}</style>
</head>
<body class="theme-{{theme}}">
  <header>
    <h1>{{title}}</h1>
    {{breadcrumbs}}
  </header>
  
  <div class="container">
    {{#if showToc}}
    <nav class="toc">
      <h2>Table of Contents</h2>
      {{toc}}
    </nav>
    {{/if}}
    
    <main>
      {{content}}
    </main>
  </div>
  
  <footer>
    {{#if showMeta}}
    <div class="meta">
      Generated on {{date}} with doc-gen-mcp
    </div>
    {{/if}}
  </footer>
  
  {{scripts}}
  <script>{{inlineScript}}</script>
</body>
</html>`;

  /**
   * Default CSS styles
   */
  private readonly DEFAULT_STYLES = `
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  color: #333;
}

.theme-dark {
  background-color: #222;
  color: #eee;
}

.theme-light {
  background-color: #fff;
  color: #333;
}

.container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

header {
  background-color: #f4f4f4;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.theme-dark header {
  background-color: #333;
  border-bottom: 1px solid #444;
}

nav.toc {
  width: 250px;
  padding-right: 1rem;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: 100vh;
  overflow-y: auto;
}

main {
  flex: 1;
  min-width: 0;
}

footer {
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #777;
  border-top: 1px solid #ddd;
}

.theme-dark footer {
  color: #999;
  border-top: 1px solid #444;
}

code {
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
}

.theme-dark code {
  background-color: #333;
}

pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
}

.theme-dark pre {
  background-color: #333;
}

pre code {
  background-color: transparent;
  padding: 0;
}

.collapsible {
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.theme-dark .collapsible {
  border: 1px solid #444;
}

.collapsible-header {
  background-color: #f5f5f5;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;
}

.theme-dark .collapsible-header {
  background-color: #333;
}

.collapsible-content {
  padding: 1rem;
  display: none;
}

.expanded .collapsible-content {
  display: block;
}

.toc ul {
  list-style-type: none;
  padding-left: 1.5rem;
}

.toc li {
  margin-bottom: 0.5rem;
}

.toc a {
  text-decoration: none;
  color: #0066cc;
}

.theme-dark .toc a {
  color: #5bf;
}

.toc a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  nav.toc {
    width: 100%;
    margin-bottom: 2rem;
  }
}
`;

  /**
   * Default JavaScript for interactive features
   */
  private readonly DEFAULT_SCRIPT = `
// Collapsible sections
document.addEventListener('DOMContentLoaded', function() {
  const collapsibles = document.querySelectorAll('.collapsible-header');
  
  collapsibles.forEach(header => {
    header.addEventListener('click', function() {
      const parent = this.parentElement;
      parent.classList.toggle('expanded');
    });
  });
  
  // Initialize search if enabled
  if (document.getElementById('search-box')) {
    initSearch();
  }
});

// Simple search functionality
function initSearch() {
  const searchBox = document.getElementById('search-box');
  const sections = document.querySelectorAll('main > section');
  
  searchBox.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length < 2) {
      sections.forEach(section => {
        section.style.display = 'block';
      });
      return;
    }
    
    sections.forEach(section => {
      const title = section.querySelector('h2, h3, h4').textContent.toLowerCase();
      const content = section.textContent.toLowerCase();
      
      if (title.includes(searchTerm) || content.includes(searchTerm)) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  });
}
`;
  
  /**
   * Checks if the exporter is configured for the current environment
   */
  public async isConfigured(): Promise<boolean> {
    // HTML exporter is always configured as it doesn't require external connections
    return true;
  }
  
  /**
   * Exports content to HTML
   */
  public async export(content: ExportContent, options?: ExportOptions): Promise<ExportResult> {
    try {
      // Load configuration if provided
      if (options?.configPath) {
        try {
          await this.loadConfig(options.configPath);
        } catch (err) {
          console.warn(`Warning: Could not load HTML config, using defaults. Error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      // Validate the content if requested
      if (options?.validateBeforeExport) {
        const validation = await this.validateContent(content);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.issues?.map(i => i.message).join(', ')}`,
            details: { validation }
          };
        }
      }
      
      // Generate the HTML content
      const html = await this.generateHtml(content, options);
      
      // If output file is specified, write to file
      if (options?.outputFile) {
        const outputDir = path.dirname(options.outputFile);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write the file
        fs.writeFileSync(options.outputFile, html, 'utf8');
        
        return {
          success: true,
          details: { 
            outputFile: options.outputFile,
            byteCount: Buffer.byteLength(html),
            lineCount: html.split('\n').length
          }
        };
      }
      
      // Otherwise return the generated content
      return {
        success: true,
        details: { 
          content: html,
          byteCount: Buffer.byteLength(html),
          lineCount: html.split('\n').length
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to export to HTML: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
  
  /**
   * Loads the HTML exporter configuration
   */
  public async loadConfig(configPath?: string): Promise<HtmlConfig> {
    const filePath = configPath || this.defaultConfigPath;
    
    try {
      if (!fs.existsSync(filePath)) {
        return this.config;
      }
      
      const configContent = fs.readFileSync(filePath, 'utf8');
      const loadedConfig = JSON.parse(configContent);
      
      // Merge with default config
      this.config = {
        ...this.config,
        ...loadedConfig,
        styles: {
          ...this.config.styles,
          ...(loadedConfig.styles || {})
        },
        scripts: {
          ...this.config.scripts,
          ...(loadedConfig.scripts || {})
        },
        display: {
          ...this.config.display,
          ...(loadedConfig.display || {})
        }
      };
      
      return this.config;
    } catch (err) {
      throw new Error(`Failed to load HTML configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  /**
   * Validates the content before export
   */
  public async validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
  }> {
    return validateHtmlContent(content);
  }
  
  /**
   * Generates HTML from the provided content
   */
  private async generateHtml(content: ExportContent, options?: ExportOptions): Promise<string> {
    // Get template
    let template = this.DEFAULT_TEMPLATE;
    
    if (this.config.templateFile && fs.existsSync(this.config.templateFile)) {
      template = fs.readFileSync(this.config.templateFile, 'utf8');
    }
    
    // Prepare template data
    const title = options?.title || 'Documentation';
    const date = new Date().toLocaleString();
    const theme = this.config.styles?.theme || 'light';
    
    // Generate stylesheets
    let stylesheets = '';
    if (this.config.styles?.externalStylesheets?.length) {
      stylesheets = this.config.styles.externalStylesheets
        .map(css => `<link rel="stylesheet" href="${css}">`)
        .join('\n  ');
    }
    
    // Generate styles
    let styles = this.DEFAULT_STYLES;
    if (this.config.styles?.cssFile && fs.existsSync(this.config.styles.cssFile)) {
      styles = fs.readFileSync(this.config.styles.cssFile, 'utf8');
    } else if (this.config.styles?.inlineStyles) {
      styles = this.config.styles.inlineStyles;
    }
    
    // Generate scripts
    let scripts = '';
    if (this.config.scripts?.externalScripts?.length) {
      scripts = this.config.scripts.externalScripts
        .map(js => `<script src="${js}"></script>`)
        .join('\n  ');
    }
    
    // Generate inline script
    let inlineScript = '';
    if (this.config.scripts?.enableInteractiveFeatures) {
      inlineScript = this.DEFAULT_SCRIPT;
    }
    
    if (this.config.scripts?.jsFile && fs.existsSync(this.config.scripts.jsFile)) {
      inlineScript = fs.readFileSync(this.config.scripts.jsFile, 'utf8');
    } else if (this.config.scripts?.inlineScript) {
      inlineScript = this.config.scripts.inlineScript;
    }
    
    // Generate table of contents
    const showToc = this.config.display?.tableOfContents !== false && content.entries?.length;
    let toc = '';
    
    // Generate breadcrumbs
    let breadcrumbs = '';
    if (this.config.display?.breadcrumbs) {
      breadcrumbs = `<div class="breadcrumbs">
        <a href="#">Home</a> &raquo; ${title}
      </div>`;
    }
    
    // Generate main content
    let mainContent = '';
    
    if (content.rawContent) {
      // If raw content is provided, use it directly
      mainContent = content.rawContent;
    } else if (content.entries?.length) {
      // Process entries and generate HTML content
      
      // Extract categories if needed
      const categories = new Set<string>();
      if (content.entries.some(e => e.category)) {
        content.entries.forEach(entry => {
          if (entry.category) categories.add(entry.category);
        });
      }
      
      // Generate table of contents if enabled
      if (showToc) {
        toc = '<ul>';
        
        if (categories.size > 0) {
          // Group by category in TOC
          Array.from(categories).forEach(category => {
            const categoryId = this.slugify(category);
            toc += `<li><a href="#${categoryId}">${category}</a>`;
            
            // Add entries for this category
            const categoryEntries = content.entries?.filter(e => e.category === category);
            if (categoryEntries?.length) {
              toc += '<ul>';
              categoryEntries.forEach(entry => {
                const entryId = this.slugify(entry.title);
                toc += `<li><a href="#${entryId}">${entry.title}</a></li>`;
              });
              toc += '</ul>';
            }
            
            toc += '</li>';
          });
        } else {
          // Flat structure in TOC
          content.entries.forEach(entry => {
            const entryId = this.slugify(entry.title);
            toc += `<li><a href="#${entryId}">${entry.title}</a></li>`;
          });
        }
        
        toc += '</ul>';
      }
      
      // Add search box if enabled
      if (this.config.scripts?.enableSearch) {
        mainContent += `<div class="search-container">
          <input type="text" id="search-box" placeholder="Search documentation...">
        </div>`;
      }
      
      // Generate content, group by category if byCategory is true or if we have categories
      if (options?.byCategory || categories.size > 0) {
        // Create a map of categories to entries
        const categorizedEntries: Record<string, typeof content.entries> = {};
        
        content.entries.forEach(entry => {
          const category = entry.category || 'Uncategorized';
          if (!categorizedEntries[category]) {
            categorizedEntries[category] = [];
          }
          categorizedEntries[category].push(entry);
        });
        
        // Generate content for each category
        Object.entries(categorizedEntries).forEach(([category, entries]) => {
          const categoryId = this.slugify(category);
          mainContent += `<section id="${categoryId}" class="category">
            <h2>${category}</h2>`;
          
          // Add entries for this category
          entries.forEach(entry => {
            const entryId = this.slugify(entry.title);
            let entryContent = `<section id="${entryId}" class="entry">
              <h3>${entry.title}</h3>
              <div class="content">${this.markdownToHtml(entry.content)}</div>`;
            
            // Add code examples if available
            if (entry.code && Object.keys(entry.code).length > 0) {
              if (this.config.scripts?.enableInteractiveFeatures) {
                // Make code examples collapsible
                entryContent += `<div class="collapsible">
                  <div class="collapsible-header">Code Examples</div>
                  <div class="collapsible-content">`;
                
                Object.entries(entry.code).forEach(([lang, code]) => {
                  entryContent += `<h4>${lang}</h4>
                    <pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
                });
                
                entryContent += `</div></div>`;
              } else {
                // Static code examples
                entryContent += `<div class="code-examples">
                  <h4>Code Examples</h4>`;
                
                Object.entries(entry.code).forEach(([lang, code]) => {
                  entryContent += `<h5>${lang}</h5>
                    <pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
                });
                
                entryContent += `</div>`;
              }
            }
            
            entryContent += `</section>`;
            mainContent += entryContent;
          });
          
          mainContent += `</section>`;
        });
      } else {
        // Just list all entries without categorization
        content.entries.forEach(entry => {
          const entryId = this.slugify(entry.title);
          let entryContent = `<section id="${entryId}" class="entry">
            <h2>${entry.title}</h2>
            <div class="content">${this.markdownToHtml(entry.content)}</div>`;
          
          // Add code examples if available
          if (entry.code && Object.keys(entry.code).length > 0) {
            if (this.config.scripts?.enableInteractiveFeatures) {
              // Make code examples collapsible
              entryContent += `<div class="collapsible">
                <div class="collapsible-header">Code Examples</div>
                <div class="collapsible-content">`;
              
              Object.entries(entry.code).forEach(([lang, code]) => {
                entryContent += `<h4>${lang}</h4>
                  <pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
              });
              
              entryContent += `</div></div>`;
            } else {
              // Static code examples
              entryContent += `<div class="code-examples">
                <h4>Code Examples</h4>`;
              
              Object.entries(entry.code).forEach(([lang, code]) => {
                entryContent += `<h5>${lang}</h5>
                  <pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`;
              });
              
              entryContent += `</div>`;
            }
          }
          
          entryContent += `</section>`;
          mainContent += entryContent;
        });
      }
    }
    
    // Replace template variables
    let html = template
      .replace(/{{title}}/g, title)
      .replace(/{{stylesheets}}/g, stylesheets)
      .replace(/{{styles}}/g, styles)
      .replace(/{{theme}}/g, theme)
      .replace(/{{breadcrumbs}}/g, breadcrumbs)
      .replace(/{{toc}}/g, toc)
      .replace(/{{content}}/g, mainContent)
      .replace(/{{date}}/g, date)
      .replace(/{{scripts}}/g, scripts)
      .replace(/{{inlineScript}}/g, inlineScript);
    
    // Replace conditional blocks
    html = html.replace(/{{#if showToc}}([\s\S]*?){{\/if}}/g, 
      showToc ? '$1' : '');
    
    html = html.replace(/{{#if showMeta}}([\s\S]*?){{\/if}}/g, 
      this.config.display?.metaInfo !== false ? '$1' : '');
    
    return html;
  }
  
  /**
   * Simple markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    // Replace headers (### Header -> <h3>Header</h3>)
    let html = markdown.replace(/^#{1,6}\s+(.*)$/gm, (match, text) => {
      const level = match.indexOf(' ');
      return `<h${level}>${text.trim()}</h${level}>`;
    });
    
    // Replace bold (**text** -> <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic (*text* -> <em>text</em>)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace links ([text](url) -> <a href="url">text</a>)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Replace code blocks (```lang\ncode\n``` -> <pre><code>code</code></pre>)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Replace inline code (`code` -> <code>code</code>)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Replace lists
    html = html.replace(/^(\s*)-\s+(.*?)$/gm, '<li>$2</li>');
    
    // Wrap paragraphs
    html = html.replace(/^(?!<[a-z])(.*?)$/gm, (match, text) => {
      if (text.trim() === '') return '';
      return `<p>${text}</p>`;
    });
    
    // Combine consecutive list items
    html = html.replace(/(<li>.*?<\/li>\n)+/g, match => {
      return `<ul>\n${match}</ul>\n`;
    });
    
    return html;
  }
  
  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Creates a URL-friendly slug from a string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-');     // Replace multiple hyphens with single hyphen
  }
}

// Export default for dynamic loading
export default HtmlExporter; 