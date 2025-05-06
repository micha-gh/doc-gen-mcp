/**
 * Confluence Exporter for doc-gen-mcp
 * 
 * Handles the export of generated documentation to Confluence pages
 * via the Confluence REST API.
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';
import { markdownToConfluence } from './markdownConverter.js';
import { BaseExporter, ExportContent, ExportOptions, ExportResult } from '../core/plugins/BaseExporter.js';

// Simplified validation without external dependencies
function validateSimple(content: ExportContent): { 
  valid: boolean;
  issues?: Array<{ message: string; severity: 'error' | 'warning' | 'info' }> 
} {
  const issues: Array<{ message: string; severity: 'error' | 'warning' | 'info' }> = [];
  
  // Basic validation logic
  if (!content.entries?.length && !content.rawContent) {
    issues.push({
      message: 'No content to export',
      severity: 'error'
    });
  }
  
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
          severity: 'error'
        });
      }
    });
  }
  
  return {
    valid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues
  };
}

interface ConfluenceAuth {
  method: 'token' | 'basic';
  token?: string;
  username?: string;
  password?: string;
}

interface ConfluenceConfig {
  baseUrl: string;
  spaceKey: string;
  parentPageId?: string;
  auth: ConfluenceAuth;
  defaultLabels?: string[];
}

interface PushToConfluenceOptions {
  title: string;
  content: string;
  labels?: string[];
  path?: string;
  ancestors?: { id: string }[];
  isMarkdown?: boolean;
}

/**
 * ConfluenceExporter - Implementiert den Export von Dokumentation nach Confluence
 */
export class ConfluenceExporter extends BaseExporter {
  /**
   * Eindeutiger Name des Exporters
   */
  public readonly name = 'confluence';
  
  /**
   * Beschreibung des Exporters
   */
  public readonly description = 'Exportiert Dokumentation zu Confluence über die REST API';
  
  /**
   * Unterstützte Formate
   */
  public readonly supportedFormats = ['confluence', 'atlassian'];
  
  /**
   * Pfad zur Standardkonfigurationsdatei
   */
  public readonly defaultConfigPath = path.resolve(process.cwd(), 'config', 'confluence.json');
  
  private config: ConfluenceConfig | null = null;
  
