/**
 * Tests for the HTML exporter
 */
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define mock configuration
const mockConfig = {
  styles: {
    theme: 'light',
    externalStylesheets: ['https://example.com/styles.css']
  },
  scripts: {
    enableInteractiveFeatures: true,
    enableSearch: true,
    externalScripts: ['https://example.com/script.js']
  },
  display: {
    tableOfContents: true,
    categoryNavigation: true,
    breadcrumbs: true,
    metaInfo: true
  }
};

// Mock required modules
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((filePath) => {
    if (filePath.includes('html.json')) {
      return JSON.stringify(mockConfig);
    }
    throw new Error('File not found');
  }),
  existsSync: jest.fn().mockImplementation((filePath) => {
    if (filePath.includes('html.json')) {
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
const { HtmlExporter } = await import('../../src/exporters/htmlExporter.ts');

describe('HTML Exporter', () => {
  let htmlExporter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    htmlExporter = new HtmlExporter();
  });
  
  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(htmlExporter.name).toBe('html');
      expect(htmlExporter.description).toBe('Exports documentation to HTML files');
      expect(htmlExporter.supportedFormats).toEqual(['html', 'htm', 'xhtml']);
      expect(htmlExporter.defaultConfigPath).toContain('html.json');
    });
  });
  
  describe('isConfigured', () => {
    test('should always return true', async () => {
      const result = await htmlExporter.isConfigured();
      expect(result).toBe(true);
    });
  });
  
  describe('loadConfig', () => {
    test('should load config from default path when no path provided', async () => {
      const config = await htmlExporter.loadConfig();
      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalled();
    });
    
    test('should load config from specified path', async () => {
      const customPath = '/custom/path/config.json';
      fs.existsSync.mockReturnValueOnce(true);
      
      await htmlExporter.loadConfig(customPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
    
    test('should return default config if file does not exist', async () => {
      fs.existsSync.mockReturnValueOnce(false);
      
      const config = await htmlExporter.loadConfig('/non-existent-path.json');
      expect(config).toHaveProperty('styles');
      expect(config).toHaveProperty('scripts');
      expect(config).toHaveProperty('display');
    });
    
    test('should handle JSON parse errors', async () => {
      fs.readFileSync.mockImplementationOnce(() => 'invalid json');
      
      await expect(htmlExporter.loadConfig()).rejects.toThrow('Failed to load HTML configuration');
    });
  });
  
  describe('validateContent', () => {
    test('should mark empty content as invalid', async () => {
      const result = await htmlExporter.validateContent({});
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
      
      const result = await htmlExporter.validateContent(content);
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
      
      const result = await htmlExporter.validateContent(content);
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
      
      const result = await htmlExporter.validateContent(content);
      expect(result.valid).toBe(true); // Still valid as warnings don't affect validity
      expect(result.issues[0].message).toBe('Entry at index 0 has no content');
      expect(result.issues[0].severity).toBe('warning');
    });
  });
  
  describe('export', () => {
    test('should export content to HTML', async () => {
      const content = {
        entries: [
          {
            title: 'Test Entry',
            content: '# Test\n\nThis is a test',
            category: 'Test Category'
          }
        ]
      };
      
      const result = await htmlExporter.export(content, { title: 'Test Document' });
      
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('content');
      expect(result.details.content).toContain('<title>Test Document</title>');
      expect(result.details.content).toContain('<h1>Test</h1>');
      expect(result.details.content).toContain('Test Category');
    });
    
    test('should write to file when outputFile is specified', async () => {
      const content = {
        entries: [
          {
            title: 'Test Entry',
            content: '# Test\n\nThis is a test'
          }
        ]
      };
      
      const options = {
        title: 'Test Document',
        outputFile: 'output/test.html'
      };
      
      // Mock directory existence check
      fs.existsSync.mockReturnValueOnce(false);
      
      const result = await htmlExporter.export(content, options);
      
      expect(result.success).toBe(true);
      expect(result.details).toHaveProperty('outputFile');
      expect(result.details.outputFile).toBe('output/test.html');
      expect(fs.mkdirSync).toHaveBeenCalledWith('output', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    test('should validate content if validateBeforeExport is true', async () => {
      const content = {
        entries: [
          { content: 'Missing title' }
        ]
      };
      
      const result = await htmlExporter.export(content, { validateBeforeExport: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
    
    test('should handle errors during HTML generation', async () => {
      // Create a broken content object that will cause errors
      const content = null;
      
      const result = await htmlExporter.export(content);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to export to HTML');
    });
  });
  
  describe('markdownToHtml', () => {
    test('should convert headings', () => {
      const markdown = '# Heading 1\n## Heading 2';
      // Access the private method via the prototype
      const html = htmlExporter['markdownToHtml'](markdown);
      
      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
    });
    
    test('should convert emphasis and strong', () => {
      const markdown = 'This is *italic* and **bold** text.';
      const html = htmlExporter['markdownToHtml'](markdown);
      
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<strong>bold</strong>');
    });
    
    test('should convert code blocks', () => {
      const markdown = '```javascript\nconst x = 42;\n```';
      const html = htmlExporter['markdownToHtml'](markdown);
      
      expect(html).toContain('<pre><code class="language-javascript">');
      expect(html).toContain('const x = 42;');
    });
    
    test('should convert inline code', () => {
      const markdown = 'Use the `Array.map()` method.';
      const html = htmlExporter['markdownToHtml'](markdown);
      
      expect(html).toContain('<code>Array.map()</code>');
    });
    
    test('should convert links', () => {
      const markdown = '[Link text](https://example.com)';
      const html = htmlExporter['markdownToHtml'](markdown);
      
      expect(html).toContain('<a href="https://example.com">Link text</a>');
    });
    
    test('should handle empty input', () => {
      const html = htmlExporter['markdownToHtml']('');
      expect(html).toBe('');
    });
  });
  
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      const text = '<div class="test">Text & more</div>';
      const escaped = htmlExporter['escapeHtml'](text);
      
      expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;Text &amp; more&lt;/div&gt;');
    });
  });
  
  describe('slugify', () => {
    test('should convert text to URL-friendly slug', () => {
      const text = 'This is a Test String!';
      const slug = htmlExporter['slugify'](text);
      
      expect(slug).toBe('this-is-a-test-string');
    });
    
    test('should handle special characters', () => {
      const text = 'Test@$%^&*()';
      const slug = htmlExporter['slugify'](text);
      
      expect(slug).toBe('test');
    });
    
    test('should collapse multiple hyphens', () => {
      const text = 'Multiple  Spaces   And---Hyphens';
      const slug = htmlExporter['slugify'](text);
      
      expect(slug).toBe('multiple-spaces-and-hyphens');
    });
  });
}); 