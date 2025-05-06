# 🗺️ Implementation Roadmap for doc-gen-mcp

This document outlines the planned implementation steps for the features described in the project vision document. It serves as a guide for developers and AI assistants working on the project.

## ✅ Completed Features

### 🔌 Modular Export System with Plugins
- ✅ BaseExporter abstract class defining exporter interface
- ✅ ExporterManager for plugin registration and management
- ✅ Refactored Confluence exporter to use plugin architecture
- ✅ CLI support with `--export-format` flag
- ✅ Documentation for creating custom exporters

### 📝 Markdown Exporter Plugin
- ✅ Basic Markdown generation from document entries
- ✅ Support for different Markdown flavors (GitHub, CommonMark)
- ✅ Table of contents generation
- ✅ Configurable heading levels and styling
- ✅ File output capabilities

### 📄 PDF Exporter Plugin
- ✅ PDF generation from document entries using PDFKit
- ✅ Cover page with custom titles and styling
- ✅ Table of contents with configurable formatting
- ✅ Custom headers and footers with page numbering
- ✅ Code block formatting with syntax highlighting
- ✅ Category-based organization and styling

## 🚀 Upcoming Features (Prioritized)

### 1️⃣ Enhanced Documentation Validator (Phase 1)
- [ ] Expand validation beyond basic field checks
- [ ] Add support for schema-based validation
- [ ] Implement severity levels (error, warning, info)
- [ ] Structured validation reports in multiple formats
- [ ] Integration with `cursorrules.json`

### 2️⃣ Additional Exporter Plugins (Phase 1)
- [✅] Markdown exporter
- [✅] HTML exporter
  - [✅] Customizable templates
  - [✅] CSS styling options
  - [✅] Interactive features (collapsible sections, search)

### 3️⃣ Semantic Diff / Change Detector (Phase 2)
- [ ] Git-based change detection
- [ ] AST-based code analysis
- [ ] Identification of affected documentation sections
- [ ] Selective documentation regeneration
- [ ] Integration with CI/CD workflows

### 4️⃣ Snapshot Tests for Documentation (Phase 2)
- [✅] Tests for exporters (HTML, Markdown, ExporterManager)
- [ ] Documentation snapshot creation
- [ ] Comparison logic for detecting changes
- [ ] Test framework integration (Jest)
- [ ] Reporting of unexpected changes
- [ ] Automated update workflow

### 5️⃣ Interactive CLI / Web GUI (Phase 3)
- [ ] Interactive module selection
- [ ] Preview functionality
- [ ] Configuration wizard
- [ ] Export target selection with options
- [ ] Web-based interface for teams

### 6️⃣ Additional Exporter Plugins (Phase 3)
- [ ] Notion exporter
- [ ] Swagger/OpenAPI exporter
- [✅] PDF exporter
- [ ] Wiki (MediaWiki) exporter

### 7️⃣ Live Feedback in IDE (Phase 4)
- [ ] Integration with Cursor AI
- [ ] Real-time documentation status indicators
- [ ] Quick fix suggestions
- [ ] Documentation quality metrics

### 8️⃣ GitHub Actions Integration (Phase 4)
- [ ] Automatic documentation generation on push/merge
- [ ] PR comments for documentation changes
- [ ] Documentation quality checks
- [ ] Integration with existing CI/CD pipelines

## 🛠️ Implementation Details

### Enhanced Documentation Validator
The enhanced validator will extend the current validation system to include:
- Schema-based validation for different content types
- Integration with `cursorrules.json` for project-specific rules
- Multi-level validation (structure, content, quality)
- HTML and JSON report generation

### HTML Exporter
A new exporter plugin that will:
- Support customizable templates
- Implement CSS styling options
- Include interactive features like collapsible sections and search
- Generate navigation and index pages

### Semantic Diff / Change Detector
This feature will:
- Analyze Git diffs to identify changed files
- Use AST parsing to identify semantic changes
- Determine which documentation sections need updates
- Integrate with the documentation generation pipeline

## 📊 Development Phases

| Phase | Focus | Timeline | Dependencies |
|-------|-------|----------|--------------|
| 1     | Core functionality enhancements | Q3 2025 | Current codebase |
| 2     | Testing and analysis tools | Q4 2025 | Phase 1 |
| 3     | User interface and additional exporters | Q1 2026 | Phase 2 |
| 4     | IDE integration and CI/CD | Q2 2026 | Phase 3 |

## 🔄 Review Process

Each feature will follow this implementation process:
1. Design document with detailed specifications
2. Implementation with tests
3. Documentation updates
4. Code review
5. Integration testing
6. Release

## 🤝 Contributing

If you'd like to contribute to any of these features, please:
1. Check if the feature is already being worked on
2. Create a design document for your proposed implementation
3. Submit a PR with tests and documentation

---

*This roadmap is a living document and will be updated as the project evolves.* 