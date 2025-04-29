import { generateDocsFromDiff } from '../lib/generateDocs.js';

describe('generateDocsFromDiff', () => {
  it('detects added entries', async () => {
    const oldInput = { entries: [] };
    const newInput = { entries: [ { title: 'T1', content: 'C1' } ] };
    const { markdown } = await generateDocsFromDiff({ old: oldInput, new: newInput });
    expect(markdown).toContain('Hinzugefügt');
    expect(markdown).toContain('T1');
  });

  it('detects removed entries', async () => {
    const oldInput = { entries: [ { title: 'T1', content: 'C1' } ] };
    const newInput = { entries: [] };
    const { markdown } = await generateDocsFromDiff({ old: oldInput, new: newInput });
    expect(markdown).toContain('Entfernt');
    expect(markdown).toContain('T1');
  });

  it('detects changed entries', async () => {
    const oldInput = { entries: [ { title: 'T1', content: 'alt' } ] };
    const newInput = { entries: [ { title: 'T1', content: 'neu' } ] };
    const { markdown } = await generateDocsFromDiff({ old: oldInput, new: newInput });
    expect(markdown).toContain('Geändert');
    expect(markdown).toContain('alt');
    expect(markdown).toContain('neu');
  });

  it('shows no changes if identical', async () => {
    const oldInput = { entries: [ { title: 'T1', content: 'C1' } ] };
    const newInput = { entries: [ { title: 'T1', content: 'C1' } ] };
    const { markdown } = await generateDocsFromDiff({ old: oldInput, new: newInput });
    expect(markdown).toContain('Keine Änderungen erkannt');
  });

  it('works with rules format and english', async () => {
    const oldInput = { rules: [ { id: 'R1', name: 'Rule 1', description: 'old' } ] };
    const newInput = { rules: [ { id: 'R1', name: 'Rule 1', description: 'new' }, { id: 'R2', name: 'Rule 2', description: 'added' } ] };
    const { markdown } = await generateDocsFromDiff({ old: oldInput, new: newInput, lang: 'en' });
    expect(markdown).toContain('Added');
    expect(markdown).toContain('Changed');
    expect(markdown).not.toContain('Removed');
    expect(markdown).toContain('Rule 2');
    expect(markdown).toContain('old');
    expect(markdown).toContain('new');
  });

  it('returns structured JSON diff', async () => {
    const oldInput = { entries: [ { title: 'T1', content: 'C1' } ] };
    const newInput = { entries: [ { title: 'T1', content: 'C2' }, { title: 'T2', content: 'C3' } ] };
    const { diff } = await generateDocsFromDiff({ old: oldInput, new: newInput, outputFormat: 'json' });
    expect(diff.added.length).toBe(1);
    expect(diff.changed.length).toBe(1);
    expect(diff.removed.length).toBe(0);
  });
}); 