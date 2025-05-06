// MCP-Server Einstiegspunkt
import { generateDocsFromInput, validateDocumentation, generateDocsFromDiff } from './lib/generateDocs.js';
import { exportToConfluence } from './lib/confluenceCommand.js';
import readline from 'readline';

// Command-Registry
const commands = {
  generateDocsFromInput,
  validateDocumentation,
  generateDocsFromDiff,
  exportToConfluence,
  // Weitere Commands können hier später ergänzt werden
};

// MCP-Server über stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

console.log(JSON.stringify({ ready: true, commands: Object.keys(commands) }));

rl.on('line', async (line) => {
  let req;
  try {
    req = JSON.parse(line);
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: 'Invalid JSON input' }) + '\n');
    return;
  }
  const { command, args } = req;
  if (!commands[command]) {
    process.stdout.write(JSON.stringify({ error: `Unknown command: ${command}` }) + '\n');
    return;
  }
  try {
    const result = await commands[command](args);
    process.stdout.write(JSON.stringify({ result }) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message }) + '\n');
  }
}); 