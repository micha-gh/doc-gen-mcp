/**
 * Confluence export command implementation
 * 
 * This module handles the export of documentation to Confluence pages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateDocumentation } from './generateDocs.js';
import { isValidInput, detectFormat, normalizeEntries } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load the Confluence exporter module
 * @returns The Confluence exporter module
 */
async function loadConfluenceExporter() {
  try {
    // Try to import the TypeScript module (assuming it's compiled to JS)
    return await import('../dist/exporters/confluenceExporter.js');
  } catch (err) {
    try {
      // Fallback to direct import if running from source
      return await import('../src/exporters/confluenceExporter.js');
    } catch (err2) {
      throw new Error('Failed to load Confluence exporter. Make sure to build the project first: npm run build');
    }
  }
}

/**
 * Export documentation to Confluence
 * 
 * @param {Object} args Command arguments
 * @param {Object} args.input Documentation input (entries, rules, api, config)
 * @param {string} [args.configPath] Path to Confluence config file
 * @param {string} [args.parentPageId] Confluence parent page ID (overrides config)
 * @param {string} [args.spaceKey] Confluence space key (overrides config)
 * @param {string[]} [args.labels] Additional labels to add to pages
 * @param {boolean} [args.validateBeforeExport=true] Whether to validate docs before export
 * @param {string} [args.title] Title for a single page export (all content in one page)
 * @param {boolean} [args.byCategory=false] Whether to create separate pages by category
 * @returns {Promise<Object>} Export result
 */
export async function exportToConfluence(args) {
  // Validate input
  if (!args.input) {
    throw new Error('Missing input data');
  }
  
  // Import the Confluence exporter dynamically
  const { pushToConfluence } = await loadConfluenceExporter();
  
  // Detect format and normalize entries
  const format = detectFormat(args.input);
  if (format === 'unknown') {
    throw new Error('Unknown input format. Supported: entries, rules, api, config');
  }
  
  const entries = normalizeEntries(args.input, format);
  
  // Validate entries if requested
  if (args.validateBeforeExport !== false) {
    const validationResult = await validateDocumentation({ input: args.input });
    if (!validationResult.valid) {
      return {
        success: false,
        error: 'Validation failed',
        validation: validationResult
      };
    }
  }
  
  // Prepare for export
  const results = {
    success: true,
    pages: []
  };
  
  // If we have a single title, export all content to one page
  if (args.title) {
    // Group by category
    const grouped = {};
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const cat = entry.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(entry);
    }
    
    // Generate markdown content
    let md = `# ${args.title}\n\n`;
    
    for (const [cat, categoryEntries] of Object.entries(grouped)) {
      md += `## ${cat}\n\n`;
      for (const entry of categoryEntries) {
        md += `### ${entry.title}\n\n`;
        md += `${entry.content}\n\n`;
        
        // Add code examples if available
        if (entry.code) {
          for (const [lang, code] of Object.entries(entry.code)) {
            md += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
          }
        }
      }
    }
    
    // Export to Confluence
    try {
      const result = await pushToConfluence({
        title: args.title,
        content: md,
        labels: args.labels,
        isMarkdown: true
      }, args.configPath);
      
      results.pages.push({
        title: args.title,
        id: result.id,
        status: 'success'
      });
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  } else if (args.byCategory) {
    // Export by category
    const grouped = {};
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const cat = entry.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(entry);
    }
    
    // Export each category as a separate page
    for (const [cat, categoryEntries] of Object.entries(grouped)) {
      let md = `# ${cat}\n\n`;
      
      for (const entry of categoryEntries) {
        md += `## ${entry.title}\n\n`;
        md += `${entry.content}\n\n`;
        
        // Add code examples if available
        if (entry.code) {
          for (const [lang, code] of Object.entries(entry.code)) {
            md += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
          }
        }
      }
      
      try {
        const result = await pushToConfluence({
          title: cat,
          content: md,
          labels: [...(args.labels || []), 'category'],
          isMarkdown: true
        }, args.configPath);
        
        results.pages.push({
          title: cat,
          id: result.id,
          category: cat,
          status: 'success'
        });
      } catch (err) {
        results.pages.push({
          title: cat,
          category: cat,
          status: 'error',
          error: err.message
        });
      }
    }
  } else {
    // Export individual entries as separate pages
    for (const entry of entries) {
      if (!entry || !entry.title || !entry.content) continue;
      
      let md = `# ${entry.title}\n\n`;
      md += `${entry.content}\n\n`;
      
      // Add code examples if available
      if (entry.code) {
        for (const [lang, code] of Object.entries(entry.code)) {
          md += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
        }
      }
      
      try {
        const result = await pushToConfluence({
          title: entry.title,
          content: md,
          labels: [...(args.labels || []), entry.category || 'General'],
          isMarkdown: true
        }, args.configPath);
        
        results.pages.push({
          title: entry.title,
          id: result.id,
          category: entry.category,
          status: 'success'
        });
      } catch (err) {
        results.pages.push({
          title: entry.title,
          category: entry.category,
          status: 'error',
          error: err.message
        });
      }
    }
  }
  
  return results;
} 