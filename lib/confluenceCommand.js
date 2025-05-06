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
    const exporterModule = await import('../dist/exporters/confluenceExporter.js');
    return new exporterModule.default();
  } catch (err) {
    try {
      // Fallback to direct import if running from source
      const exporterModule = await import('../src/exporters/confluenceExporter.js');
      return new exporterModule.default();
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
  
  // Load the Confluence exporter
  const confluenceExporter = await loadConfluenceExporter();
  
  // Check if the exporter is properly configured
  if (!(await confluenceExporter.isConfigured())) {
    return {
      success: false,
      error: 'Confluence exporter is not configured properly. Check your configuration file.'
    };
  }
  
  // Export options
  const exportOptions = {
    title: args.title,
    configPath: args.configPath,
    byCategory: args.byCategory,
    labels: args.labels,
    validateBeforeExport: args.validateBeforeExport
  };
  
  // Export content using the new exporter plugin
  try {
    const exportResult = await confluenceExporter.export(args.input, exportOptions);
    
    // Convert to legacy format for backward compatibility
    if (exportResult.success) {
      const pages = exportResult.details?.pages?.map(page => ({
        title: page.title,
        id: page.id,
        status: 'success'
      })) || [];
      
      return {
        success: true,
        pages
      };
    } else {
      return {
        success: false,
        error: exportResult.error,
        validation: exportResult.details?.validation
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
} 