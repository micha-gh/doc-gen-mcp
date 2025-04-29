import { validateDocumentation } from '../lib/generateDocs.js';

describe('validateDocumentation', () => {
  it('validates all valid entries', async () => {
    const input = {
      entries: [
        { title: 'T1', content: 'C1' },
        { title: 'T2', content: 'C2' }
      ]
    };
    const result = await validateDocumentation({ input });
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects missing fields', async () => {
    const input = {
      entries: [
        { title: 'T1' },
        { content: 'C2' },
        {}
      ]
    };
    const result = await validateDocumentation({ input });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.map(i => i.error)).toContain('Fehlender Titel');
    expect(result.issues.map(i => i.error)).toContain('Fehlender Inhalt');
  });

  it('works with rules format', async () => {
    const input = {
      rules: [
        { name: 'R1', description: 'D1' },
        { name: 'R2' }
      ]
    };
    const result = await validateDocumentation({ input });
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('returns error for unknown format', async () => {
    const input = { foo: [] };
    const result = await validateDocumentation({ input });
    expect(result.valid).toBe(false);
    expect(result.issues[0].error).toMatch(/Unbekannt/);
  });

  it('returns english messages', async () => {
    const input = {
      entries: [ { title: 'T1' } ]
    };
    const result = await validateDocumentation({ input, lang: 'en' });
    expect(result.issues[0].error).toBe('Missing content');
    expect(result.message).toMatch(/invalid/i);
  });
}); 