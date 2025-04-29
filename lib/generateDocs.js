// Kernlogik für die Dokumentationsgenerierung
import { isValidInput, detectFormat, normalizeEntries } from './utils.js';

/**
 * Erwartete Formate: entries, rules, api, config
 * args: {
 *   input: { ... },
 *   outputFormat?: 'markdown' | 'json',
 *   outputStyle?: { headingLevel?: number, bullet?: string },
 *   lang?: 'de' | 'en'
 * }
 */
function mergeConfig(args) {
  // args.config kann global übergeben werden, args-spezifische Werte überschreiben config
  const config = args.config || {};
  return {
    ...config,
    ...args,
    outputStyle: { ...(config.outputStyle || {}), ...(args.outputStyle || {}) },
    languages: args.languages || config.languages || [],
    lang: args.lang || config.defaultLang || config.lang || 'de',
  };
}

export async function generateDocsFromInput(args) {
  const merged = mergeConfig(args);
  if (!merged.input) {
    throw new Error('Missing input data');
  }
  const input = merged.input;
  const outputFormat = merged.outputFormat || 'markdown';
  const outputStyle = merged.outputStyle || {};
  const lang = merged.lang || 'de';
  const languages = merged.languages || [];

  // Format erkennen und normalisieren
  const format = detectFormat(input);
  if (format === 'unknown') {
    throw new Error('Unknown input format. Supported: entries, rules, api, config');
  }
  const entries = normalizeEntries(input, format);

  // Gruppiere nach Kategorie
  const grouped = {};
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const cat = entry.category || (lang === 'en' ? 'General' : 'Allgemein');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  }

  if (outputFormat === 'json') {
    return { documentation: grouped, languages };
  }

  // Output-Stil: Heading-Level und Bulletpoint
  const headingLevel = outputStyle.headingLevel || 2; // Standard: ## Kategorie
  const bullet = outputStyle.bullet || '-';

  // Markdown generieren
  let md = `${'#'.repeat(headingLevel - 1)} ${lang === 'en' ? 'Documentation' : 'Dokumentation'}\n\n`;
  if (languages.length) {
    md += `${lang === 'en' ? 'Supported languages:' : 'Unterstützte Sprachen:'} ${languages.join(', ')}\n\n`;
  }
  for (const [cat, entries] of Object.entries(grouped)) {
    md += `${'#'.repeat(headingLevel)} ${cat}\n\n`;
    for (const entry of entries) {
      if (!entry.title || !entry.content) {
        md += `${'#'.repeat(headingLevel + 1)} ⚠️ ${lang === 'en' ? 'Invalid entry' : 'Ungültiger Eintrag'}\n${bullet} ${JSON.stringify(entry)}\n\n`;
        continue;
      }
      md += `${'#'.repeat(headingLevel + 1)} ${entry.title}\n\n`;
      md += `${entry.content}\n\n`;
      if (languages.length && entry.code) {
        for (const l of languages) {
          if (entry.code[l]) {
            md += `
${l}\n${entry.code[l]}\n\n`;
          }
        }
      }
    }
  }

  return { markdown: md };
}

