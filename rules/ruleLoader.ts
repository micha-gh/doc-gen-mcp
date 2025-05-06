/**
 * Rule Loader for doc-gen-mcp
 * 
 * Loads and processes rules from cursorrules.json or .cursorrules/ directory
 * while respecting .gitignore and docignore patterns.
 */
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import ignore from 'ignore';

interface LoadRulesOptions {
  rootDir?: string;
  includePattern?: string;
  excludePattern?: string;
}

/**
 * Loads the content of .gitignore and docignore files
 * 
 * @param rootDir Root directory to search from
 * @returns Ignore instance with loaded patterns
 */
function loadIgnorePatterns(rootDir: string): ReturnType<typeof ignore> {
  const ig = ignore();
  
  // Process .gitignore if it exists
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    ig.add(gitignoreContent);
  }
  
  // Process docignore if it exists
  const docignorePath = path.join(rootDir, 'docignore');
  if (fs.existsSync(docignorePath)) {
    const docignoreContent = fs.readFileSync(docignorePath, 'utf8');
    ig.add(docignoreContent);
  }
  
  return ig;
}

/**
 * Finds CursorRules file or directory
 * 
 * @param rootDir Root directory to search from
 * @returns Path to cursor rules
 */
function findCursorRules(rootDir: string): string | null {
  // Check for cursorrules.json
  const jsonPath = path.join(rootDir, 'cursorrules.json');
  if (fs.existsSync(jsonPath)) {
    return jsonPath;
  }
  
  // Check for .cursorrules/ directory
  const dirPath = path.join(rootDir, '.cursorrules');
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    return dirPath;
  }
  
  return null;
}

/**
 * Load cursor rules from file or directory
 * 
 * @param rulesPath Path to rules file or directory
 * @returns Loaded rules object
 */
function loadCursorRules(rulesPath: string): any {
  // If path is a JSON file
  if (fs.statSync(rulesPath).isFile() && rulesPath.endsWith('.json')) {
    const content = fs.readFileSync(rulesPath, 'utf8');
    return JSON.parse(content);
  }
  
  // If path is a directory, combine all JSON files
  if (fs.statSync(rulesPath).isDirectory()) {
    const files = fs.readdirSync(rulesPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(rulesPath, file));
    
    // Combine rules from all files
    const rules: any = { rules: [] };
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const parsedRules = JSON.parse(content);
        
        if (Array.isArray(parsedRules.rules)) {
          rules.rules.push(...parsedRules.rules);
        }
      } catch (err) {
        console.warn(`Warning: Failed to parse rules from ${file}`);
      }
    }
    
    return rules;
  }
  
  return { rules: [] };
}

/**
 * Find files that match patterns and respect ignore files
 * 
 * @param options Options for file loading
 * @returns Array of matching file paths
 */
export function findDocFiles(options: LoadRulesOptions = {}): string[] {
  const rootDir = options.rootDir || process.cwd();
  
  // Load cursor rules
  const cursorRulesPath = findCursorRules(rootDir);
  if (!cursorRulesPath) {
    console.warn('Warning: No cursorrules.json or .cursorrules/ directory found');
    return [];
  }
  
  // Load ignore patterns
  const ig = loadIgnorePatterns(rootDir);
  
  // Find files that match the includePattern
  const includePattern = options.includePattern || '**/*.{js,ts,jsx,tsx,md}';
  const files = glob.sync(includePattern, { 
    cwd: rootDir,
    absolute: true,
    ignore: ['node_modules/**', 'dist/**', '.git/**']
  });
  
  // Filter files with ignore patterns and excludePattern
  return files.filter(file => {
    // Get relative path for ignore filtering
    const relativePath = path.relative(rootDir, file);
    
    // Skip if it matches ignore patterns
    if (ig.ignores(relativePath)) {
      return false;
    }
    
    // Skip if it matches exclude pattern
    if (options.excludePattern && new RegExp(options.excludePattern).test(file)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Load rules from project
 * 
 * @param options Options for rule loading
 * @returns Loaded rules object
 */
export function loadRules(options: LoadRulesOptions = {}): any {
  const rootDir = options.rootDir || process.cwd();
  
  // Find cursor rules
  const cursorRulesPath = findCursorRules(rootDir);
  if (!cursorRulesPath) {
    console.warn('Warning: No cursorrules.json or .cursorrules/ directory found');
    return { rules: [] };
  }
  
  // Load rules
  return loadCursorRules(cursorRulesPath);
}

export default {
  findDocFiles,
  loadRules
}; 