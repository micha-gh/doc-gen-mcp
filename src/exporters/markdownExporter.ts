/**
 * Markdown Exporter for doc-gen-mcp
 * 
 * This exporter generates Markdown documentation from the provided content.
 * It supports various Markdown flavors and customization options.
 */
import fs from 'fs';
import path from 'path';
import { BaseExporter, ExportContent, ExportOptions, ExportResult } from '../core/plugins/BaseExporter.js';

interface MarkdownConfig {
  /**
   * Markdown flavor to use (default: 'github')
   */
  flavor?: 'github' | 'commonmark' | 'standard';
  
  /**
   * Default heading level for section titles (default: 2)
   */
  headingLevel?: number;
  
  /**
   * Character to use for bullet points (default: '-')
   */
  bulletChar?: string;
  
  /**
   * Whether to add a table of contents (default: true)
   */
  tableOfContents?: boolean;
  
  /**
   * Options for code block formatting
   */
  codeBlocks?: {
    /**
     * Whether to add language identifiers to code blocks (default: true)
     */
    addLanguage?: boolean;
    
    /**
     * Default language for code blocks without specified language (default: 'text')
     */
    defaultLanguage?: string;
  };
  
  /**
   * Template file to use for generation
   */
  templateFile?: string;
}

// Simple validation function for content
function validateMarkdownContent(content: ExportContent): {
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
 * MarkdownExporter - Implements the export of documentation to Markdown files
 */
export class MarkdownExporter extends BaseExporter {
  /**
   * Unique name of the exporter
   */
  public readonly name = 'markdown';
  
  /**
   * Description of the exporter
   */
  public readonly description = 'Exports documentation to Markdown files';
  
  /**
   * Supported formats
   */
  public readonly supportedFormats = ['md', 'markdown', 'gfm', 'commonmark'];
  
  /**
   * Path to the default configuration file
   */
  public readonly defaultConfigPath = path.resolve(process.cwd(), 'config', 'markdown.json');
  
  /**
   * Current configuration
   */
  private config: MarkdownConfig = {
    flavor: 'github',
    headingLevel: 2,
    bulletChar: '-',
    tableOfContents: true,
    codeBlocks: {
      addLanguage: true,
      defaultLanguage: 'text'
    }
  };
  
  /**
   * Checks if the exporter is configured for the current environment
   */
  public async isConfigured(): Promise<boolean> {
    // Markdown exporter is always configured as it doesn't require external connections
    return true;
  }
  
  /**
   * Exports content to Markdown
   */
  public async export(content: ExportContent, options?: ExportOptions): Promise<ExportResult> {
    try {
      // Load configuration if provided
      if (options?.configPath) {
        try {
          await this.loadConfig(options.configPath);
        } catch (err) {
          console.warn(`Warning: Could not load Markdown config, using defaults. Error: ${err instanceof Error ? err.message : String(err)}`);
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
      
      // Generate the markdown content
      const markdown = this.generateMarkdown(content, options);
      
      // If output file is specified, write to file
      if (options?.outputFile) {
        const outputDir = path.dirname(options.outputFile);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write the file
        fs.writeFileSync(options.outputFile, markdown, 'utf8');
        
        return {
          success: true,
          details: { 
            outputFile: options.outputFile,
            byteCount: Buffer.byteLength(markdown),
            lineCount: markdown.split('\n').length
          }
        };
      }
      
      // Otherwise return the generated content
      return {
        success: true,
        details: { 
          content: markdown,
          byteCount: Buffer.byteLength(markdown),
          lineCount: markdown.split('\n').length
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Failed to export to Markdown: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
  
  /**
   * Loads the Markdown exporter configuration
   */
  public async loadConfig(configPath?: string): Promise<MarkdownConfig> {
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
        codeBlocks: {
          ...this.config.codeBlocks,
          ...(loadedConfig.codeBlocks || {})
        }
      };
      
      return this.config;
    } catch (err) {
      throw new Error(`Failed to load Markdown configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  /**
   * Validates the content before export
   */
  public async validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
  }> {
    return validateMarkdownContent(content);
  }
  
  /**
   * Generates Markdown from the provided content
   */
  private generateMarkdown(content: ExportContent, options?: ExportOptions): string {
    let markdown = '';
    
    // If we have a title, add it as the main heading
    if (options?.title) {
      markdown += `# ${options.title}\n\n`;
    }
    
    // Add table of contents if enabled
    if (this.config.tableOfContents && content.entries?.length) {
      markdown += "## Table of Contents\n\n";
      
      // Group entries by category if there are categories
      const categories = new Set<string>();
      content.entries.forEach(entry => {
        if (entry.category) categories.add(entry.category);
      });
      
      if (categories.size > 0) {
        categories.forEach(category => {
          markdown += `- [${category}](#${this.slugify(category)})\n`;
          
          content.entries
            ?.filter(entry => entry.category === category)
            .forEach(entry => {
              markdown += `  - [${entry.title}](#${this.slugify(entry.title)})\n`;
            });
        });
      } else {
        // No categories, just list entries
        content.entries?.forEach(entry => {
          markdown += `- [${entry.title}](#${this.slugify(entry.title)})\n`;
        });
      }
      
      markdown += "\n\n";
    }
    
    // If raw content is provided, use it directly
    if (content.rawContent) {
      markdown += content.rawContent;
    }
    // Otherwise process the entries
    else if (content.entries?.length) {
      // Group by category if byCategory is enabled
      if (options?.byCategory) {
        const categories: Record<string, typeof content.entries> = {};
        
        // Group entries by category
        content.entries.forEach(entry => {
          const category = entry.category || 'Uncategorized';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(entry);
        });
        
        // Generate content for each category
        Object.entries(categories).forEach(([category, entries]) => {
          // Add category heading
          const headingLevel = this.config.headingLevel ?? 2;
          markdown += `${'#'.repeat(headingLevel)} ${category}\n\n`;
          
          // Add entries
          entries.forEach(entry => {
            // Add entry heading
            markdown += `${'#'.repeat(headingLevel + 1)} ${entry.title}\n\n`;
            
            // Add entry content
            markdown += `${entry.content}\n\n`;
            
            // Add code examples if available
            if (entry.code) {
              Object.entries(entry.code).forEach(([lang, code]) => {
                const langIndicator = this.config.codeBlocks?.addLanguage ? lang : '';
                markdown += "```" + langIndicator + "\n";
                markdown += code + "\n";
                markdown += "```\n\n";
              });
            }
          });
        });
      } else {
        // Output entries without categorization
        const headingLevel = this.config.headingLevel ?? 2;
        content.entries.forEach(entry => {
          // Add entry heading
          markdown += `${'#'.repeat(headingLevel)} ${entry.title}\n\n`;
          
          // Add entry content
          markdown += `${entry.content}\n\n`;
          
          // Add code examples if available
          if (entry.code) {
            Object.entries(entry.code).forEach(([lang, code]) => {
              const langIndicator = this.config.codeBlocks?.addLanguage ? lang : '';
              markdown += "```" + langIndicator + "\n";
              markdown += code + "\n";
              markdown += "```\n\n";
            });
          }
        });
      }
    }
    
    return markdown;
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
export default MarkdownExporter; 