#!/usr/bin/env node

// CLI for doc-gen-mcp: Generate Markdown documentation from JSON/config or code files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocsFromInput } from '../lib/generateDocs.js';
import https from 'https';
// Import the exporter manager initialization
import initializeExporters from '../src/init/registerExporters.js';
// Import the exporter manager for use
import { exporterManager } from '../src/core/plugins/ExporterManager.js';

function printUsage() {
  console.error(`Usage: gendoc.js --input <file|dir> [--output <file>] [--config <file>] [--ai --ai-provider <provider> --<provider>-key <key> ...]`);
  console.error(`  --input           Path to JSON/config file or code file/directory (.js/.ts)`);
  console.error(`  --output          Output Markdown file (default: stdout)`);
  console.error(`  --config          Optional config JSON file`);
  console.error(`  --ai              Use AI to generate documentation from code (optional)`);
  console.error(`  --ai-provider     AI provider: openai | anthropic | gemini | cohere | azure-openai`);
  console.error(`  --openai-key      OpenAI API key (for --ai-provider openai)`);
  console.error(`  --anthropic-key   Anthropic API key (for --ai-provider anthropic)`);
  console.error(`  --gemini-key      Google Gemini API key (for --ai-provider gemini)`);
  console.error(`  --cohere-key      Cohere API key (for --ai-provider cohere)`);
  console.error(`  --azure-openai-key Azure OpenAI API key (for --ai-provider azure-openai)`);
  console.error(`  --azure-openai-endpoint Azure OpenAI endpoint (for --ai-provider azure-openai)`);
  console.error(``);
  console.error(`Export Options:`);
  console.error(`  --export-format   Format to export to (available: ${exporterManager.getAvailableExporters().join(', ')})`);
  console.error(`  --exporter-config Path to exporter config file (default: config/exporters.json)`);
  console.error(`  --by-category     Export separate pages by category`);
  console.error(`  --page-title      For page-based exporters: use a single page with this title`);
  console.error(`  --labels          Comma-separated list of labels for exported content`);
  console.error(``);
  console.error(`Confluence Export Options (legacy):`);
  console.error(`  --confluence      Export to Confluence (legacy mode)`);
  console.error(`  --confluence-config Path to Confluence config file (default: config/confluence.json)`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') opts.input = args[++i];
    else if (args[i] === '--output') opts.output = args[++i];
    else if (args[i] === '--config') opts.config = args[++i];
    else if (args[i] === '--ai') opts.ai = true;
    else if (args[i] === '--ai-provider') opts.aiProvider = args[++i];
    else if (args[i] === '--openai-key') opts.openaiKey = args[++i];
    else if (args[i] === '--anthropic-key') opts.anthropicKey = args[++i];
    else if (args[i] === '--gemini-key') opts.geminiKey = args[++i];
    else if (args[i] === '--cohere-key') opts.cohereKey = args[++i];
    else if (args[i] === '--azure-openai-key') opts.azureOpenaiKey = args[++i];
    else if (args[i] === '--azure-openai-endpoint') opts.azureOpenaiEndpoint = args[++i];
    else if (args[i] === '--confluence') opts.confluence = true;
    else if (args[i] === '--confluence-config') opts.confluenceConfig = args[++i];
    else if (args[i] === '--by-category') opts.byCategory = true;
    else if (args[i] === '--page-title') opts.pageTitle = args[++i];
    else if (args[i] === '--labels') opts.labels = args[++i].split(',');
    else if (args[i] === '--export-format') opts.exportFormat = args[++i];
    else if (args[i] === '--exporter-config') opts.exporterConfig = args[++i];
    else if (args[i] === '--help' || args[i] === '-h') opts.help = true;
  }
  return opts;
}

function isCodeFile(file) {
  return file.endsWith('.js') || file.endsWith('.ts');
}

function extractJSDocEntriesFromCode(code, filename) {
  // Improved regex to extract /** ... */ comments and the next function/class/const/let/var name
  const entries = [];
  const regex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = regex.exec(code))) {
    const comment = match[1];
    const name = match[2] || filename;
    const descMatch = comment.match(/@description\s+([\s\S]*?)(?=@|$)/);
    const description = descMatch ? descMatch[1].trim() : comment.replace(/\*/g, '').replace(/@.*$/gm, '').trim();
    entries.push({
      category: 'Code',
      title: name,
      content: description
    });
  }
  return entries;
}

// --- AI PROVIDERS ---
async function aiDocForCode(code, opts) {
  switch (opts.aiProvider) {
    case 'openai':
      return aiDocOpenAI(code, opts.openaiKey);
    case 'anthropic':
      return aiDocAnthropic(code, opts.anthropicKey);
    case 'gemini':
      return aiDocGemini(code, opts.geminiKey);
    case 'cohere':
      return aiDocCohere(code, opts.cohereKey);
    case 'azure-openai':
      return aiDocAzureOpenAI(code, opts.azureOpenaiKey, opts.azureOpenaiEndpoint);
    default:
      throw new Error('Unknown or unsupported AI provider: ' + opts.aiProvider);
  }
}

