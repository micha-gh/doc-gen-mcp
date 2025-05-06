/**
 * PDF Exporter for doc-gen-mcp
 * Converts documentation content to PDF format using PDFKit
 */

import fs from 'fs';
import path from 'path';
import { BaseExporter } from '../core/plugins/BaseExporter.js';
import type { ExportContent, ExportOptions, ExportResult } from '../core/plugins/BaseExporter.js';
import PDFDocument from 'pdfkit';

// Erweiterte ExportContent-Schnittstelle für den PDF-Exporter
interface PDFExportContent extends ExportContent {
  title?: string;
  subtitle?: string;
}

export class PDFExporter extends BaseExporter {
  public readonly name = 'pdf';
  public readonly description = 'PDF document exporter';
  public readonly supportedFormats = ['pdf'];
  public readonly defaultConfigPath = './config/pdf-exporter.json';

  private config: {
    fontFamily?: string;
    fontSize?: {
      title: number;
      heading: number;
      subheading: number;
      body: number;
      code: number;
    };
    pageSize?: string;
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    includeTableOfContents?: boolean;
    includeCoverPage?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    colors?: {
      primary: string;
      secondary: string;
      text: string;
      heading: string;
      link: string;
      code: string;
      codeBackground: string;
      border: string;
    };
    styles?: Record<string, any>;
  };

