/**
 * Register Exporters
 * 
 * This module initializes and registers all available exporters with the ExporterManager.
 * Add new exporters to this file to make them available in the application.
 */

import { ExporterManager } from '../core/plugins/ExporterManager.js';
import ConfluenceExporter from '../exporters/confluenceExporter.js';
import MarkdownExporter from '../exporters/markdownExporter.js';
import HTMLExporter from '../exporters/htmlExporter.js';
import PDFExporter from '../exporters/pdfExporter.js';

/**
 * The central ExporterManager for the application
 */
export const exporterManager = new ExporterManager();

/**
 * Initializes and registers all built-in exporters
 */
export async function registerBuiltinExporters(): Promise<void> {
  // Register built-in exporters
  exporterManager.registerExporter('confluence', () => new ConfluenceExporter());
  exporterManager.registerExporter('markdown', () => new MarkdownExporter());
  exporterManager.registerExporter('html', () => new HTMLExporter());
  exporterManager.registerExporter('pdf', () => new PDFExporter());
  
  console.log('Registered built-in exporters');
}

/**
 * Loads all exporters from the configuration
 * 
 * @param configPath Path to the exporter configuration file
 */
export async function registerExportersFromConfig(configPath: string): Promise<void> {
  await exporterManager.loadExportersFromConfig(configPath);
}

/**
 * Initialize exporters
 * 
 * This function should be called during application startup to initialize all exporters.
 * 
 * @param configPath Optional path to the exporter configuration file
 */
export async function initializeExporters(configPath?: string): Promise<void> {
  // Register built-in exporters
  await registerBuiltinExporters();
  
  // Load exporters from configuration if path provided
  if (configPath) {
    await registerExportersFromConfig(configPath);
  }
  
  // Print available exporters
  const availableExporters = exporterManager.getAvailableExporters();
  console.log(`Available exporters: ${availableExporters.join(', ')}`);
}

export default initializeExporters; 