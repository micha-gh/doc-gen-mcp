# Cursor Rules for doc-gen-mcp

This directory contains Cursor IDE rules that help maintain code quality and consistency in the doc-gen-mcp project.

## Overview

The rules are defined in `cursorrules.json` and cover various aspects of the codebase:

- **Exporter Implementation**: Rules for implementing exporter plugins
- **Documentation**: Rules for maintaining proper documentation
- **Code Style**: Guidelines for consistent code style
- **Testing**: Requirements for proper test coverage
- **Project Management**: Rules for project maintenance
- **Best Practices**: General best practices for the project
- **Wartungsplan**: Rules related to the maintenance plan and JavaScript to TypeScript migration

## Documentation Update Rules

We've added special rules to ensure documentation stays current with code changes:

### Documentation Update Check

**Severity**: Warning

This rule reminds developers to update the `CHANGELOG.md` and `README.md` files when making significant changes to the codebase. These documentation files should be kept up-to-date to reflect:

- New features
- Bug fixes 
- API changes
- New exporters or functionality
- Configuration changes

### Pre-commit Hook

Additionally, a Git pre-commit hook has been set up to check if `CHANGELOG.md` and `README.md` have been modified when significant code changes are detected. The hook will:

1. Check if any `.ts`, `.js`, or `.mjs` files in the `src/` directory or configuration files have been modified
2. If so, verify that `README.md` and `CHANGELOG.md` are also being updated
3. If not, warn the developer and ask if they want to proceed with the commit anyway

## JavaScript to TypeScript Migration

The project is currently being migrated from JavaScript to TypeScript. New rules have been added to support this migration:

### JS to TS Migration Rule

**Severity**: Warning

This rule identifies JavaScript files in the `lib/` directory that should be migrated to TypeScript. The goal is to convert all JavaScript files to TypeScript for improved type safety and maintainability.

### TypeScript Type Definitions Rule

**Severity**: Warning

This rule checks that TypeScript files include proper type definitions for parameters, return values, and variables.

### JSDoc Completeness Rule

**Severity**: Info

This rule ensures that all functions in TypeScript and JavaScript files have complete JSDoc comments, including `@param` and `@returns` tags.

## Integrated Commands

New commands have been added to facilitate development and maintenance:

- **Generate AI Documentation**: Create documentation using OpenAI or Claude
- **Export to various formats**: Convert documentation to HTML, PDF, or Confluence
- **Migrate JS to TS**: Helper commands for JavaScript to TypeScript migration
- **Test All Exporters**: Run tests for all available exporters
- **Generate Maintenance Report**: Create a status report of the maintenance progress
- **Create Missing Type Definitions**: Automatically create skeleton TypeScript definitions

## How to Use Cursor Rules

Cursor rules are automatically applied when using the Cursor IDE. They provide:

1. **Real-time feedback**: Cursor will highlight rule violations as you code
2. **Hover information**: Hover over highlighted code to see rule explanations
3. **Suggestions**: Cursor may provide automated suggestions to fix issues
4. **Commands**: Access all defined commands through the command palette (Cmd+Shift+P)

The rules in this project are designed to help maintain consistency and quality across the codebase, especially when implementing new exporters or modifying existing functionality.

## Maintenance Plan

The project follows a structured maintenance plan (see `maintenance-plan.md` in the root directory) with:

- **Short-term measures** (1-3 months): JavaScript to TypeScript migration, dependency updates
- **Mid-term measures** (3-6 months): Security improvements, documentation enhancements
- **Long-term measures** (6-12 months): Feature extensions, performance optimizations
- **Continuous tasks**: Code quality assurance, user feedback collection

## Updating Rules

If you want to update the rules:

1. Edit the `cursorrules.json` file
2. Increment the version number
3. Add new rules in the appropriate category
4. Update `metadata.lastUpdated` and `metadata.releaseNotes`
5. Describe the changes in your next pull request

## Project Repository

The doc-gen-mcp documentation generator is available at: https://github.com/micha-gh/doc-gen-mcp