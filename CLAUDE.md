# CLAUDE.md

This file provides Claude Code specific guidance. For comprehensive context shared across all AI agents, see **AGENTS.md**.

## Multi-Agent Context System

This repository uses a multi-agent context file system:
- **AGENTS.md** - Master context file with comprehensive guidance for all AI agents
- **CLAUDE.md** - This file (Claude Code specific additions)
- **GEMINI.md** - Symbolic link to AGENTS.md
- **`.cursorrules`** - Symbolic link to AGENTS.md  
- **`.cursor/rules/project-guide.mdc`** - Symbolic link to AGENTS.md

**→ Read AGENTS.md for the complete development guide including datacoretsx blocks, queries, and architecture.**

## Claude Code Specific Notes

The primary role defined in AGENTS.md applies to Claude Code:
1. **Help users write datacoretsx blocks** 
2. **Write new components, hooks, and utilities**
3. **Help users write datacore queries**

## Key Codebase Locations for LLM Tasks

### For Writing datacoretsx Blocks
- **Component Examples**: `src/api/ui/views/` - Contains Table, List, Card, Callout components
- **Available dc Object**: `src/api/local-api.tsx` - Shows all available `dc.*` methods and components
- **Hooks Documentation**: `src/ui/hooks.tsx` - Custom React hooks for vault data
- **React Integration**: `src/ui/javascript.tsx` - How TSX blocks are executed and rendered

### For Creating Components/Utilities  
- **UI Components**: `src/api/ui/` - Reusable UI component implementations
- **Utility Functions**: `src/utils/` - General utilities like data manipulation, JavaScript execution
- **Expression System**: `src/expression/` - For working with datacore expressions and literals
- **Data Structures**: `src/api/data-array.ts` - Enhanced array operations for data processing

### For Query Language
- **Query Parser**: `src/expression/parser.ts` - Query language grammar and parsing
- **Query Examples**: `docs/docs/data/query.md` - Comprehensive query syntax documentation
- **Index Types**: `src/index/types/index-query.ts` - TypeScript types for query structure

## Development Commands

### Build Commands
- `yarn build` - Full build (TypeScript compilation, API extraction, esbuild production build for both plugin and library)
- `yarn build-plugin` - Build only the Obsidian plugin (`build/plugin/main.js`)
- `yarn build-library` - Build only the npm library (`build/library/index.js`)

### Testing and Quality
- `yarn test` - Run Jest tests
- `yarn test-watch` - Run Jest tests in watch mode with no cache
- `yarn format` - Format code with Prettier
- `yarn check-format` - Check code formatting without making changes

### Installation Scripts
- `./scripts/install-built /path/to/vault` - Copy built plugin to an Obsidian vault
- Combined: `yarn build && ./scripts/install-built /path/to/vault`

## Architecture Overview

### Core Components
1. **Plugin Entry** (`src/main.ts`) - Obsidian plugin that initializes Datacore
2. **Datacore Engine** (`src/index/datacore.ts`) - Central reactive data engine
3. **Datastore** (`src/index/datastore.ts`) - In-memory index with query execution
4. **API Layer** (`src/api/api.ts`) - External API for querying and rendering
5. **Expression System** (`src/expression/`) - Parser and evaluator for queries and expressions

### Key Patterns
- **Dual Build System**: Builds both an Obsidian plugin and a standalone npm library
- **React/Preact Views**: Uses Preact with React compatibility for UI components
- **TypeScript + JSX/TSX**: Supports multiple script languages in code blocks
- **Web Workers**: Multi-threaded file importing via `src/index/web-worker/`
- **Reactive Updates**: Live-updating views that respond to vault changes
- **Query Language**: Custom query syntax similar to Dataview but more performant

### UI Component System
- Located in `src/api/ui/` with reusable components like Table, List, Cards
- CSS modules pattern for styling (`.css` files alongside `.tsx`)
- Built-in components: `dc.Table`, `dc.List`, etc. available in datacorejs blocks

