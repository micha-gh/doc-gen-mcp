# PDF-Exporter für doc-gen-mcp

Der PDF-Exporter ermöglicht das Exportieren von Dokumentation in PDF-Dateien mit anpassbarem Layout, Styling und Formatierung.

## Verwendung über die Kommandozeile

```bash
doc-gen --input ./src --output ./docs/api.pdf --export-format pdf
```

Oder mit zusätzlichen Optionen:

```bash
doc-gen --input ./src --output ./docs/api.pdf --export-format pdf --exporter-config ./config/custom-pdf.json
```

## Konfigurationsoptionen

Der PDF-Exporter kann über eine JSON-Konfigurationsdatei angepasst werden. Die Standardkonfiguration befindet sich in `config/pdf-exporter.json`.

### Beispielkonfiguration

```json
{
  "fontFamily": "Helvetica",
  "fontSize": {
    "title": 24,
    "heading": 18,
    "subheading": 14,
    "body": 12,
    "code": 10
  },
  "pageSize": "A4",
  "margins": {
    "top": 72,
    "bottom": 72,
    "left": 72,
    "right": 72
  },
  "includeTableOfContents": true,
  "includeCoverPage": true,
  "headerTemplate": "{{title}}",
  "footerTemplate": "Page {{page}} of {{pages}}",
  "colors": {
    "primary": "#1a73e8",
    "secondary": "#4285f4",
    "text": "#202124",
    "heading": "#202124",
    "link": "#1a73e8",
    "code": "#37474f",
    "codeBackground": "#f5f5f5",
    "border": "#dadce0"
  },
  "styles": {
    "coverPage": {
      "backgroundColor": "#f8f9fa",
      "titleColor": "#1a73e8"
    },
    "toc": {
      "indentSize": 15,
      "dotLeaders": true
    },
    "codeBlock": {
      "borderRadius": 4,
      "padding": 10
    }
  }
}
```

### Konfigurationsoptionen

| Option | Typ | Beschreibung |
|--------|-----|-------------|
| `fontFamily` | `string` | Die zu verwendende Schriftart. Standardmäßig "Helvetica". |
| `fontSize` | `object` | Schriftgrößen für verschiedene Elemente. |
| `fontSize.title` | `number` | Schriftgröße für Titel (in Punkten). |
| `fontSize.heading` | `number` | Schriftgröße für Überschriften. |
| `fontSize.subheading` | `number` | Schriftgröße für Unterüberschriften. |
| `fontSize.body` | `number` | Schriftgröße für normalen Text. |
| `fontSize.code` | `number` | Schriftgröße für Code-Blöcke. |
| `pageSize` | `string` | Seitenformat (z.B. "A4", "Letter"). |
| `margins` | `object` | Seitenränder in Punkten. |
| `includeTableOfContents` | `boolean` | Ob ein Inhaltsverzeichnis erstellt werden soll. |
| `includeCoverPage` | `boolean` | Ob eine Titelseite erstellt werden soll. |
| `headerTemplate` | `string` | Vorlage für die Kopfzeile. Unterstützt `{{title}}` als Variable. |
| `footerTemplate` | `string` | Vorlage für die Fußzeile. Unterstützt `{{page}}` und `{{pages}}` als Variablen. |
| `colors` | `object` | Farbdefinitionen für verschiedene Elemente. |
| `styles` | `object` | Zusätzliche Stiloptionen für spezifische Elemente. |

## Features

Der PDF-Exporter bietet folgende Funktionen:

- **Titelseite** mit Titel, Untertitel und Generierungsdatum
- **Inhaltsverzeichnis** mit Links zu den Abschnitten
- **Kopf- und Fußzeilen** auf allen Seiten (außer der Titelseite)
- **Nach Kategorien strukturierte Inhalte**
- **Code-Blöcke** mit Syntax-Hervorhebung
- **Anpassbare Farben und Stile**
- **Verschiedene Seitenformate und Ränder**

## Einbindung in eigenen Code

Der PDF-Exporter kann auch programmatisch eingebunden werden:

```typescript
import { exporterManager } from './src/init/registerExporters.js';

// Stelle sicher, dass alle Exporter registriert sind
await registerBuiltinExporters();

// Hole den PDF-Exporter
const pdfExporter = exporterManager.getExporter('pdf');

// Exportiere Inhalte
const content = {
  entries: [
    {
      category: 'API',
      title: 'getUser',
      content: 'Returns a user object.',
      code: {
        javascript: 'function getUser(id) { return users.find(u => u.id === id); }'
      }
    }
  ]
};

const result = await pdfExporter.export(content, {
  outputPath: './output.pdf',
  title: 'API Documentation'
});

if (result.success) {
  console.log(`PDF erfolgreich erstellt: ${result.details.outputPath}`);
} else {
  console.error(`Fehler beim Erstellen des PDFs: ${result.error}`);
}
```

## Erweiterung und Anpassung

Der PDF-Exporter basiert auf [PDFKit](https://pdfkit.org/), einer flexiblen PDF-Generierungsbibliothek für Node.js. Um den Exporter zu erweitern oder anzupassen, können Sie:

1. Eine benutzerdefinierte Konfigurationsdatei erstellen
2. Die `pdfExporter.ts`-Datei erweitern, um zusätzliche Funktionen hinzuzufügen
3. Eigene Schriftarten oder Logos einbinden

## Bekannte Einschränkungen

- Derzeit werden nur Standardschriftarten (Helvetica, Times Roman, Courier) unterstützt
- Keine Unterstützung für interaktive Elemente innerhalb des PDFs
- Komplexe Markdown-Formatierungen wie Tabellen werden möglicherweise nicht optimal dargestellt 