import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const CLI = path.resolve('bin/gendoc.js');
const TMP = path.resolve('test/tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);

function runCli(args, input = null) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [CLI, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('close', code => resolve({ code, out, err }));
    if (input) proc.stdin.write(input);
    if (input) proc.stdin.end();
  });
}

describe('CLI integration', () => {
  const jsonFile = path.join(TMP, 'input.json');
  const codeFile = path.join(TMP, 'input.js');
  const outFile = path.join(TMP, 'out.md');

  beforeAll(() => {
    fs.writeFileSync(jsonFile, JSON.stringify({ entries: [ { title: 'T', content: 'C' } ] }));
    fs.writeFileSync(codeFile, `/**\n * Example function\n * @description Does something\n */\nfunction foo() {}`);
  });

  afterAll(() => {
    fs.rmSync(TMP, { recursive: true, force: true });
  });

  it('generates markdown from JSON', async () => {
    const { code, out } = await runCli(['--input', jsonFile]);
    expect(code).toBe(0);
    expect(out).toContain('T');
    expect(out).toContain('C');
  });

  it('generates markdown from code file', async () => {
    const { code, out } = await runCli(['--input', codeFile]);
    expect(code).toBe(0);
    expect(out).toContain('foo');
    expect(out).toContain('Does something');
  });

  it('writes output to file', async () => {
    await runCli(['--input', jsonFile, '--output', outFile]);
    const md = fs.readFileSync(outFile, 'utf-8');
    expect(md).toContain('T');
    expect(md).toContain('C');
  });

  it('fails on missing input', async () => {
    const { code, err } = await runCli([]);
    expect(code).toBe(0); // prints usage and exits
    expect(err + '').toContain('Usage');
  });

  // Skipped: ESM modules do not support require, so we cannot patch the CLI for this test.
  // it('mocks AI provider (openai)', async () => {
  //   // Patch aiDocForCode in the CLI for this test
  //   const orig = require.cache[require.resolve('../bin/gendoc.js')];
  //   let called = false;
  //   require.cache[require.resolve('../bin/gendoc.js')].exports.aiDocForCode = async () => {
  //     called = true;
  //     return 'AI generated doc';
  //   };
  //   const { code, out } = await runCli(['--input', codeFile, '--ai', '--ai-provider', 'openai', '--openai-key', 'dummy']);
  //   expect(code).toBe(0);
  //   expect(out).toContain('AI generated doc');
  //   // Restore
  //   require.cache[require.resolve('../bin/gendoc.js')] = orig;
  // });
}); 