function aiPrompt(code) {
  return `Generate a concise, clear Markdown documentation for the following JavaScript or TypeScript code. Include a description, parameters, and return value if applicable.\n\nCODE:\n\n${code}\n\nDOCUMENTATION:`;
}

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function aiDocOpenAI(code, openaiKey) {
  const data = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful documentation generator.' },
      { role: 'user', content: aiPrompt(code) }
    ],
    max_tokens: 512,
    temperature: 0.2
  });
  const { body } = await httpsRequest({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    }
  }, data);
  const json = JSON.parse(body);
  const doc = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  return doc ? doc.trim() : '';
}

async function aiDocAnthropic(code, anthropicKey) {
  const data = JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 512,
    messages: [
      { role: 'user', content: [{ type: 'text', text: aiPrompt(code) }] }
    ]
  });
  const { body } = await httpsRequest({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    }
  }, data);
  const json = JSON.parse(body);
  const doc = json.content && json.content[0] && json.content[0].text;
  return doc ? doc.trim() : '';
}

async function aiDocGemini(code, geminiKey) {
  const data = JSON.stringify({
    contents: [{ parts: [{ text: aiPrompt(code) }] }]
  });
  const { body } = await httpsRequest({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, data);
  const json = JSON.parse(body);
  const doc = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0].text;
  return doc ? doc.trim() : '';
}

async function aiDocCohere(code, cohereKey) {
  const data = JSON.stringify({
    model: 'command-r-plus',
    message: aiPrompt(code),
    max_tokens: 512,
    temperature: 0.2
  });
  const { body } = await httpsRequest({
    hostname: 'api.cohere.ai',
    path: '/v1/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cohereKey}`
    }
  }, data);
  const json = JSON.parse(body);
  const doc = json.text || (json.generations && json.generations[0] && json.generations[0].text);
  return doc ? doc.trim() : '';
}

async function aiDocAzureOpenAI(code, azureKey, azureEndpoint) {
  const data = JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a helpful documentation generator.' },
      { role: 'user', content: aiPrompt(code) }
    ],
    max_tokens: 512,
    temperature: 0.2
  });
  // azureEndpoint should be like: https://<resource-name>.openai.azure.com/openai/deployments/<deployment-id>/chat/completions?api-version=2024-02-15-preview
  const url = new URL(azureEndpoint);
  const { body } = await httpsRequest({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': azureKey
    }
  }, data);
  const json = JSON.parse(body);
  const doc = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  return doc ? doc.trim() : '';
}

async function extractAIEntriesFromCodeFiles(files, dir, aiOpts) {
  const entries = [];
  for (const file of files) {
    const code = fs.readFileSync(path.join(dir, file), 'utf-8');
    try {
      const doc = await aiDocForCode(code, aiOpts);
      entries.push({
        category: 'Code',
        title: file,
        content: doc
      });
    } catch (e) {
      entries.push({
        category: 'Code',
        title: file,
        content: `AI documentation failed: ${e.message}`
      });
    }
  }
  return entries;
}

/**
 * Helper function to get AI options from CLI arguments
 */
function getAIOptions(opts) {
  if (!opts.aiProvider) {
    throw new Error('--ai-provider is required when using --ai flag');
  }

  const provider = opts.aiProvider;
  const keyParam = `${provider.replace(/-/g, '')}Key`;
  
  if (!opts[keyParam] && provider !== 'azure-openai') {
    throw new Error(`--${keyParam} is required for AI provider ${provider}`);
  }

  if (provider === 'azure-openai' && (!opts.azureOpenaiKey || !opts.azureOpenaiEndpoint)) {
    throw new Error('--azure-openai-key and --azure-openai-endpoint are required for azure-openai provider');
  }
  
  return {
    aiProvider: provider,
    openaiKey: opts.openaiKey,
    anthropicKey: opts.anthropicKey,
    geminiKey: opts.geminiKey,
    cohereKey: opts.cohereKey,
    azureOpenaiKey: opts.azureOpenaiKey,
    azureOpenaiEndpoint: opts.azureOpenaiEndpoint
  };
}

