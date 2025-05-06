# 🧠 Erweiterung von `doc-gen-mcp` mit Confluence-Integration

## 🎯 Ziel
Automatisiere die Veröffentlichung der generierten Dokumentation aus `doc-gen-mcp` direkt in **Confluence-Seiten** über die REST-API, unter Einhaltung definierter Regeln und mit verifizierbarer Funktionalität.

---

## 📋 Anforderungen

- Dokumentation aus Projektkommentaren, `.md`-Files und Strukturinformationen generieren.
- Confluence-Seiten erstellen oder aktualisieren.
- Regeln aus `cursorrules.json` oder einem Regelmodul (falls vorhanden) berücksichtigen.
- Vorhandene `.md`-Dokumentation im Projekt als Input-Quelle einbinden.
- Bestehende Projekt-Kommentare (JSDoc, PHPDoc, etc.) einlesen und verwenden.
- Tests zur Verifizierung der Integration schreiben.
- Die Erweiterung selbst dokumentieren.

---

## ✅ Regeln zur Verarbeitung

- Verarbeite nur Dateien, die den CursorRules entsprechen (`cursorrules.json` oder `.cursorrules/`-Verzeichnis).
- Ignoriere Dateien und Ordner, die in `.gitignore` oder `docignore` gelistet sind.
- Markdown-Dateien im Projekt dürfen als Quelle, **aber nicht als Ziel**, verwendet werden.
- Kommentare in Code-Dateien sind die **primäre Quelle für technische Doku**.

---

## 🔌 Confluence-Konfiguration

```ts
// Beispielkonfiguration (config/confluence.json)
{
  "baseUrl": "https://dein-space.atlassian.net/wiki",
  "spaceKey": "DOC",
  "parentPageId": "123456789",
  "auth": {
    "method": "token",
    "token": "$CONFLUENCE_TOKEN"
  },
  "defaultLabels": ["auto-doc", "mcp"]
}
```

---

## ⚙️ Mögliche MCP-Funktion (Pseudo-API)

```ts
await mcp.pushToConfluence({
  title: "MyModule: AuthService",
  content: "<h1>AuthService</h1><p>Diese Komponente...</p>",
  labels: ["auth", "typescript"],
  path: "src/modules/auth.service.ts"
});
```

---

## 🧪 Testspezifikation

- Unit-Tests für Confluence-API-Aufrufe (Mocking)
- Smoke-Test: Dokumentiere 1 Datei und simuliere Upload
- E2E-Test (optional): Lokale Doku → Confluence → Erfolg prüfen

---

## 📦 Strukturvorschlag

```
doc-gen-mcp/
├── src/
│   └── exporters/
│       └── confluenceExporter.ts
├── config/
│   └── confluence.json
├── rules/
│   └── ruleLoader.ts
├── test/
│   └── confluence.test.ts
├── docs/
│   └── integration-plan.md  <-- diese Datei
└── cursorrules.json
```

---

## 🧠 Prompt für Cursor AI

> Du bist ein erfahrener Entwickler. Lies die bestehende Architektur von `doc-gen-mcp`. Deine Aufgabe: **baue einen Confluence-Exporter**, der Dokumentation aus Kommentaren, `.md`-Dateien und generierten Infos ins Confluence-Wiki hochlädt. Halte dich an vorhandene `cursorrules.json`, beachte `.gitignore`, teste alles mit Jest, dokumentiere deine Änderungen. Nutze `config/confluence.json` als Basis für die Authentifizierung. Die Funktion soll modular sein (z. B. `exporters/confluenceExporter.ts`). Der Upload soll Seiten aktualisieren oder erstellen können, je nach `title` oder `path`.

---

## 🗂 Referenzen

- `README.md` → Grundfunktionalität
- `src/cli.ts` → Einstiegspunkt für neuen CLI-Befehl
- `docs/` → Enthält evtl. Beispiele und Strukturhinweise
- `cursorrules.json` → Regeln, welche Dateien verarbeitet werden

---

## 🚀 Zieldefinition

> Nach erfolgreicher Integration soll `doc-gen-mcp` auf Knopfdruck:
> - neue oder aktualisierte Seiten in Confluence erzeugen,
> - dabei bestehende Projektstruktur als Navigationsstruktur abbilden,
> - Kommentare und Markdown in HTML überführen,
> - und alle Schritte testbar + dokumentiert machen.

*Stand: 2025-05-06*
