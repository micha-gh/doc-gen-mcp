declare module 'marked' {
  interface RendererOptions {
    gfm?: boolean;
    headerIds?: boolean;
    [key: string]: any;
  }

  class Renderer {
    constructor();
    heading(text: string, level: number): string;
    code(code: string, language: string | undefined): string;
    link(href: string | null, title: string | null, text: string): string;
    image(href: string | null, title: string | null, text: string): string;
    blockquote(quote: string): string;
    list(body: string, ordered: boolean, start: number | ''): string;
    table(header: string, body: string): string;
  }

  interface MarkedOptions {
    renderer?: Renderer;
    gfm?: boolean;
    [key: string]: any;
  }

  export function marked(markdown: string, options?: MarkedOptions): string;
  export { Renderer };
} 