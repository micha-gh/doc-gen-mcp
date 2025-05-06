/**
 * Tests for the Markdown exporter
 */
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define mock configuration
const mockConfig = {
  flavor: 'github',
  headingLevel: 2,
  bulletChar: '-',
  tableOfContents: true,
  codeBlocks: {
    addLanguage: true,
    defaultLanguage: 'typescript'
  }
};

// Mock required modules
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((filePath) => {
    if (filePath.includes('markdown.json')) {
      return JSON.stringify(mockConfig);
    }
    throw new Error('File not found');
  }),
  existsSync: jest.fn().mockImplementation((filePath) => {
    if (filePath.includes('markdown.json')) {
      return true;
    }
    return false;
  }),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Import fs after mocking
import fs from 'fs';

// Import the module under test (after mocks are set up)
const { MarkdownExporter } = await import('../../src/exporters/markdownExporter.ts');

describe('Markdown Exporter', () => {
  let markdownExporter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    markdownExporter = new MarkdownExporter();
  });
  
  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(markdownExporter.name).toBe('markdown');
      expect(markdownExporter.description).toBe('Exports documentation to Markdown files');
      expect(markdownExporter.supportedFormats).toContain('md');
      expect(markdownExporter.supportedFormats).toContain('markdown');
      expect(markdownExporter.defaultConfigPath).toContain('markdown.json');
    });
  });
  
  describe('isConfigured', () => {
    test('should always return true', async () => {
      const result = await markdownExporter.isConfigured();
      expect(result).toBe(true);
    });
  });
  
  describe('loadConfig', () => {
    test('should load config from default path when no path provided', async () => {
      const config = await markdownExporter.loadConfig();
      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalled();
    });
    
    test('should load config from specified path', async () => {
      const customPath = '/custom/path/config.json';
      fs.existsSync.mockReturnValueOnce(true);
      
      await markdownExporter.loadConfig(customPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
    
    test('should return default config if file does not exist', async () => {
      fs.existsSync.mockReturnValueOnce(false);
      
      const config = await markdownExporter.loadConfig('/non-existent-path.json');
      expect(config).toHaveProperty('flavor');
      expect(config).toHaveProperty('headingLevel');
      expect(config).toHaveProperty('tableOfContents');
    });
    
    test('should handle JSON parse errors', async () => {
      fs.readFileSync.mockImplementationOnce(() => 'invalid json');
      
      await expect(markdownExporter.loadConfig()).rejects.toThrow('Failed to load Markdown configuration');
    });
  });
  
  describe('validateContent', () => {
    test('should mark empty content as invalid', async () => {
      const result = await markdownExporter.validateContent({});
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toBe('No content to export');
      expect(result.issues[0].severity).toBe('error');
    });
    
    test('should validate content with entries', async () => {
      const content = {
        entries: [
          { title: 'Test', content: 'Content' },
          { title: 'Another Test', content: 'More content' }
        ]
      };
      
      const result = await markdownExporter.validateContent(content);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    
    test('should detect missing title in entries', async () => {
      const content = {
        entries: [
          { content: 'Content with no title' },
          { title: 'With Title', content: 'Content' }
        ]
      };
      
      const result = await markdownExporter.validateContent(content);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toBe('Entry at index 0 has no title');
      expect(result.issues[0].severity).toBe('error');
    });
    
    test('should warn about missing content in entries', async () => {
      const content = {
        entries: [
          { title: 'Title with no content' },
          { title: 'Complete', content: 'Content' }
        ]
      };
      
      const result = await markdownExporter.validateContent(content);
      expect(result.valid).toBe(true); // Still valid as warnings don't affect validity
      expect(result.issues[0].message).toBe('Entry at index 0 has no content');
      expect(result.issues[0].severity).toBe('warning');
    });
  });
  
  describe('export', () => {
    test('should export content to Markdown', async () => {
      const content = {
        entries: [
          {
            title: 'Test Entry',
            content: 'This is a test',
            category: 'Test Category'
          }
        ]
      };
      
      const result = await markdownExporter.export(content, { title: 'Test Document' });
      
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('content');
      expect(result.details.content).toContain('# Test Document');
      expect(result.details.content).toContain('## Table of Contents');
      expect(result.details.content).toContain('## Test Entry');
      expect(result.details.content).toContain('This is a test');
    });
    
    test('should handle content with categories', async () => {
      const content = {
        entries: [
          {
            title: 'Entry 1',
            content: 'Content 1',
            category: 'Category A'
          },
          {
            title: 'Entry 2',
            content: 'Content 2',
            category: 'Category B'
          }
        ]
      };
      
      const result = await markdownExporter.export(content, { byCategory: true });
      
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('content');
      expect(result.details.content).toContain('## Category A');
      expect(result.details.content).toContain('## Category B');
      expect(result.details.content).toContain('### Entry 1');
      expect(result.details.content).toContain('### Entry 2');
    });
    
    test('should write to file when outputFile is specified', async () => {
      const content = {
        entries: [
          {
            title: 'Test Entry',
            content: 'This is a test'
          }
        ]
      };
      
      const options = {
        title: 'Test Document',
        outputFile: 'output/test.md'
      };
      
      // Mock directory existence check
      fs.existsSync.mockReturnValueOnce(false);
      
      const result = await markdownExporter.export(content, options);
      
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('outputFile');
      expect(result.details.outputFile).toBe('output/test.md');
      expect(fs.mkdirSync).toHaveBeenCalledWith('output', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    test('should validate content if validateBeforeExport is true', async () => {
      const content = {
        entries: [
          { content: 'Missing title' }
        ]
      };
      
      const result = await markdownExporter.export(content, { validateBeforeExport: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
    
    test('should handle errors during Markdown generation', async () => {
      // Create a broken content object that will cause errors
      const content = null;
      
      const result = await markdownExporter.export(content);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to export to Markdown');
    });
    
    test('should include code examples in output', async () => {
      const content = {
        entries: [
          {
            title: 'Entry with Code',
            content: 'Description',
            code: {
              javascript: 'console.log("Hello World");',
              python: 'print("Hello World")'
            }
          }
        ]
      };
      
      const result = await markdownExporter.export(content);
      
      expect(result.success).toBe(true);
      expect(result.details.content).toContain('```javascript');
      expect(result.details.content).toContain('console.log("Hello World");');
      expect(result.details.content).toContain('```python');
      expect(result.details.content).toContain('print("Hello World")');
    });
  });
  
  describe('slugify', () => {
    test('should convert text to URL-friendly slug', () => {
      const text = 'This is a Test String!';
      const slug = markdownExporter['slugify'](text);
      
      expect(slug).toBe('this-is-a-test-string');
    });
    
    test('should handle special characters', () => {
      const text = 'Test@$%^&*()';
      const slug = markdownExporter['slugify'](text);
      
      expect(slug).toBe('test');
    });
    
    test('should collapse multiple hyphens', () => {
      const text = 'Multiple  Spaces   And---Hyphens';
      const slug = markdownExporter['slugify'](text);
      
      expect(slug).toBe('multiple-spaces-and-hyphens');
    });
  });
}); 