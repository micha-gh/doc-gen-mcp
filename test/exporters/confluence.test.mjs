/**
 * Tests for the Confluence exporter
 */
import { jest } from '@jest/globals';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock the https module
jest.mock('https');
jest.mock('fs');

// Manually mock the config file reading
const mockConfig = {
  baseUrl: 'https://test.atlassian.net/wiki',
  spaceKey: 'DOC',
  parentPageId: '12345',
  auth: {
    method: 'token',
    token: 'mock-token'
  },
  defaultLabels: ['auto-doc', 'test']
};

// Setup before importing the module
fs.readFileSync.mockImplementation((filePath) => {
  if (filePath.includes('confluence.json')) {
    return JSON.stringify(mockConfig);
  }
  throw new Error('File not found');
});

// Get the directory name using the fileURLToPath function
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test (after mocks are set up)
const { loadConfluenceConfig, pushToConfluence, markdownToConfluence } = await import('../../src/exporters/confluenceExporter.ts');

// Setup https request mock
const mockHttpsRequest = {
  on: jest.fn(),
  write: jest.fn(),
  end: jest.fn()
};

const mockHttpsResponse = {
  on: jest.fn(),
  statusCode: 200
};

https.request.mockImplementation((options, callback) => {
  if (callback) {
    callback(mockHttpsResponse);
  }
  return mockHttpsRequest;
});

describe('Confluence Exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default response behavior
    let dataCallback;
    let endCallback;
    
    mockHttpsResponse.on.mockImplementation((event, callback) => {
      if (event === 'data') dataCallback = callback;
      if (event === 'end') endCallback = callback;
      return mockHttpsResponse;
    });
    
    // Simulate data events
    mockHttpsResponse.emitData = (data) => {
      if (dataCallback) dataCallback(data);
    };
    
    // Simulate end event
    mockHttpsResponse.emitEnd = () => {
      if (endCallback) endCallback();
    };
    
    // Setup request mock
    mockHttpsRequest.on.mockImplementation((event, callback) => {
      return mockHttpsRequest;
    });
  });
  
  describe('loadConfluenceConfig', () => {
    test('should load config from default path when no path provided', () => {
      const config = loadConfluenceConfig();
      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalled();
    });
    
    test('should load config from specified path', () => {
      const customPath = '/custom/path/config.json';
      loadConfluenceConfig(customPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
    
    test('should handle environment variables in token', () => {
      const envVarConfig = {
        ...mockConfig,
        auth: { method: 'token', token: '$TEST_TOKEN' }
      };
      
      fs.readFileSync.mockImplementationOnce(() => JSON.stringify(envVarConfig));
      
      // Set environment variable
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_TOKEN: 'env-token-value' };
      
      const config = loadConfluenceConfig();
      expect(config.auth.token).toBe('env-token-value');
      
      // Restore original env
      process.env = originalEnv;
    });
  });
  
  describe('markdownToConfluence', () => {
    test('should convert headings', () => {
      const markdown = '# Heading 1\n## Heading 2';
      const html = markdownToConfluence(markdown);
      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
    });
    
    test('should convert emphasis and strong', () => {
      const markdown = 'This is *italic* and **bold** text.';
      const html = markdownToConfluence(markdown);
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<strong>bold</strong>');
    });
    
    test('should convert code blocks', () => {
      const markdown = '```javascript\nconst x = 42;\n```';
      const html = markdownToConfluence(markdown);
      expect(html).toContain('<ac:structured-macro ac:name="code">');
      expect(html).toContain('<ac:parameter ac:name="language">javascript</ac:parameter>');
      expect(html).toContain('<![CDATA[const x = 42;]]>');
    });
    
    test('should convert inline code', () => {
      const markdown = 'Use the `Array.map()` method.';
      const html = markdownToConfluence(markdown);
      expect(html).toContain('<code>Array.map()</code>');
    });
  });
  
  describe('pushToConfluence', () => {
    const mockPageContent = {
      title: 'Test Page',
      content: '<p>Test content</p>',
      labels: ['test-label']
    };
    
    test('should throw error if title or content is missing', async () => {
      await expect(pushToConfluence({ title: 'Only Title' }))
        .rejects.toThrow('Title and content are required');
      
      await expect(pushToConfluence({ content: 'Only Content' }))
        .rejects.toThrow('Title and content are required');
    });
    
    test('should update existing page', async () => {
      // Mock finding existing page
      mockHttpsResponse.emitData(JSON.stringify({
        results: [{
          id: '123',
          version: { number: 1 }
        }]
      }));
      mockHttpsResponse.emitEnd();
      
      // Mock successful update
      mockHttpsResponse.emitData(JSON.stringify({ id: '123', version: { number: 2 } }));
      mockHttpsResponse.emitEnd();
      
      await pushToConfluence(mockPageContent);
      
      // Verify the PUT request was made
      expect(https.request).toHaveBeenCalledTimes(2);
      expect(https.request.mock.calls[1][0].method).toBe('PUT');
      expect(mockHttpsRequest.write).toHaveBeenCalledTimes(2);
    });
    
    test('should create new page if page does not exist', async () => {
      // Mock no existing page found
      mockHttpsResponse.emitData(JSON.stringify({ results: [] }));
      mockHttpsResponse.emitEnd();
      
      // Mock successful creation
      mockHttpsResponse.emitData(JSON.stringify({ id: '456' }));
      mockHttpsResponse.emitEnd();
      
      await pushToConfluence(mockPageContent);
      
      // Verify the POST request was made
      expect(https.request).toHaveBeenCalledTimes(2);
      expect(https.request.mock.calls[1][0].method).toBe('POST');
      expect(mockHttpsRequest.write).toHaveBeenCalledTimes(2);
    });
    
    test('should add ancestors if parentPageId exists in config', async () => {
      // Mock no existing page found
      mockHttpsResponse.emitData(JSON.stringify({ results: [] }));
      mockHttpsResponse.emitEnd();
      
      // Mock successful creation
      mockHttpsResponse.emitData(JSON.stringify({ id: '456' }));
      mockHttpsResponse.emitEnd();
      
      await pushToConfluence(mockPageContent);
      
      // Verify ancestors were added
      expect(mockHttpsRequest.write).toHaveBeenCalledTimes(2);
      const callData = JSON.parse(mockHttpsRequest.write.mock.calls[1][0]);
      expect(callData.ancestors).toEqual([{ id: '12345' }]);
    });
  });
}); 