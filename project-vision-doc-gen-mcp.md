# 🌟 Vision: doc-gen-mcp – Der universelle Dokumentations-MCP

## 📘 Ziel dieses Dokuments
Dieses Dokument beschreibt die **Vision und zukünftigen Ausbau** des Projekts `doc-gen-mcp`. Es dient als Grundlage für die Weiterentwicklung durch Entwickler:innen und Tools wie **Cursor AI**.

---

## 🎯 Projektziel
`doc-gen-mcp` soll zu einem **intelligenten, erweiterbaren, CI-fähigen und teamfreundlichen Dokumentationswerkzeug** werden, das:
- menschliche Entwickler:innen mit aktueller und hilfreicher Doku versorgt,
- KI-Tools (wie Cursor AI) mit kontextreicher Dokumentation unterstützt,
- automatisiert gepflegt und getestet werden kann.

---

## 🧠 Intelligenz & Kontext

### ✅ LLM-gestützte Beschreibung
- Integration von GPT (OpenAI API) für:
  - Zusammenfassungen von Modulen
  - Umwandlung von JSDoc/PHPDoc in Klartext
  - Erzeugung natürlicher Sprache auf Deutsch oder Englisch

### 🔍 Semantic Diff / Change Detector
- Erkennung von Änderungen am Code, die relevante Doku beeinflussen
- Ziel: Nur betroffene Module neu dokumentieren
- Git-Diff oder AST-basierte Analyse

---

## 🧪 Testbarkeit & Wartbarkeit

### 📏 Dokumentations-Validator
- Validiert Vollständigkeit und Qualität der Dokumentation
- Unterstützt `cursorrules.json` und Regeln für Exportsichtbarkeit
- CLI-Ausgabe + optionale HTML-Reports

### 🔁 Snapshot-Tests für Doku
- Testet, ob sich generierte Doku unerwartet ändert
- Ideal für CI/CD: `expect(currentDoc).toMatchSnapshot()`

---

## ⚙️ Erweiterbarkeit & Features

### 🔌 Modularer Export
- Exportziele via Plugins: Markdown, Confluence, Notion, HTML, Swagger
- Konfigurierbar via `config/exporters.json`

### 🖥 Interaktive CLI / Web-GUI
- Benutzerführung für:
  - Auswahl zu dokumentierender Module
  - Exportziel und Vorschau

### 🧩 Live-Feedback in IDE
- Integration mit Cursor AI:
  - Echtzeit-Hinweise bei fehlender Dokumentation
  - Visualisierung des Dokumentationsstatus je Datei

---

## 🔗 Kontextquellen & Input-Typen

- Kommentare im Code (JSDoc, PHPDoc, etc.)
- Markdown-Dateien (`README.md`, `CONTRIBUTING.md`, etc.)
- CursorRules (`cursorrules.json`)
- JSON-Schemas, OpenAPI, Swagger
- Code-Struktur und Dateipfade

---

## 🚀 Automatisierung & CI/CD

### 🤖 GitHub Actions
- Automatischer Doku-Export bei Push/Merge
- PR-Kommentar: „Doku aktualisiert für `auth.service.ts`“

### 🛠 CI-Verifikation
- Tests für Exporter
- Snapshot-Vergleich der Doku vor und nach PRs

---

## 🧭 Orientierung für Cursor AI

> Du bist ein erfahrener Entwickler oder AI-Agent. Nutze dieses Dokument als Vision für den `doc-gen-mcp`, um neue Features zu bauen, bestehende zu testen oder Workflows zu erweitern. Halte dich an vorhandene `cursorrules.json`, beachte `.gitignore`, und stelle sicher, dass die Dokumentation nicht nur generiert, sondern auch verstanden und geprüft werden kann.

---

## 📅 Stand

*Letztes Update: 2025-05-06*

---

## 🖇 Zugehörige Dateien

- [`integration-plan.md`](./integration-plan.md)
- [`cursorrules.json`](../cursorrules.json)
- [`README.md`](../README.md)
