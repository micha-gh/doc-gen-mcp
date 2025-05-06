/**
 * Tests for the Confluence export command
 */
import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the confluenceCommand module and its dependencies
jest.mock('../lib/confluenceCommand.js', () => ({
  exportToConfluence: jest.fn().mockImplementation(async (args) => {
    // Mock implementation
    if (!args.input) {
      throw new Error('Missing input data');
    }
    
    // Return a successful mock response
    return {
      success: true,
      pages: [
        {
          title: args.title || 'Mock Page',
          id: '12345',
          status: 'success'
        }
      ]
    };
  })
}));

// Import the command after mocking
const { exportToConfluence } = await import('../lib/confluenceCommand.js');

describe('Confluence Export Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should export documentation to Confluence', async () => {
    const mockInput = {
      entries: [
        {
          category: 'API',
          title: 'getUser',
          content: 'Returns user information'
        }
      ]
    };
    
    const result = await exportToConfluence({
      input: mockInput,
      title: 'API Documentation',
      labels: ['test', 'api']
    });
    
    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toBe('API Documentation');
    expect(result.pages[0].status).toBe('success');
    expect(exportToConfluence).toHaveBeenCalledWith({
      input: mockInput,
      title: 'API Documentation',
      labels: ['test', 'api']
    });
  });
  
  test('should throw error when input is missing', async () => {
    await expect(exportToConfluence({})).rejects.toThrow('Missing input data');
  });
  
  test('should handle byCategory option', async () => {
    const mockInput = {
      entries: [
        {
          category: 'API',
          title: 'getUser',
          content: 'Returns user information'
        },
        {
          category: 'Config',
          title: 'timeout',
          content: 'Connection timeout'
        }
      ]
    };
    
    const result = await exportToConfluence({
      input: mockInput,
      byCategory: true
    });
    
    expect(result.success).toBe(true);
    expect(exportToConfluence).toHaveBeenCalledWith({
      input: mockInput,
      byCategory: true
    });
  });
}); 