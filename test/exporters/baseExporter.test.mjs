/**
 * Tests for the BaseExporter abstract class
 */
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the BaseExporter class
import { BaseExporter } from '../../src/core/plugins/BaseExporter.ts';

// Create a concrete implementation of BaseExporter for testing
class TestExporter extends BaseExporter {
  constructor() {
    super();
    this.name = 'test';
    this.description = 'Test exporter';
    this.supportedFormats = ['test'];
    this.defaultConfigPath = '/path/to/config.json';
  }
  
  async isConfigured() {
    return true;
  }
  
  async export(content, options) {
    if (!content) {
      return { success: false, error: 'No content provided' };
    }
    return { success: true, details: { content: 'Test content' } };
  }
  
  async loadConfig(configPath) {
    return { test: true };
  }
  
  async validateContent(content) {
    if (!content || Object.keys(content).length === 0) {
      return {
        valid: false,
        issues: [{ message: 'Empty content', severity: 'error' }]
      };
    }
    return { valid: true };
  }
}

describe('BaseExporter', () => {
  let exporter;
  
  beforeEach(() => {
    exporter = new TestExporter();
  });
  
  describe('interface implementation', () => {
    test('should have required properties', () => {
      expect(exporter.name).toBe('test');
      expect(exporter.description).toBe('Test exporter');
      expect(exporter.supportedFormats).toEqual(['test']);
      expect(exporter.defaultConfigPath).toBe('/path/to/config.json');
    });
    
    test('should implement isConfigured method', async () => {
      const result = await exporter.isConfigured();
      expect(result).toBe(true);
    });
    
    test('should implement export method', async () => {
      const result = await exporter.export({ test: true });
      expect(result.success).toBe(true);
      expect(result.details).toEqual({ content: 'Test content' });
    });
    
    test('should implement loadConfig method', async () => {
      const config = await exporter.loadConfig();
      expect(config).toEqual({ test: true });
    });
    
    test('should implement validateContent method', async () => {
      const result = await exporter.validateContent({ test: true });
      expect(result.valid).toBe(true);
    });
  });
  
  describe('getCliExample', () => {
    test('should return CLI command example including exporter name', () => {
      const example = exporter.getCliExample();
      expect(example).toContain('bin/gendoc.js');
      expect(example).toContain('--export-format test');
    });
  });
  
  describe('error handling', () => {
    test('should handle missing content in export', async () => {
      const result = await exporter.export(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No content provided');
    });
    
    test('should validate empty content as invalid', async () => {
      const result = await exporter.validateContent({});
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toBe('Empty content');
      expect(result.issues[0].severity).toBe('error');
    });
  });
}); 