#!/usr/bin/env node

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in a development or production environment
const isDev = fs.existsSync(path.join(__dirname, '..', '.git'));

if (isDev) {
  console.log('Development environment detected, building TypeScript files...');
  
  // Check if TypeScript is installed
  try {
    // Different way to check if module exists in ESM
    await import('typescript');
  } catch (e) {
    console.log('TypeScript not found, installing development dependencies...');
    
    // Install dev dependencies
    const npmInstall = spawnSync('npm', ['install', '--only=dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    if (npmInstall.status !== 0) {
      console.error('Failed to install development dependencies.');
      process.exit(1);
    }
  }
  
  // Make sure src/types directory exists
  const typesDir = path.join(__dirname, '..', 'src', 'types');
  if (!fs.existsSync(typesDir)) {
    console.log('Creating types directory...');
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  // Run TypeScript compiler
  console.log('Building TypeScript files...');
  const result = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error('Failed to build TypeScript files.');
    process.exit(1);
  }
  
  console.log('TypeScript build completed successfully.');
} else {
  console.log('Production environment detected, skipping TypeScript build.');
} 