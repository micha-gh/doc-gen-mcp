/**
 * Enhanced Markdown to Confluence HTML converter
 * 
 * Uses the 'marked' library with custom renderers for Confluence-specific markup.
 */
import { marked, Renderer } from 'marked';

/**
 * Creates a custom Confluence renderer for the marked library
 */
function createConfluenceRenderer() {
  const renderer = new Renderer();
  
  // Override heading rendering
  renderer.heading = (text: string, level: number): string => {
    return `<h${level}>${text}</h${level}>`;
  };
  
  // Override code block rendering (use Confluence macros)
  renderer.code = (code: string, language: string | undefined): string => {
    if (language) {
      return `<ac:structured-macro ac:name="code">
        <ac:parameter ac:name="language">${language}</ac:parameter>
        <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
      </ac:structured-macro>`;
    } else {
      return `<ac:structured-macro ac:name="code">
        <ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body>
      </ac:structured-macro>`;
    }
  };
  
  // Handle links better
  renderer.link = (href: string | null, title: string | null, text: string): string => {
    // Check if it's an internal Confluence page link
    if (href && href.startsWith('confluence:')) {
      const pageName = href.substring('confluence:'.length);
      return `<ac:link><ri:page ri:content-title="${pageName}" /></ac:link>`;
    }
    
    // Handle normal links
    let titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href || ''}"${titleAttr}>${text}</a>`;
  };
  
  // Handle images (with optional size)
  renderer.image = (href: string | null, title: string | null, text: string): string => {
    // Parse width and height from title if it follows format: widthxheight
    let width: string | undefined;
    let height: string | undefined;
    
    if (title && /^\d+x\d+$/.test(title)) {
      const dimensions = title.split('x');
      width = dimensions[0];
      height = dimensions[1];
      title = ''; // Clear title as we used it for dimensions
    }
    
    // Create Confluence image markup
    let image = '<ac:image';
    if (width) image += ` ac:width="${width}"`;
    if (height) image += ` ac:height="${height}"`;
    image += '><ri:url ri:value="' + (href || '') + '" /></ac:image>';
    
    return image;
  };
  
  // Handle tables
  renderer.table = (header: string, body: string): string => {
    return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
  };
  
  // Special Confluence info/note/warning macros through blockquote with prefix
  renderer.blockquote = (quote: string): string => {
    // Check for special prefixes that indicate macro type
    if (quote.startsWith('<p>INFO:')) {
      return `<ac:structured-macro ac:name="info">
        <ac:rich-text-body>${quote.substring(10).replace(/<\/p>$/, '')}</ac:rich-text-body>
      </ac:structured-macro>`;
    } else if (quote.startsWith('<p>NOTE:')) {
      return `<ac:structured-macro ac:name="note">
        <ac:rich-text-body>${quote.substring(10).replace(/<\/p>$/, '')}</ac:rich-text-body>
      </ac:structured-macro>`;
    } else if (quote.startsWith('<p>WARNING:')) {
      return `<ac:structured-macro ac:name="warning">
        <ac:rich-text-body>${quote.substring(13).replace(/<\/p>$/, '')}</ac:rich-text-body>
      </ac:structured-macro>`;
    }
    
    // Default blockquote
    return `<blockquote>${quote}</blockquote>`;
  };
  
  // Custom list rendering to handle nested lists better
  renderer.list = (body: string, ordered: boolean, start: number | ''): string => {
    const type = ordered ? 'ol' : 'ul';
    const startAttr = (ordered && start !== 1) ? ` start="${start}"` : '';
    return `<${type}${startAttr}>${body}</${type}>`;
  };
  
  return renderer;
}

/**
 * Converts Markdown to Confluence HTML format
 * 
 * @param markdown The markdown content to convert
 * @returns HTML in Confluence storage format
 */
export function markdownToConfluence(markdown: string): string {
  // Set marked options with our custom renderer
  const options = {
    renderer: createConfluenceRenderer(),
    gfm: true
  };
  
  // Process the markdown
  const html = marked(markdown, options);
  
  // Post-processing fixes
  
  // Fix for nested lists
  let processedHtml = html.replace(/<\/ul>\s*<ul>/g, '');
  processedHtml = processedHtml.replace(/<\/ol>\s*<ol>/g, '');
  
  // Clean up extra linebreaks
  processedHtml = processedHtml.replace(/\n\s*\n/g, '\n');
  
  return processedHtml;
}

export default markdownToConfluence; 