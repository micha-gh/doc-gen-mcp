# doc-gen-mcp

**Generischer Documentation Generator MCP für Cursor AI**

---

## Überblick

Dieses Tool ist ein generischer, erweiterbarer Dokumentationsgenerator, der über das Model Context Protocol (MCP, stdio) angesprochen wird. Es unterstützt verschiedene Eingabeformate (z. B. Rulebases, API-Definitionen, Konfigurationsobjekte) und erzeugt strukturierte Markdown- oder JSON-Dokumentation.  
Die Architektur ist auf Erweiterbarkeit, Robustheit und Automatisierung ausgelegt.

---

## Features

- **Node.js MCP-Server** (Kommunikation über stdio, JSON-Kommandos)
- **Globale Konfiguration (`config`)**
  - Programmiersprachen für Codebeispiele/Snippets (`languages`)
  - Standard-Output-Stil (`outputStyle`)
  - Standardsprache (`defaultLang`)
  - Feature-Toggles (`features`)
  - Kann global oder pro Command übergeben werden
- **Command: `generateDocsFromInput`**
  - Automatische Erkennung und Normalisierung von Eingabeformaten (`entries`, `rules`, `api`, `config`)
  - Gruppierung nach Kategorien, klare Überschriften
  - Fehlerprüfung und Markierung ungültiger Einträge
  - Anpassbarer Output-Stil (Überschriften-Level, Bulletpoints)
  - Mehrsprachigkeit vorbereitet (Deutsch/Englisch)
  - Ausgabe als Markdown (Standard) oder strukturierte JSON-Dokumentation
  - Gibt unterstützte Programmiersprachen und Codeblöcke aus, wenn gewünscht
- **Command: `validateDocumentation`**
  - Validiert Einträge auf Pflichtfelder (`title`, `content`)
  - Gibt Issues mit Index, Fehlergrund und Eintrag zurück
  - Mehrsprachige Ausgabe (de/en)
- **Command: `generateDocsFromDiff`**
  - Erzeugt eine Änderungsdokumentation (Added/Changed/Removed) aus zwei Ständen (z. B. Feature-Branch vs. Main)
  - Unterstützt alle Formate wie `generateDocsFromInput`
  - Ausgabe als Markdown (Changelog-Style) oder JSON
- **Automatisierte Tests** (Jest, ESM-ready)
- **Erweiterbar** für weitere Commands, Formate, Sprachen, Output-Stile

---

## Projektstruktur

```
index.js                # MCP-Server Einstiegspunkt, Command-Registry, stdio-Handling
lib/generateDocs.js     # Kernlogik für Doku-Generierung & Validierung
lib/utils.js            # Hilfsfunktionen (Format-Erkennung, Normalisierung)
test/                   # Unit-Tests (Jest, ESM)
```

---

## Nutzung

### 1. Installation & Start

```bash
npm install
npm start
```

### 2. Kommunikation (MCP-Server)

Der Server erwartet JSON-Kommandos über stdin und antwortet über stdout.  
Beispiel für ein Kommando (als einzelne Zeile):

```json
{
  "config": {
    "languages": ["python", "typescript"],
    "defaultLang": "en",
    "outputStyle": { "headingLevel": 3, "bullet": "*" },
    "features": { "validate": true }
  },
  "command": "generateDocsFromInput",
  "args": {
    "input": { ... }
  }
}
```
- Die Config kann auch direkt in `args` übergeben werden (wird zusammengeführt).
- Alle Commands berücksichtigen die Config.

### 3. Unterstützte Input-Formate

- **entries**:  
  ```json
  { "entries": [ { "category": "API", "title": "getUser", "content": "Returns a user.", "code": { "python": "def get_user(): ...", "typescript": "function getUser() {}" } } ] }
  ```
- **rules**:  
  ```json
  { "rules": [ { "id": "R1", "name": "Rule 1", "description": "Desc" } ] }
  ```
- **api**:  
  ```json
  { "api": [ { "group": "User", "name": "getUser", "description": "Returns a user." } ] }
  ```
- **config**:  
  ```json
  { "config": [ { "section": "General", "key": "timeout", "value": 30 } ] }
  ```

### 4. Output-Optionen

- **Markdown** (Standard):  
  Gruppiert nach Kategorien, Überschriften-Level und Bulletpoints anpassbar.
  - Wenn `languages` gesetzt ist und Einträge Codebeispiele enthalten, werden diese als Codeblöcke ausgegeben.
- **JSON**:  
  Strukturierte Ausgabe, gruppiert nach Kategorien.

### 5. Validierung

```json
{
  "command": "validateDocumentation",
  "args": {
    "input": { ... },
    "lang": "en"
  }
}
```
Antwort:
```json
{
  "result": {
    "valid": false,
    "issues": [
      { "index": 0, "error": "Missing content", "entry": { "title": "T1" } }
    ],
    "message": "Some entries are invalid."
  }
}
```

