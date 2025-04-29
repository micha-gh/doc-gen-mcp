import { generateDocsFromInput } from '../lib/generateDocs.js';

describe('generateDocsFromInput', () => {
  it('generates markdown for entries format', async () => {
    const input = {
      entries: [
        { category: 'Cat', title: 'T1', content: 'C1' },
        { title: 'T2', content: 'C2' }
      ]
    };
    const { markdown } = await generateDocsFromInput({ input });
    expect(markdown).toContain('## Cat');
    expect(markdown).toContain('### T1');
    expect(markdown).toContain('C1');
    expect(markdown).toContain('## Allgemein');
    expect(markdown).toContain('### T2');
    expect(markdown).toContain('C2');
  });

  it('marks invalid entries', async () => {
    const input = {
      entries: [
        { title: 'T1' },
        { content: 'C2' }
      ]
    };
    const { markdown } = await generateDocsFromInput({ input });
    expect(markdown).toContain('⚠️');
    expect(markdown).toContain('T1');
    expect(markdown).toContain('C2');
  });

  it('supports rules format', async () => {
    const input = {
      rules: [
        { id: 'R1', name: 'Regel 1', description: 'Desc 1' }
      ]
    };
    const { markdown } = await generateDocsFromInput({ input });
    expect(markdown).toContain('Regel 1');
    expect(markdown).toContain('Desc 1');
  });

  it('throws on unknown format', async () => {
    const input = { foo: [] };
    await expect(generateDocsFromInput({ input })).rejects.toThrow('Unknown input format');
  });

  it('respects outputStyle and lang', async () => {
    const input = {
      entries: [ { title: 'T', content: 'C' } ]
    };
    const { markdown } = await generateDocsFromInput({ input, outputStyle: { headingLevel: 3, bullet: '*' }, lang: 'en' });
    expect(markdown).toContain('## Documentation');
    expect(markdown).toContain('### General');
    expect(markdown).toContain('#### T');
  });
}); 