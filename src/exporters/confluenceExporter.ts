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
 * Loads the Confluence configuration from the specified file
 * 
 * @param configPath Path to the configuration file
 * @returns Parsed Confluence configuration object
 */
export function loadConfluenceConfig(configPath?: string): ConfluenceConfig {
  const defaultPath = path.resolve(process.cwd(), 'config', 'confluence.json');
  const filePath = configPath || defaultPath;
  
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
    
    return config;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load Confluence configuration: ${errorMessage}`);
  }
}

/**
 * Makes a request to the Confluence API
 * 
 * @param config Confluence configuration
 * @param method HTTP method
 * @param apiPath API path to append to base URL
 * @param data Request body data (for POST/PUT)
 * @returns Promise with the response
 */
async function confluenceApiRequest(
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
async function findPageByTitle(config: ConfluenceConfig, title: string): Promise<any> {
  const encodedTitle = encodeURIComponent(title);
  const apiPath = `/rest/api/content?spaceKey=${config.spaceKey}&title=${encodedTitle}&expand=version`;
  
  try {
    const response = await confluenceApiRequest(config, 'GET', apiPath);
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
 * @param configPath Optional path to the configuration file
 * @returns Promise with the result of the operation
 */
export async function pushToConfluence(
  options: PushToConfluenceOptions, 
  configPath?: string
): Promise<any> {
  const config = loadConfluenceConfig(configPath);
  
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
  const existingPage = await findPageByTitle(config, options.title);
  
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
    
    return confluenceApiRequest(
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
    
    return confluenceApiRequest(
      config, 
      'POST', 
      '/rest/api/content', 
      createData
    );
  }
}

export default {
  loadConfluenceConfig,
  pushToConfluence
}; 