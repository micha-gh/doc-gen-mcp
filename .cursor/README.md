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

## How to Update Documentation Files

When making significant changes:

1. **CHANGELOG.md**:
   - Add an entry under the `[Unreleased]` section
   - Use the appropriate subsection (Added, Changed, Fixed)
   - Be descriptive but concise

2. **README.md**:
   - Update feature lists if you've added new functionality
   - Update examples if APIs have changed
   - Add new sections for major features

## Severity Levels

- **error**: Must be fixed before committing
- **warning**: Should be fixed but can be bypassed if necessary
- **info**: Recommendations for best practices

## How to Use Cursor Rules

Cursor rules are automatically applied when using the Cursor IDE. They provide:

1. **Real-time feedback**: Cursor will highlight rule violations as you code
2. **Hover information**: Hover over highlighted code to see rule explanations
3. **Suggestions**: Cursor may provide automated suggestions to fix issues

The rules in this project are designed to help maintain consistency and quality across the codebase, especially when implementing new exporters or modifying existing functionality.

## Updating Rules

If you want to update the rules:

1. Edit the `cursorrules.json` file
2. Increment the version number
3. Add new rules in the appropriate category
4. Update `metadata.lastUpdated` and `metadata.releaseNotes`
5. Describe the changes in your next pull request

## Project Repository

The doc-gen-mcp documentation generator is available at: https://github.com/micha-gh/doc-gen-mcp