  constructor() {
    super();
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
      includeCoverPage: true,
      headerTemplate: '{{title}}',
      footerTemplate: 'Page {{page}} of {{pages}}',
      colors: {
        primary: '#1a73e8',
        secondary: '#4285f4',
        text: '#202124',
        heading: '#202124',
        link: '#1a73e8',
        code: '#37474f',
        codeBackground: '#f5f5f5',
        border: '#dadce0'
      },
      styles: {
        coverPage: {
          backgroundColor: '#f8f9fa',
          titleColor: '#1a73e8'
        },
        toc: {
          indentSize: 15,
          dotLeaders: true
        }
      }
    };
  }

  /**
   * Check if the exporter is properly configured
   * @returns {Promise<boolean>} True if the exporter is configured correctly
   */
  public async isConfigured(): Promise<boolean> {
    try {
      // Check if PDFKit is installed
      if (!PDFDocument) {
        console.error('PDFKit is not installed. Please run: npm install pdfkit');
        return false;
      }

      // Check if config file exists
      if (!fs.existsSync(this.defaultConfigPath)) {
        console.warn(`Config file ${this.defaultConfigPath} not found. Using default configuration.`);
      }

      return true;
    } catch (error) {
      console.error('Error checking PDF exporter configuration:', error);
      return false;
    }
  }

  /**
   * Load configuration for the PDF exporter
   * @param {string} configPath Optional path to the configuration file
   * @returns {Promise<any>} The loaded configuration
   */
  public async loadConfig(configPath?: string): Promise<any> {
    try {
      const finalConfigPath = configPath || this.defaultConfigPath;
      if (fs.existsSync(finalConfigPath)) {
        const configFile = await fs.promises.readFile(finalConfigPath, 'utf-8');
        const userConfig = JSON.parse(configFile);
        this.config = { ...this.config, ...userConfig };
      }
      return this.config;
    } catch (error) {
      console.error('Error loading PDF exporter configuration:', error);
      return this.config;
    }
  }

  /**
   * Validate the content for PDF export
   * @param {ExportContent} content The content to validate
   * @returns {Promise<{valid: boolean; issues?: Array<{message: string; severity: 'error' | 'warning' | 'info'}>;}>} Validation result
   */
  public async validateContent(content: ExportContent): Promise<{
    valid: boolean;
    issues?: Array<{ message: string; severity: 'error' | 'warning' | 'info' }>;
  }> {
    const issues: Array<{ message: string; severity: 'error' | 'warning' | 'info' }> = [];

    if (!content) {
      issues.push({
        message: 'Content is empty',
        severity: 'error'
      });
      return { valid: false, issues };
    }

    if (!content.entries || content.entries.length === 0) {
      issues.push({
        message: 'No entries found in content',
        severity: 'error'
      });
      return { valid: false, issues };
    }

    // Check for entries without title or content
    content.entries.forEach((entry, index) => {
      if (!entry.title) {
        issues.push({
          message: `Entry at index ${index} has no title`,
          severity: 'warning'
        });
      }
      if (!entry.content) {
        issues.push({
          message: `Entry at index ${index} has no content`,
          severity: 'warning'
        });
      }
    });

    return {
      valid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Export content to PDF format
   * @param {ExportContent} content The content to export
   * @param {ExportOptions} options Export options
   * @returns {Promise<ExportResult>} The export result
   */
  public async export(content: ExportContent, options?: ExportOptions): Promise<ExportResult> {
    try {
      // Validate content before export
      const validation = await this.validateContent(content);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Content validation failed',
          details: { issues: validation.issues }
        };
      }

      // Ensure options are set
      const exportOptions = options || {};
      const outputPath = exportOptions.outputPath || './output.pdf';
      const title = exportOptions.title || 'Documentation';

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true });
      }

      // Load configuration if not already loaded
      if (!this.config) {
        await this.loadConfig(exportOptions.configPath);
      }

      // Initialize PDF document with proper typing for margins
      const docOptions: PDFKit.PDFDocumentOptions = {
        size: this.config.pageSize || 'A4',
        margins: this.config.margins || {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        },
        info: {
          Title: title,
          Author: 'doc-gen-mcp',
          Subject: 'Documentation',
          Keywords: 'documentation, auto-generated'
        }
      };
      
      const doc = new PDFDocument(docOptions);

      // Setup document stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Setup document header and footer
      this.setupHeaderAndFooter(doc, title);

      // If configured, create a cover page
      if (this.config.includeCoverPage) {
        this.createCoverPage(doc, content as PDFExportContent, title);
      }

      // If configured, create a table of contents
      if (this.config.includeTableOfContents) {
        this.createTableOfContents(doc, content);
      }

      // Render content
      this.renderContent(doc, content);

      // Finalize PDF file
      doc.end();

      // Wait for the PDF to be written to disk
      return new Promise<ExportResult>((resolve) => {
        stream.on('finish', () => {
          resolve({
            success: true,
            details: {
              outputPath,
              pageCount: doc.bufferedPageRange().count
            }
          });
        });

        stream.on('error', (err) => {
          resolve({
            success: false,
            error: `Error writing PDF: ${err.message}`
          });
        });
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      return {
        success: false,
        error: `Error exporting to PDF: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Setup header and footer on each page
   * @param {PDFKit.PDFDocument} doc PDFKit document
   * @param {string} title Document title
   * @private
   */
  private setupHeaderAndFooter(doc: PDFKit.PDFDocument, title: string): void {
    let pageCount = 0;

    // Add page numbers and header/footer
    doc.on('pageAdded', () => {
      pageCount++;
      
      // Skip header/footer for first page if we have a cover page
      if (pageCount === 1 && this.config.includeCoverPage) {
        return;
      }

      // Current page size
      const { width, height } = doc.page;
      
      // Add header if configured
      if (this.config.headerTemplate) {
        doc.fontSize(10)
           .fillColor(this.config.colors?.text || '#000000')
           .text(
             this.config.headerTemplate.replace('{{title}}', title),
             doc.page.margins.left,
             doc.page.margins.top / 2,
             { align: 'left' }
           );
        
        // Add a separator line
        doc.moveTo(doc.page.margins.left, doc.page.margins.top - 10)
           .lineTo(width - doc.page.margins.right, doc.page.margins.top - 10)
           .stroke(this.config.colors?.border || '#dadce0');
      }
      
      // Add footer if configured
      if (this.config.footerTemplate) {
        const footerText = this.config.footerTemplate
          .replace('{{page}}', pageCount.toString())
          .replace('{{pages}}', '{{pages}}'); // Will be replaced later

        doc.fontSize(10)
           .fillColor(this.config.colors?.text || '#000000')
           .text(
             footerText,
             doc.page.margins.left,
             height - doc.page.margins.bottom / 2,
             { align: 'center' }
           );
      }
    });
  }

  /**
   * Create a cover page for the PDF
   * @param {PDFKit.PDFDocument} doc PDFKit document
   * @param {PDFExportContent} content The content to use for the cover page
   * @param {string} title Document title
   * @private
   */
  private createCoverPage(doc: PDFKit.PDFDocument, content: PDFExportContent, title: string): void {
    const { width, height } = doc.page;
    
    // Background color if configured
    if (this.config.styles?.coverPage?.backgroundColor) {
      doc.rect(0, 0, width, height)
         .fill(this.config.styles.coverPage.backgroundColor);
    }
    
    // Add logo (if available)
    // doc.image('path/to/logo.png', { fit: [200, 200], align: 'center' });
    
    // Add title
    doc.fontSize(this.config.fontSize?.title || 24)
       .fillColor(this.config.styles?.coverPage?.titleColor || this.config.colors?.primary || '#000000')
       .text(title, doc.page.margins.left, height / 3, {
         align: 'center',
         width: width - doc.page.margins.left - doc.page.margins.right
       });
    
    // Add subtitle (if available)
    if (content.subtitle) {
      doc.moveDown()
         .fontSize(this.config.fontSize?.subheading || 14)
         .fillColor(this.config.colors?.secondary || '#000000')
         .text(content.subtitle, {
           align: 'center',
           width: width - doc.page.margins.left - doc.page.margins.right
         });
    }
    
    // Add date at bottom
    doc.fontSize(this.config.fontSize?.body || 12)
       .fillColor(this.config.colors?.text || '#000000')
       .text(`Generated on ${new Date().toLocaleDateString()}`, doc.page.margins.left, height - doc.page.margins.bottom - 50, {
         align: 'center',
         width: width - doc.page.margins.left - doc.page.margins.right
       });
    
    // Add a new page after the cover
    doc.addPage();
  }

  /**
   * Create a table of contents
   * @param {PDFKit.PDFDocument} doc PDFKit document
   * @param {ExportContent} content The content to generate TOC from
   * @private
   */
  private createTableOfContents(doc: PDFKit.PDFDocument, content: ExportContent): void {
    const { width } = doc.page;
    const dotLeaders = this.config.styles?.toc?.dotLeaders === false ? false : true;
    
    // Title for TOC
    doc.fontSize(this.config.fontSize?.heading || 18)
       .fillColor(this.config.colors?.heading || '#000000')
       .text('Table of Contents', { align: 'center' })
       .moveDown(2);
    
    // Group entries by category
    const entriesByCategory: Record<string, Array<{title: string; content: string; category?: string; code?: Record<string, string>; [key: string]: any}>> = {};
    content.entries?.forEach(entry => {
      const category = entry.category || 'Uncategorized';
      if (!entriesByCategory[category]) {
        entriesByCategory[category] = [];
      }
      entriesByCategory[category].push(entry);
    });
    
    // Add entries to TOC
    let pageNumber = this.config.includeCoverPage ? 3 : 2; // Start with page 3 (cover + TOC) or 2 (just TOC)
    
    Object.keys(entriesByCategory).sort().forEach(category => {
      // Add category
      doc.fontSize(this.config.fontSize?.subheading || 14)
         .fillColor(this.config.colors?.secondary || '#000000')
         .text(category, { continued: false })
         .moveDown(0.5);
      
      // Add entries
      entriesByCategory[category].forEach(entry => {
        const indentSize = this.config.styles?.toc?.indentSize || 15;
        
        const entryText = entry.title;
        const dotWidth = doc.widthOfString(' . . . . . . . . . . . . . . . ');
        const textWidth = doc.widthOfString(entryText);
        const pageNumWidth = doc.widthOfString(pageNumber.toString());
        const availableWidth = width - doc.page.margins.left - doc.page.margins.right - indentSize;
        const spacerWidth = availableWidth - textWidth - pageNumWidth;
        
        doc.fontSize(this.config.fontSize?.body || 12)
           .fillColor(this.config.colors?.text || '#000000')
           .text(entryText, indentSize, doc.y, { continued: true });
        
        if (dotLeaders && spacerWidth > dotWidth) {
          const dots = ' ' + '.'.repeat(Math.floor(spacerWidth / doc.widthOfString('.')));
          doc.text(dots, { continued: true });
        } else {
          doc.text(' ', { continued: true });
        }
        
        doc.text(pageNumber.toString(), { align: 'right' });
        
        pageNumber++; // Increment page number (simplified - in real case we'd need page breaks)
      });
      
      doc.moveDown();
    });
    
    // Add a page break after TOC
    doc.addPage();
  }

  /**
   * Render content to the PDF document
   * @param {PDFKit.PDFDocument} doc PDFKit document
   * @param {ExportContent} content The content to render
   * @private
   */
  private renderContent(doc: PDFKit.PDFDocument, content: ExportContent): void {
    if (!content.entries || content.entries.length === 0) {
      return;
    }
    
    // Group entries by category
    const entriesByCategory: Record<string, Array<{title: string; content: string; category?: string; code?: Record<string, string>; [key: string]: any}>> = {};
    content.entries.forEach(entry => {
      const category = entry.category || 'Uncategorized';
      if (!entriesByCategory[category]) {
        entriesByCategory[category] = [];
      }
      entriesByCategory[category].push(entry);
    });
    
    // Render each category and its entries
    Object.keys(entriesByCategory).sort().forEach((category, categoryIndex) => {
      if (categoryIndex > 0) {
        doc.addPage(); // Start each category on a new page
      }
      
      // Render category heading
      doc.fontSize(this.config.fontSize?.heading || 18)
         .fillColor(this.config.colors?.heading || '#000000')
         .text(category, { underline: true })
         .moveDown(1);
      
      // Render entries
      entriesByCategory[category].forEach((entry, index) => {
        const lastEntry = index === entriesByCategory[category].length - 1;
        
        // Entry title
        doc.fontSize(this.config.fontSize?.subheading || 14)
           .fillColor(this.config.colors?.primary || '#000000')
           .text(entry.title)
           .moveDown(0.5);
        
        // Entry content
        doc.fontSize(this.config.fontSize?.body || 12)
           .fillColor(this.config.colors?.text || '#000000')
           .text(entry.content)
           .moveDown(1);
        
        // Render code examples if available
        if (entry.code) {
          Object.entries(entry.code).forEach(([language, code]) => {
            doc.fontSize(this.config.fontSize?.code || 10)
               .fillColor(this.config.colors?.code || '#37474f')
               .text(`${language}:`, { continued: false })
               .moveDown(0.5);
            
            // Create a code box with background
            const codeY = doc.y;
            const textHeight = doc.heightOfString(code as string, {
              width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20
            });
            
            // Draw code background
            doc.rect(
                doc.page.margins.left, 
                codeY - 5, 
                doc.page.width - doc.page.margins.left - doc.page.margins.right, 
                textHeight + 10
              )
              .fill(this.config.colors?.codeBackground || '#f5f5f5');
            
            // Add code text
            doc.fillColor(this.config.colors?.code || '#37474f')
               .text(code as string, doc.page.margins.left + 10, codeY, {
                  width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20
               });
            
            doc.moveDown(1);
          });
        }
        
        // Add separator between entries, but not after the last entry
        if (!lastEntry) {
          doc.moveTo(doc.page.margins.left, doc.y)
             .lineTo(doc.page.width - doc.page.margins.right, doc.y)
             .stroke(this.config.colors?.border || '#dadce0')
             .moveDown(1);
        }
      });
    });
  }
}

// Export default for dynamic loading
export default PDFExporter; 