### 6. Änderungsdokumentation aus einem Diff

**Command:** `generateDocsFromDiff`

- **Zweck:** Erzeugt eine Doku der Änderungen zwischen zwei Ständen (z. B. Feature-Branch vs. Main)
- **Input:**
  ```json
  {
    "command": "generateDocsFromDiff",
    "args": {
      "old": { ... },   // z. B. main/integration
      "new": { ... },   // z. B. feature-branch
      "outputFormat": "markdown", // optional
      "lang": "en" // optional
    }
  }
  ```
- **Output:**
  - Markdown mit Sektionen "Added", "Changed", "Removed"
  - Oder strukturierte JSON-Ausgabe:
    ```json
    {
      "result": {
        "diff": {
          "added": [ ... ],
          "changed": [ { "before": {...}, "after": {...} } ],
          "removed": [ ... ]
        }
      }
    }
    ```
- **Beispiel für Markdown-Output:**
  ```markdown
  # Documentation Diff

  ## Added
  - getUser: Returns a user.

  ## Changed
  - setUser:
    - Before: Old description
    - After: New description

  ## Removed
  - deleteUser: Deletes a user.
  ```

---

## Globale Konfiguration (`config`)

Die zentrale Config kann auf Top-Level oder pro Command/args übergeben werden. Sie wird automatisch zusammengeführt.

**Unterstützte Felder:**
- `languages`: Liste unterstützter Programmiersprachen (z. B. für Codebeispiele)
- `outputStyle`: Standard-Output-Stil (z. B. Überschriften-Level, Bulletpoints)
- `defaultLang`: Standardsprache ("de" oder "en")
- `features`: Feature-Toggles (z. B. `{ "validate": true }`)

**Beispiel:**
```json
{
  "config": {
    "languages": ["python", "typescript"],
    "defaultLang": "en",
    "outputStyle": { "headingLevel": 2, "bullet": "-" },
    "features": { "validate": true }
  },
  "command": "generateDocsFromInput",
  "args": {
    "input": {
      "entries": [
        {
          "category": "API",
          "title": "getUser",
          "content": "Returns a user.",
          "code": {
            "python": "def get_user(): ...",
            "typescript": "function getUser() {}"
          }
        }
      ]
    }
  }
}
```

**Ergebnis (Markdown):**
```
# Documentation

Supported languages: python, typescript

## API

### getUser

Returns a user.

```python
def get_user(): ...
```

```typescript
function getUser() {}
```
```

---

## Erweiterungsmöglichkeiten

### Neue Eingabeformate unterstützen

- In `lib/utils.js` die Funktion `detectFormat` und `normalizeEntries` erweitern.
- Beispiel: Für ein neues Feld `myFormat` einfach einen neuen Fall ergänzen.

### Weitere Output-Stile

- In `generateDocsFromInput` die Markdown-Generierung anpassen.
- Zusätzliche Optionen (z. B. Tabellen, Codeblöcke, Links) können über das Argument `outputStyle` gesteuert werden.

### Mehrsprachigkeit

- Alle Ausgaben und Fehlermeldungen sind bereits auf Deutsch/Englisch vorbereitet.
- Weitere Sprachen können durch Ergänzen der Textbausteine in `generateDocsFromInput` und `validateDocumentation` hinzugefügt werden.

### Neue Commands

- In `index.js` einfach eine neue Funktion importieren und im `commands`-Objekt registrieren.
- Beispiel: `coverageCheck`, `exportToHtml`, `summarizeDocs` etc.

### Tests erweitern

- Im Ordner `test/` neue `.test.mjs`-Dateien anlegen.
- Bestehende Tests als Vorlage nutzen.

---

## Best Practices & Hinweise

- **Fehlerhafte Einträge** werden im Markdown explizit markiert, in der JSON-Ausgabe erscheinen sie mit Fehlergrund.
- **Leere oder unbekannte Formate** werden mit einer klaren Fehlermeldung abgelehnt.
- **Automatisierte Tests** sichern die Kernlogik ab und sollten bei jeder Erweiterung ergänzt werden.
- **ESM-Only:** Das Projekt nutzt moderne ES-Module (`import`/`export`). Jest ist entsprechend konfiguriert.

---

## Sinnvolle, noch nicht umgesetzte Features

- **Coverage-Check:** Prüfen, ob alle erwarteten Kategorien/Einträge abgedeckt sind.
- **Format-Validierung:** Z. B. für API-Definitionen spezielle Felder prüfen.
- **Doku-Export:** Ausgabe als HTML, PDF, etc.
- **Interaktive CLI:** Für lokale Nutzung ohne MCP.
- **Doku-Import:** Automatisches Einlesen aus bestehenden Markdown-Dateien.
- **Live-Preview:** Webserver für Vorschau der generierten Dokumentation.

---

**Fragen, Wünsche oder Erweiterungen? Einfach Command oder Feature beschreiben – das System ist darauf ausgelegt, schnell angepasst zu werden!** 