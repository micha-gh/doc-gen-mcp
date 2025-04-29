// Hilfsfunktionen für Formatierung, Fehlerprüfung etc. (Platzhalter)

export function isValidInput(input) {
  // Platzhalter für spätere Validierung
  return !!input;
}

// Erkennung des Eingabeformats
export function detectFormat(input) {
  if (Array.isArray(input.entries)) return 'entries';
  if (Array.isArray(input.rules)) return 'rules';
  if (Array.isArray(input.api)) return 'api';
  if (Array.isArray(input.config)) return 'config';
  return 'unknown';
}

// Vereinheitlichung der Einträge auf das Standardformat
export function normalizeEntries(input, format) {
  switch (format) {
    case 'entries':
      return input.entries;
    case 'rules':
      // Beispiel: Rulebase zu {category, title, content} mappen
      return input.rules.map(rule => ({
        category: rule.category || 'Regeln',
        title: rule.name || rule.id || 'Unbenannte Regel',
        content: rule.description || rule.text || JSON.stringify(rule)
      }));
    case 'api':
      return input.api.map(api => ({
        category: api.group || 'API',
        title: api.name || 'Unbenannte API',
        content: api.description || JSON.stringify(api)
      }));
    case 'config':
      return input.config.map(cfg => ({
        category: cfg.section || 'Konfiguration',
        title: cfg.key || 'Unbenannter Key',
        content: cfg.value ? String(cfg.value) : JSON.stringify(cfg)
      }));
    default:
      return [];
  }
} 