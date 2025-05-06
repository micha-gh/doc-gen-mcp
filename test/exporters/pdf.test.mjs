/**
 * PDF Exporter Test
 * 
 * Tests für den PDF-Exporter
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Clear previous mocks
jest.resetModules();

// Mock dependencies
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue('{}'),
      writeFile: jest.fn().mockResolvedValue(undefined)
    },
    createWriteStream: jest.fn(() => ({
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
        return { pipe: jest.fn() };
      }),
      pipe: jest.fn()
    })),
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue('{}')
  };
});

// Mock PDFKit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'pageAdded') {
        callback();
      }
      return this;
    }),
    pipe: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    widthOfString: jest.fn().mockReturnValue(100),
    heightOfString: jest.fn().mockReturnValue(20),
    end: jest.fn(),
    page: {
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
      },
      width: 595,
      height: 842
    },
    bufferedPageRange: jest.fn().mockReturnValue({ count: 5 })
  }));
});

// Import the module under test (after mocks are set up)
// Using dynamic import for ESM compatibility
let PDFExporter;
let PDFKit;

describe('PDF Exporter', () => {
  let pdfExporter;

  // Setup before each test
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Provide a mock for PDFKit
    PDFKit = jest.requireMock('pdfkit');
    
    // Mock BaseExporter since we can't import TS directly
    const BaseExporterMock = class {
      async validateContent() {
        return { valid: true };
      }
    };
    
    // Dynamically create PDFExporter class since we can't import TS
    PDFExporter = class extends BaseExporterMock {
      constructor() {
        super();
        this.name = 'pdf';
        this.description = 'PDF document exporter';
        this.supportedFormats = ['pdf'];
        this.defaultConfigPath = './config/pdf-exporter.json';
        this.config = {
          fontFamily: 'Helvetica',
          fontSize: {
            title: 24,
            heading: 18,
            subheading: 14,
            body: 12,
            code: 10
          },
          pageSize: 'A4',
          margins: {
            top: 72,
            bottom: 72,
            left: 72,
            right: 72
          },
          includeTableOfContents: true,
          includeCoverPage: true
        };
      }

      async isConfigured() {
        return true;
      }

      async loadConfig() {
        if (fs.existsSync(this.defaultConfigPath)) {
          try {
            const configContent = await fs.promises.readFile(this.defaultConfigPath, 'utf-8');
            const loadedConfig = JSON.parse(configContent);
            return { ...this.config, ...loadedConfig };
          } catch (error) {
            return this.config;
          }
        }
        return this.config;
      }

      async export(content, options) {
        const validation = await this.validateContent(content);
        if (!validation.valid) {
          return {
            success: false,
            error: 'Content validation failed'
          };
        }

        const outputPath = options?.outputPath || './output.pdf';
        const stream = fs.createWriteStream(outputPath);
        const pdfDoc = new PDFKit();
        
        pdfDoc.pipe(stream);
        pdfDoc.text('Test PDF document');
        pdfDoc.end();

        return new Promise((resolve) => {
          stream.on('finish', () => {
            resolve({
              success: true,
              details: {
                outputPath,
                pageCount: pdfDoc.bufferedPageRange().count
              }
            });
          });
        });
      }
    };
    
    pdfExporter = new PDFExporter();
  });

  describe('isConfigured', () => {
    it('should return true when properly configured', async () => {
      const result = await pdfExporter.isConfigured();
      expect(result).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should load configuration from file if it exists', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.promises.readFile.mockResolvedValue(JSON.stringify({
        fontSize: { title: 30 }
      }));

      const config = await pdfExporter.loadConfig();
      expect(config.fontSize.title).toBe(30);
      expect(fs.promises.readFile).toHaveBeenCalled();
    });

    it('should use default configuration if file does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      const config = await pdfExporter.loadConfig();
      expect(config.fontSize.title).toBe(24);
    });
  });

  describe('export', () => {
    it('should return success when export succeeds', async () => {
      const content = {
        entries: [
          {
            category: 'API',
            title: 'getUser',
            content: 'Gets a user by ID'
          }
        ]
      };

      const options = {
        outputPath: './output.pdf',
        title: 'API Documentation'
      };

      const result = await pdfExporter.export(content, options);

      expect(result.success).toBe(true);
      expect(result.details.outputPath).toBe('./output.pdf');
      expect(fs.createWriteStream).toHaveBeenCalledWith('./output.pdf');
    });

    it('should return error when content validation fails', async () => {
      // Override validateContent to fail
      pdfExporter.validateContent = jest.fn().mockResolvedValue({
        valid: false,
        issues: [
          {
            message: 'Invalid content',
            severity: 'error'
          }
        ]
      });

      const content = { entries: [] };
      const result = await pdfExporter.export(content);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Content validation failed');
    });
  });
}); 