// Platzhalter für zukünftigen Command: validateDocumentation
export async function validateDocumentation(args) {
  const merged = mergeConfig(args);
  if (!merged.input) {
    throw new Error('Missing input data');
  }
  const input = merged.input;
  const lang = merged.lang || 'de';

  // Format erkennen und normalisieren
  const { detectFormat, normalizeEntries } = await import('./utils.js');
  const format = detectFormat(input);
  if (format === 'unknown') {
    return {
      valid: false,
      issues: [
        { index: null, error: lang === 'en' ? 'Unknown input format' : 'Unbekanntes Eingabeformat' }
      ],
      message: lang === 'en' ? 'Input format not supported.' : 'Eingabeformat wird nicht unterstützt.'
    };
  }
  const entries = normalizeEntries(input, format);

  // Pflichtfelder prüfen
  const issues = [];
  entries.forEach((entry, idx) => {
    if (!entry.title) {
      issues.push({ index: idx, error: lang === 'en' ? 'Missing title' : 'Fehlender Titel', entry });
    }
    if (!entry.content) {
      issues.push({ index: idx, error: lang === 'en' ? 'Missing content' : 'Fehlender Inhalt', entry });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    message: issues.length === 0
      ? (lang === 'en' ? 'All entries valid.' : 'Alle Einträge gültig.')
      : (lang === 'en' ? 'Some entries are invalid.' : 'Einige Einträge sind ungültig.')
  };
}

/**
 * Vergleicht zwei Dokumentationsstände und erzeugt eine Änderungsdokumentation (Added/Changed/Removed).
 * args: {
 *   old: { ... },
 *   new: { ... },
 *   outputFormat?: 'markdown' | 'json',
 *   lang?: 'de' | 'en'
 * }
 */
export async function generateDocsFromDiff(args) {
  const merged = mergeConfig(args);
  if (!merged.old || !merged.new) {
    throw new Error('Missing old or new input data');
  }
  const { old, new: newInput, outputFormat = 'markdown', lang = 'de' } = merged;
  const formatOld = detectFormat(old);
  const formatNew = detectFormat(newInput);
  if (formatOld === 'unknown' || formatNew === 'unknown') {
    throw new Error('Unknown input format for diff. Supported: entries, rules, api, config');
  }
  const oldEntries = normalizeEntries(old, formatOld);
  const newEntries = normalizeEntries(newInput, formatNew);

  // Vergleich nach title (bzw. name/id) und content
  const keyOf = (entry) => entry.title || entry.name || entry.id || JSON.stringify(entry);
  const oldMap = new Map(oldEntries.map(e => [keyOf(e), e]));
  const newMap = new Map(newEntries.map(e => [keyOf(e), e]));

  const added = [];
  const changed = [];
  const removed = [];

  for (const [key, entry] of newMap.entries()) {
    if (!oldMap.has(key)) {
      added.push(entry);
    } else if (JSON.stringify(entry) !== JSON.stringify(oldMap.get(key))) {
      changed.push({ before: oldMap.get(key), after: entry });
    }
  }
  for (const [key, entry] of oldMap.entries()) {
    if (!newMap.has(key)) {
      removed.push(entry);
    }
  }

  if (outputFormat === 'json') {
    return { diff: { added, changed, removed } };
  }

  // Markdown-Ausgabe
  let md = `# ${lang === 'en' ? 'Documentation Diff' : 'Dokumentations-Diff'}\n\n`;
  if (added.length) {
    md += `## ${lang === 'en' ? 'Added' : 'Hinzugefügt'}\n\n`;
    for (const entry of added) {
      md += `- ${entry.title || entry.name || entry.id}: ${entry.content || entry.description || ''}\n`;
    }
    md += '\n';
  }
  if (changed.length) {
    md += `## ${lang === 'en' ? 'Changed' : 'Geändert'}\n\n`;
    for (const { before, after } of changed) {
      md += `- ${after.title || after.name || after.id}:\n`;
      md += `  - ${lang === 'en' ? 'Before' : 'Vorher'}: ${before.content || before.description || ''}\n`;
      md += `  - ${lang === 'en' ? 'After' : 'Nachher'}: ${after.content || after.description || ''}\n`;
    }
    md += '\n';
  }
  if (removed.length) {
    md += `## ${lang === 'en' ? 'Removed' : 'Entfernt'}\n\n`;
    for (const entry of removed) {
      md += `- ${entry.title || entry.name || entry.id}: ${entry.content || entry.description || ''}\n`;
    }
    md += '\n';
  }
  if (!added.length && !changed.length && !removed.length) {
    md += lang === 'en' ? 'No changes detected.' : 'Keine Änderungen erkannt.';
  }
  return { markdown: md };
} 