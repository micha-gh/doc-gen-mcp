# doc-gen-mcp Cursor Rules

Dieses Verzeichnis enthält Konfigurationen für die Cursor IDE, die im doc-gen-mcp Projekt verwendet werden.

## Cursor Rules

Die `cursorrules.json` Datei enthält projektspezifische Regeln, die bei der Entwicklung in der Cursor IDE automatisch angewendet werden. Diese Regeln helfen dabei, die Codequalität zu verbessern und einheitliche Implementierungen im Projekt zu fördern.

### Kategorisierte Regeln

Die Regeln sind in verschiedene Kategorien unterteilt:

- **Exporter Implementation**: Regeln für die Implementierung von Exporter-Plugins
- **Documentation**: Regeln zur Dokumentation und Kommentierung
- **Code Style**: Regeln zum Coding-Style und Best Practices
- **Testing**: Regeln für Tests und Test-Coverage
- **Project Management**: Regeln für Projektdokumentation und -verwaltung
- **Best Practices**: Best Practices für die Implementierung von Exportern

### Schweregrade

Jede Regel hat einen Schweregrad:

- **error**: Muss behoben werden
- **warning**: Sollte behoben werden
- **info**: Empfehlung zur Verbesserung

### Beispiel für eine Regel

```json
{
  "category": "Exporter Implementation",
  "name": "Exporter Plugin Implementation",
  "pattern": "class \\w+Exporter extends BaseExporter",
  "description": "Exporter plugins müssen von BaseExporter erben und die Standardmethoden implementieren",
  "severity": "error",
  "example": "class MarkdownExporter extends BaseExporter { ... }",
  "requiresImplementation": [
    "isConfigured(): Promise<boolean>",
    "export(content: ExportContent, options?: ExportOptions): Promise<ExportResult>"
  ]
}
```

## Wie Cursor Rules verwenden

1. Installiere die Cursor IDE (https://cursor.sh/)
2. Öffne das doc-gen-mcp Projekt in Cursor
3. Die Regeln werden automatisch geladen und angewendet
4. Überprüfe Warnungen und Fehler, die von den Regeln gemeldet werden
5. Befolge die Beispiele, um deinen Code den Projektstandards anzupassen

## Regeln aktualisieren

Wenn du die Regeln aktualisieren möchtest, bearbeite die `cursorrules.json` Datei und:

1. Erhöhe die Versionsnummer
2. Füge neue Regeln in der entsprechenden Kategorie hinzu
3. Aktualisiere die `metadata.lastUpdated` und `metadata.releaseNotes`
4. Beschreibe die Änderungen im nächsten Pull Request

## Weitere Cursor-Konfigurationen

In diesem Verzeichnis können weitere Konfigurationsdateien für die Cursor IDE gespeichert werden, wie z.B.:

- Cursor-spezifische Projekteinstellungen
- Benutzerdefinierte Tastenkombinationen
- IDE-Themes und Anpassungen

## Projekt Repository

Die doc-gen-mcp Dokumentationsgenerator ist verfügbar unter: https://github.com/micha-gh/doc-gen-mcp

## Weitere Informationen

Weitere Informationen zu Cursor Rules findest du in der [Cursor Dokumentation](https://cursor.sh/docs).