async function main() {
  // Initialize all available exporters
  await initializeExporters();
  
  const opts = parseArgs();
  
  if (opts.help) {
    printUsage();
    process.exit(0);
  }
  
  if (!opts.input) {
    console.error('Error: Missing --input parameter');
    printUsage();
    process.exit(1);
  }
  
  let inputData;
  try {
    // Check if input is a file or directory
    const inputStat = fs.statSync(opts.input);
    
    if (inputStat.isDirectory()) {
      // Process directory
      const files = fs.readdirSync(opts.input)
        .filter(file => isCodeFile(file))
        .map(file => path.join(opts.input, file));
      
      if (opts.ai) {
        // AI-powered documentation from code files
        const aiOpts = getAIOptions(opts);
        inputData = { entries: await extractAIEntriesFromCodeFiles(files, opts.input, aiOpts) };
      } else {
        // Standard JSDoc extraction
        inputData = { entries: [] };
        for (const file of files) {
          const code = fs.readFileSync(file, 'utf8');
          const filename = path.basename(file);
          inputData.entries.push(...extractJSDocEntriesFromCode(code, filename));
        }
      }
    } else {
      // Process single file
      const ext = path.extname(opts.input).toLowerCase();
      
      if (ext === '.json') {
        // Load JSON input file
        const jsonContent = fs.readFileSync(opts.input, 'utf8');
        inputData = JSON.parse(jsonContent);
      } else if (isCodeFile(opts.input)) {
        // Extract from code file
        const code = fs.readFileSync(opts.input, 'utf8');
        const filename = path.basename(opts.input);
        
        if (opts.ai) {
          // AI-powered documentation
          const aiOpts = getAIOptions(opts);
          const aiDoc = await aiDocForCode(code, aiOpts);
          inputData = {
            entries: [{
              category: 'Code',
              title: filename,
              content: aiDoc
            }]
          };
        } else {
          // Standard JSDoc extraction
          inputData = {
            entries: extractJSDocEntriesFromCode(code, filename)
          };
        }
      } else {
        throw new Error(`Unsupported file type: ${ext}. Expected .json, .js, or .ts file.`);
      }
    }
    
    // Get config if specified
    let config = {};
    if (opts.config) {
      const configContent = fs.readFileSync(opts.config, 'utf8');
      config = JSON.parse(configContent);
    }
    
    // Use new exporter system if export format is specified
    if (opts.exportFormat) {
      console.log(`Exporting documentation to ${opts.exportFormat}...`);
      
      const exporter = exporterManager.getExporter(opts.exportFormat);
      if (!exporter) {
        console.error(`Error: Exporter '${opts.exportFormat}' not found. Available exporters: ${exporterManager.getAvailableExporters().join(', ')}`);
        process.exit(1);
      }
      
      // Check if exporter is configured
      if (!(await exporter.isConfigured())) {
        console.error(`Error: Exporter '${opts.exportFormat}' is not properly configured.`);
        process.exit(1);
      }
      
      // Export using the exporter plugin
      const result = await exporter.export(
        {
          entries: inputData.entries,
          rawContent: inputData.rawContent
        },
        {
          title: opts.pageTitle,
          configPath: opts.exporterConfig,
          byCategory: opts.byCategory,
          labels: opts.labels,
          validateBeforeExport: true
        }
      );
      
      if (result.success) {
        console.log(`Documentation successfully exported to ${opts.exportFormat}`);
        if (result.details) {
          console.log('Export details:', JSON.stringify(result.details, null, 2));
        }
      } else {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
    }
    // Legacy Confluence export
    else if (opts.confluence) {
      // Export to Confluence using legacy approach
      const { exportToConfluence } = await import('../lib/confluenceCommand.js');
      
      console.log('Exporting documentation to Confluence (legacy mode)...');
      
      const result = await exportToConfluence({
        input: inputData,
        configPath: opts.confluenceConfig,
        title: opts.pageTitle,
        byCategory: opts.byCategory,
        labels: opts.labels
      });
      
      if (result.success) {
        console.log('Successfully exported to Confluence:');
        for (const page of result.pages) {
          if (page.status === 'success') {
            console.log(`- ${page.title}: Success (ID: ${page.id})`);
          } else {
            console.error(`- ${page.title}: Error - ${page.error}`);
          }
        }
      } else {
        console.error(`Error: ${result.error}`);
        if (result.validation) {
          console.error('Validation issues:');
          for (const issue of result.validation.issues) {
            console.error(`- ${issue.error}: ${JSON.stringify(issue.entry)}`);
          }
        }
        process.exit(1);
      }
    } else {
      // Generate docs with generateDocsFromInput
      const { generateDocsFromInput } = await import('../lib/generateDocs.js');
      
      const result = await generateDocsFromInput({
        input: inputData,
        outputFormat: 'markdown',
        config
      });
      
      if (opts.output) {
        // Write to file
        fs.writeFileSync(opts.output, result.markdown);
        console.log(`Documentation written to ${opts.output}`);
      } else {
        // Write to stdout
        console.log(result.markdown);
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 