### Code Block Types
The plugin registers these markdown code block processors:
- `datacorejs` - JavaScript execution
- `datacorejsx` - JSX (React) components  
- `datacorets` - TypeScript execution
- `datacoretsx` - TSX (TypeScript + JSX) components

### Testing
- Jest with jsdom environment
- Tests in `src/test/` organized by functionality
- ESM modules with ts-jest preset

### Build Configuration
- **esbuild** (`esbuild.config.mjs`) for bundling with inline worker support
- **TypeScript** with multiple configs: main, library, and API extractor
- **API Extractor** for generating library typings (`datacore.api.md`)
- **Preact Aliasing** - React imports resolve to preact/compat

### File Organization
- `src/index/types/` - Core data type definitions (markdown, canvas, indexable)
- `src/expression/` - Query language parser and evaluation
- `src/api/` - Public APIs and UI components  
- `src/utils/` - Shared utilities
- `docs/` - Docusaurus documentation site

## Datacoretsx Block Guide

### Block Structure
Datacoretsx blocks are TypeScript/React components that execute in Obsidian. They must return a React component:

```tsx
return function View() {
    // Your component logic here
    return <div>Hello World</div>;
}
```

### Available Context
- **No `import` statements** - Everything is provided via the `dc` object
- **`dc` object** - Main API with components, hooks, queries, and utilities
- **`h` and `Fragment`** - Preact rendering functions (automatically available)
- **React hooks** - Available as `dc.useState`, `dc.useEffect`, etc.

### Key `dc` Object Members

#### Query Functions
- `dc.useQuery(query)` - Live-updating query results (React hook)
- `dc.query(query)` - One-time query execution
- `dc.useCurrentFile()` - Current file metadata (React hook)
- `dc.useFile(path)` - Specific file metadata (React hook)

#### Components
- `dc.Table` - Table component with columns, paging, grouping
- `dc.List` - List view component  
- `dc.Card` - Card component for grid layouts
- `dc.Callout` - Callout/alert box component
- `dc.Stack` - Vertical flexbox container
- `dc.Group` - Horizontal flexbox container
- `dc.Button`, `dc.Textbox`, `dc.Checkbox`, etc. - Interactive elements

#### Utilities
- `dc.Literal` - Render literal values with proper formatting
- `dc.Markdown` - Render markdown content
- `dc.Link` - Render Obsidian-style links
- `dc.Icon` - Render Lucide icons
- `dc.array(data)` - Create enhanced DataArray for data manipulation

#### Data Processing
- `dc.useArray(input, process, deps)` - Memoized array processing
- `dc.coerce` - Type coercion utilities
- `dc.evaluate(expression)` - Evaluate datacore expressions

### Using dc.require()

Load code from other files or codeblocks:

```tsx
// Load from a .ts/.js file
const { MyComponent } = await dc.require("scripts/components.ts");

// Load from a codeblock in a markdown section
const { helper } = await dc.require(dc.headerLink("utils.md", "Helper Functions"));

// The loaded code must return an object:
// return { MyComponent, helper };
```

**Important**: 
- Use `return { ... }` not `export` statements in required code
- No circular dependencies allowed
- Loaded code executes with same `dc` context

### Query Language Quick Reference

#### Basic Types
- `@page` - All markdown pages
- `@section` - All sections
- `@block` - All blocks  
- `@task` - All task items
- `@file` - All files

#### Filters
- `#tag` - Tagged with specific tag
- `path("folder")` - Files in folder
- `exists(field)` - Has metadata field
- `field > value` - Expression filters
- `linkedto([[page]])` - Links to page
- `connected([[page]])` - Links to or from page

#### Combinators
- `and` - Both conditions
- `or` - Either condition  
- `!` - Negation
- `parentof(query)` - Parents of matches
- `childof(query)` - Children of matches

#### Example Queries
```javascript
// High-rated game pages
"@page and #game and rating >= 9"

// Incomplete tasks in Daily sections  
"@task and $completed = false and childof(@section and $name = 'Daily')"

// Pages linking to a specific person
"@page and linkedto([[John Smith]])"
```