  /**
   * Prüft, ob der Exporter für die aktuelle Umgebung konfiguriert ist
   */
  public async isConfigured(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      
      // Prüfe auf erforderliche Konfigurationselemente
      return !!(
        config &&
        config.baseUrl &&
        config.spaceKey &&
        config.auth &&
        ((config.auth.method === 'token' && config.auth.token) ||
         (config.auth.method === 'basic' && config.auth.username && config.auth.password))
      );
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Führt den Export nach Confluence durch
   */
  public async export(content: ExportContent, options?: ExportOptions): Promise<ExportResult> {
    try {
      // Lade Konfiguration, falls noch nicht geschehen
      if (!this.config) {
        this.config = await this.loadConfig(options?.configPath);
      }
      
      // Validiere Inhalt, wenn gewünscht
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
      
      // Verarbeite den Inhalt
      const results = [];
      
      // Wenn Rohdaten vorhanden sind, exportiere diese direkt
      if (content.rawContent) {
        const result = await this.pushToConfluence({
          title: options?.title || 'Documentation',
          content: content.rawContent,
          labels: options?.labels,
          isMarkdown: true
        });
        results.push(result);
      }
      
      // Verarbeite einzelne Einträge, wenn vorhanden
      if (content.entries?.length) {
        // Gruppiere nach Kategorie, wenn gewünscht
        if (options?.byCategory) {
          const categories: Record<string, typeof content.entries> = {};
          
          for (const entry of content.entries) {
            const category = entry.category || 'Uncategorized';
            if (!categories[category]) {
              categories[category] = [];
            }
            categories[category].push(entry);
          }
          
          // Exportiere jede Kategorie als eigene Seite
          for (const [category, entries] of Object.entries(categories)) {
            const categoryContent = entries.map(entry => {
              return `<h2>${entry.title}</h2>\n${entry.content}`;
            }).join('\n\n');
            
            const result = await this.pushToConfluence({
              title: `${options?.title || 'Documentation'} - ${category}`,
              content: categoryContent,
              labels: [...(options?.labels || []), category],
              isMarkdown: true
            });
            
            results.push(result);
          }
        } else {
          // Exportiere alle Einträge als eine Seite
          const combinedContent = content.entries.map(entry => {
            return `<h2>${entry.title}</h2>\n${entry.content}`;
          }).join('\n\n');
          
          const result = await this.pushToConfluence({
            title: options?.title || 'Documentation',
            content: combinedContent,
            labels: options?.labels,
            isMarkdown: true
          });
          
          results.push(result);
        }
      }
      
      return {
        success: true,
        details: { pages: results }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Export to Confluence failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Lädt die Konfiguration für den Confluence-Exporter
   */
  public async loadConfig(configPath?: string): Promise<ConfluenceConfig> {
    const filePath = configPath || this.defaultConfigPath;
    
    try {
      const configContent = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(configContent);
      
      // Handle environment variables in the token
      if (config.auth?.token && config.auth.token.startsWith('$')) {
        const envVar = config.auth.token.substring(1);
        config.auth.token = process.env[envVar] || '';
        
        if (!config.auth.token) {
          console.warn(`Warning: Environment variable ${envVar} not found for Confluence token`);
        }
      }
      
      this.config = config;
      return config;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to load Confluence configuration: ${errorMessage}`);
    }
  }
  
  /**
   * Validiert den Inhalt vor dem Export
   */
  public async validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;
  }> {
    return validateSimple(content);
  }
  
  /**
   * Macht eine Anfrage an die Confluence API
   * 
   * @param config Confluence configuration
   * @param method HTTP method
   * @param apiPath API path to append to base URL
   * @param data Request body data (for POST/PUT)
   * @returns Promise with the response
   */
  private async confluenceApiRequest(
    config: ConfluenceConfig, 
    method: string, 
    apiPath: string, 
    data?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const baseUrlObj = new URL(config.baseUrl);
      const apiUrl = new URL(apiPath, baseUrlObj.origin);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Add authentication
      if (config.auth.method === 'token') {
        headers['Authorization'] = `Bearer ${config.auth.token}`;
      } else if (config.auth.method === 'basic') {
        const authString = `${config.auth.username}:${config.auth.password}`;
        headers['Authorization'] = `Basic ${Buffer.from(authString).toString('base64')}`;
      }
      
      // Add content length if sending data
      if (data) {
        headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data)).toString();
      }
      
      const options: https.RequestOptions = {
        hostname: apiUrl.hostname,
        path: apiUrl.pathname + apiUrl.search,
        method: method,
        headers: headers
      };
      
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          if (statusCode >= 200 && statusCode < 300) {
            try {
              resolve(responseData ? JSON.parse(responseData) : {});
            } catch (e) {
              resolve(responseData);
            }
          } else {
            reject(new Error(`Confluence API request failed: ${statusCode} - ${responseData}`));
          }
        });
      });
      
      req.on('error', (e) => {
        reject(new Error(`Confluence API request error: ${e.message}`));
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
  
  /**
   * Checks if a page with the given title exists in the Confluence space
   * 
   * @param config Confluence configuration
   * @param title Page title to check
   * @returns Promise with page data if exists, null otherwise
   */
  private async findPageByTitle(config: ConfluenceConfig, title: string): Promise<any> {
    const encodedTitle = encodeURIComponent(title);
    const apiPath = `/rest/api/content?spaceKey=${config.spaceKey}&title=${encodedTitle}&expand=version`;
    
    try {
      const response = await this.confluenceApiRequest(config, 'GET', apiPath);
      if (response.results && response.results.length > 0) {
        return response.results[0];
      }
      return null;
    } catch (error) {
      console.error(`Error finding page "${title}":`, error);
      return null;
    }
  }
  
  /**
   * Pushes content to a Confluence page
   * 
   * @param options Options for the push operation
   * @returns Promise with the result of the operation
   */
  private async pushToConfluence(options: PushToConfluenceOptions): Promise<any> {
    if (!this.config) {
      throw new Error('Confluence configuration not loaded');
    }
    
    const config = this.config;
    
    if (!options.title || !options.content) {
      throw new Error('Title and content are required for pushing to Confluence');
    }
    
    // Combine default labels with provided labels
    const labels = [...(config.defaultLabels || []), ...(options.labels || [])];
    
    // Convert from Markdown to Confluence HTML if content is Markdown
    const content = options.isMarkdown 
      ? markdownToConfluence(options.content)
      : options.content;
    
    // Check if the page already exists
    const existingPage = await this.findPageByTitle(config, options.title);
    
    if (existingPage) {
      // Update existing page
      const pageId = existingPage.id;
      const version = existingPage.version.number;
      
      const updateData = {
        id: pageId,
        type: 'page',
        title: options.title,
        space: { key: config.spaceKey },
        body: {
          storage: {
            value: content,
            representation: 'storage'
          }
        },
        version: {
          number: version + 1
        },
        metadata: {
          labels: labels.map(name => ({ name }))
        }
      };
      
      return this.confluenceApiRequest(
        config, 
        'PUT', 
        `/rest/api/content/${pageId}`, 
        updateData
      );
    } else {
      // Create new page
      const createData: any = {
        type: 'page',
        title: options.title,
        space: { key: config.spaceKey },
        body: {
          storage: {
            value: content,
            representation: 'storage'
          }
        },
        metadata: {
          labels: labels.map(name => ({ name }))
        }
      };
      
      // Add ancestors (parent pages) if provided, or use default from config
      if (options.ancestors) {
        createData.ancestors = options.ancestors;
      } else if (config.parentPageId) {
        createData.ancestors = [{ id: config.parentPageId }];
      }
      
      return this.confluenceApiRequest(
        config, 
        'POST', 
        '/rest/api/content', 
        createData
      );
    }
  }
}

// Export as default for dynamic loading
export default ConfluenceExporter; 