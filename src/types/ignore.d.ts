declare module 'ignore' {
  interface Ignore {
    add(pattern: string): Ignore;
    ignores(path: string): boolean;
    createFilter(): (path: string) => boolean;
  }

  function ignore(): Ignore;
  
  export = ignore;
} 