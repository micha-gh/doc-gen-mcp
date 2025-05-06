# Steps to Fix Confluence Integration Issues

This document provides concrete steps to fix the identified issues with the Confluence integration.

## 1. Fix Missing Type Declarations

The `@types/ignore` package doesn't exist in the npm registry. We need to:

1. Use TypeScript's type declaration file:

```bash
# Install marked types
npm install @types/marked

# Create a type declaration file for ignore
```

Create a file at `src/types/ignore.d.ts`:

```typescript
declare module 'ignore' {
  interface Ignore {
    add(pattern: string): Ignore;
    ignores(path: string): boolean;
  }

  function ignore(): Ignore;
  
  export = ignore;
}
```

## 2. Fix TypeScript Configuration

Update the `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "sourceMap": true,
    "declaration": true,
    "resolveJsonModule": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 3. Fix Dynamic Module Loading

Update the `lib/confluenceCommand.js` file to make module loading more robust:

```javascript
async function loadConfluenceExporter() {
  try {
    // First try importing directly from source
    return await import('../src/exporters/confluenceExporter.js');
  } catch (srcErr) {
    try {
      // Then try importing from dist
      return await import('../dist/exporters/confluenceExporter.js');
    } catch (distErr) {
      console.error('Error loading from source:', srcErr);
      console.error('Error loading from dist:', distErr);
      throw new Error('Failed to load Confluence exporter. Please ensure TypeScript files are compiled using: npm run build');
    }
  }
}
```

## 4. Add Build Scripts

Update the `package.json` scripts for better build workflow:

```json
"scripts": {
  "start": "node index.js",
  "build": "tsc",
  "build:watch": "tsc --watch",
  "prestart": "npm run build",
  "test": "NODE_OPTIONS=--experimental-vm-modules jest"
}
```

## 5. Fix Error Handling in API Calls

Improve error handling in the Confluence API requests:

```typescript
// In src/exporters/confluenceExporter.ts
async function confluenceApiRequest(
  config: ConfluenceConfig, 
  method: string, 
  apiPath: string, 
  data?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    // ... existing code ...
    
    req.on('error', (e) => {
      if (e.code === 'ECONNREFUSED') {
        reject(new Error(`Connection refused. Please check if the Confluence server at ${config.baseUrl} is reachable.`));
      } else if (e.code === 'ETIMEDOUT') {
        reject(new Error(`Connection timed out. The Confluence server at ${config.baseUrl} did not respond in time.`));
      } else {
        reject(new Error(`Confluence API request error: ${e.message} (${e.code})`));
      }
    });
    
    // ... rest of the function ...
  });
}
```

## 6. Add Comprehensive API Response Handling

Add better response handling for common HTTP status codes:

```typescript
res.on('end', () => {
  const statusCode = res.statusCode || 0;
  
  if (statusCode >= 200 && statusCode < 300) {
    try {
      resolve(responseData ? JSON.parse(responseData) : {});
    } catch (e) {
      resolve(responseData);
    }
  } else if (statusCode === 401) {
    reject(new Error('Authentication failed. Please check your Confluence token or credentials.'));
  } else if (statusCode === 403) {
    reject(new Error('Permission denied. Your account does not have permission to perform this operation.'));
  } else if (statusCode === 404) {
    reject(new Error(`Resource not found: ${apiPath}`));
  } else if (statusCode === 429) {
    reject(new Error('Rate limit exceeded. Too many requests to the Confluence API.'));
  } else {
    reject(new Error(`Confluence API request failed: ${statusCode} - ${responseData}`));
  }
});
```

## 7. Add Type Safety for API Responses

Add interfaces for API responses:

```typescript
// In src/exporters/confluenceExporter.ts
interface ConfluencePageResponse {
  id: string;
  title: string;
  version: {
    number: number;
  };
  _links?: {
    webui?: string;
  };
}

interface ConfluenceSearchResponse {
  results: ConfluencePageResponse[];
  _links?: {
    next?: string;
  };
}
```

## 8. Create a postinstall Script

Add a script to automatically build TypeScript files after installation:

Create a file at `scripts/postinstall.js`:

```javascript
#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we're in a development or production environment
const isDev = fs.existsSync(path.join(__dirname, '..', '.git'));

if (isDev) {
  console.log('Development environment detected, building TypeScript files...');
  
  // Run TypeScript compiler
  const result = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error('Failed to build TypeScript files.');
    process.exit(1);
  }
  
  console.log('TypeScript build completed successfully.');
}
```

Then, update `package.json`:

```json
"scripts": {
  "postinstall": "node scripts/postinstall.js",
  // ... other scripts
}
```

## 9. Add Explicit Environment Variable Documentation

Create a file at `.env.example`:

```
# Confluence API Token
CONFLUENCE_TOKEN=your-confluence-api-token-here

# AI Provider Keys (if using AI features)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
COHERE_API_KEY=your-cohere-api-key-here
```

## 10. Fix the Glob Version Compatibility

Update the `package.json` to use a compatible version of glob:

```json
"dependencies": {
  "glob": "^8.1.0",
  "ignore": "^5.3.0",
  "marked": "^11.1.1"
}
```

These steps should resolve the main issues identified with the Confluence integration implementation. 