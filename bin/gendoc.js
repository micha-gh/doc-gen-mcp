#!/usr/bin/env node

// CLI for doc-gen-mcp: Generate Markdown documentation from JSON/config or code files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDocsFromInput } from '../lib/generateDocs.js';
import https from 'https';

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

async function main() {
  const opts = parseArgs();
  if (opts.help || !opts.input) {
    printUsage();
    process.exit(0);
  }

  let config = {};
  if (opts.config) {
    try {
      config = JSON.parse(fs.readFileSync(opts.config, 'utf-8'));
    } catch (e) {
      console.error('Could not read config:', e.message);
      process.exit(1);
    }
  }

  let inputData;
  let isCode = false;
  const stat = fs.statSync(opts.input);
  if (stat.isFile() && (opts.input.endsWith('.json') || opts.input.endsWith('.config'))) {
    // JSON/config input
    inputData = JSON.parse(fs.readFileSync(opts.input, 'utf-8'));
  } else if (stat.isFile() && isCodeFile(opts.input)) {
    // Single code file
    if (opts.ai && opts.aiProvider && opts[`${opts.aiProvider.replace(/-/g, '')}Key`]) {
      const code = fs.readFileSync(opts.input, 'utf-8');
      const doc = await aiDocForCode(code, opts);
      inputData = { entries: [{ category: 'Code', title: path.basename(opts.input), content: doc }] };
    } else {
      const code = fs.readFileSync(opts.input, 'utf-8');
      inputData = { entries: extractJSDocEntriesFromCode(code, path.basename(opts.input)) };
    }
    isCode = true;
  } else if (stat.isDirectory()) {
    // Directory: collect all .js/.ts files
    const files = fs.readdirSync(opts.input).filter(f => isCodeFile(f));
    if (opts.ai && opts.aiProvider && opts[`${opts.aiProvider.replace(/-/g, '')}Key`]) {
      inputData = { entries: await extractAIEntriesFromCodeFiles(files, opts.input, opts) };
    } else {
      let entries = [];
      for (const file of files) {
        const code = fs.readFileSync(path.join(opts.input, file), 'utf-8');
        entries = entries.concat(extractJSDocEntriesFromCode(code, file));
      }
      inputData = { entries };
    }
    isCode = true;
  } else {
    console.error('Unsupported input type. Must be a JSON/config file or a code file/directory.');
    process.exit(1);
  }

  const result = await generateDocsFromInput({ input: inputData, ...config });
  if (opts.output) {
    fs.writeFileSync(opts.output, result.markdown);
    console.log(`Documentation written to ${opts.output}`);
  } else {
    process.stdout.write(result.markdown);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 