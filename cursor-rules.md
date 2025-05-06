# Cursor Rules für doc-gen-mcp

Diese Regeln helfen bei der Entwicklung und Pflege des doc-gen-mcp Projekts innerhalb des Cursor Editors.

## 1. Dokumentationsgenerierung-Befehle

### AI-Dokumentation generieren (OpenAI)
```json
{
  "name": "Generate AI Documentation (OpenAI)",
  "command": "bin/gendoc.js --input ${fileDirname} --output ./docs/ai-doc-${fileBasenameNoExt}.md --ai --ai-provider openai --openai-key $OPENAI_API_KEY",
  "description": "Generiere Dokumentation für den aktuellen Ordner mit OpenAI"
}
```

### Antropic Claude für Dokumentation
```json
{
  "name": "Generate AI Documentation (Claude)",
  "command": "bin/gendoc.js --input ${fileDirname} --output ./docs/ai-doc-${fileBasenameNoExt}.md --ai --ai-provider anthropic --anthropic-key $ANTHROPIC_API_KEY",
  "description": "Generiere Dokumentation für den aktuellen Ordner mit Anthropic Claude"
}
```

### Dokumentation für aktuelle Datei
```json
{
  "name": "Generate Doc for Current File",
  "command": "bin/gendoc.js --input ${file} --output ./docs/${fileBasenameNoExt}.md",
  "description": "Generiere Dokumentation für die aktuelle Datei"
}
```

### Dokumentation nach Confluence exportieren
```json
{
  "name": "Export to Confluence",
  "command": "bin/gendoc.js --input ${fileDirname} --confluence --page-title \"${fileBasenameNoExt} Dokumentation\"",
  "description": "Exportiere Dokumentation nach Confluence"
}
```

## 2. Entwicklungs-Befehle

### TypeScript kompilieren
```json
{
  "name": "Build TypeScript",
  "command": "npm run build",
  "description": "TypeScript kompilieren"
}
```

### Tests ausführen
```json
{
  "name": "Run Tests",
  "command": "npm test",
  "description": "Alle Tests ausführen"
}
```

### Alle Abhängigkeiten aktualisieren
```json
{
  "name": "Update Dependencies",
  "command": "npm outdated && echo 'Run: npm update' to update non-major versions",
  "description": "Zeige veraltete Abhängigkeiten"
}
```

### Lint-Check
```json
{
  "name": "Lint Check",
  "command": "npx eslint .",
  "description": "Lint-Check für das gesamte Projekt"
}
```

## 3. Plugin-Entwicklung

### Neues Exporter-Plugin erstellen
```json
{
  "name": "Create Exporter Plugin",
  "command": "mkdir -p src/exporters/${input:exporterName}Exporter && cp src/templates/exporter-template.ts src/exporters/${input:exporterName}Exporter.ts && code src/exporters/${input:exporterName}Exporter.ts",
  "description": "Neues Exporter-Plugin erstellen"
}
```

### Plugin testen
```json
{
  "name": "Test Exporter Plugin",
  "command": "npm run build && bin/gendoc.js --input test/samples/sample-entries.json --export-format ${input:exporterName}",
  "description": "Exporter-Plugin testen"
}
```

## 4. Wartungs-Befehle

### Projekt-Struktur anzeigen
```json
{
  "name": "Show Project Structure",
  "command": "find . -type f -not -path \"./node_modules/*\" -not -path \"./dist/*\" | sort",
  "description": "Zeige die Projektstruktur ohne node_modules und dist"
}
```

### Health-Check
```json
{
  "name": "Project Health Check",
  "command": "echo 'Checking dependencies...' && npm outdated && echo 'Running tests...' && npm test",
  "description": "Führe einen Health-Check des Projekts durch"
}
```

### Fehlende initializeExporters-Funktion korrigieren
```json
{
  "name": "Fix initializeExporters",
  "command": "sed -i '' -e '/import initializeExporters/a\\initializeExporters();' bin/gendoc.js || echo 'Funktion bereits hinzugefügt oder nicht gefunden'",
  "description": "Korrigiere die fehlende initializeExporters-Funktion in bin/gendoc.js"
}
```

## 5. Code-Migration JS zu TS

### JavaScript zu TypeScript migrieren
```json
{
  "name": "Migrate JS to TS",
  "command": "cp ${file} ${fileDirname}/${fileBasenameNoExt}.ts && code ${fileDirname}/${fileBasenameNoExt}.ts",
  "description": "Migriere eine JavaScript-Datei zu TypeScript"
}
```

### Migrationsfortschritt anzeigen
```json
{
  "name": "Migration Progress",
  "command": "echo 'JS Files:' && find lib -name '*.js' | wc -l && echo 'TS Files:' && find src -name '*.ts' | wc -l",
  "description": "Zeige den Fortschritt der JS zu TS Migration"
}
```

## Integration in Cursor

Fügen Sie diese Befehle zu Ihrer Cursor-Konfiguration hinzu, um die Entwicklung und Wartung des doc-gen-mcp Projekts zu erleichtern. Die Befehle können nach Bedarf angepasst werden. 