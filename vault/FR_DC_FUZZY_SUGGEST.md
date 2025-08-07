# Feature Request: FuzzySuggestModal Integration for Datacore

## Overview

This feature adds comprehensive FuzzySuggestModal integration to datacore, allowing users to create powerful, reactive search interfaces within their `datacoretsx` blocks. The implementation provides both imperative (hook-based) and declarative (component-based) APIs for maximum flexibility.

## API Design

### Hook-Based API (Imperative)

#### `dc.useFuzzySuggest<T>(config)`

Creates a function that opens a FuzzySuggestModal when called. Best for simple interactions triggered by buttons or other events.

```tsx
const openSearch = dc.useFuzzySuggest({
    items: ["Red", "Green", "Blue"],
    itemText: (color) => color,
    onSelect: (color) => setSelected(color),
    placeholder: "Choose a color..."
});

<dc.Button onClick={openSearch}>Select Color</dc.Button>
```

#### `dc.useQueryFuzzySuggest<T>(config)`

Specialized hook for datacore queries with live updates. The query results are automatically kept in sync with vault changes.

```tsx
const openPageSearch = dc.useQueryFuzzySuggest({
    query: "@page and #important",
    itemText: (page) => page.$name,
    transform: (pages) => pages.filter(p => p.$tags?.includes("important")),
    onSelect: (page) => setSelectedPage(page)
});
```

### Component-Based API (Declarative)

#### `<dc.FuzzySuggestModal />`

A controlled component for more complex modal management scenarios.

```tsx
<dc.FuzzySuggestModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    app={dc.api.app}
    datacore={dc.api.core}
    items={items}
    itemText={(item) => item.name}
    onSelect={(item) => handleSelection(item)}
/>
```

## Configuration Options

### Core Options

- **`items`**: Array, function, or promise returning items to search
- **`query`**: Datacore query string (alternative to items)
- **`transform`**: Transform function for query results
- **`itemText`**: Function to extract searchable text from items
- **`onSelect`**: Callback when an item is selected
- **`onClose`**: Optional callback when modal closes without selection

### Customization Options

- **`renderSuggestion`**: Custom rendering function for suggestions
- **`placeholder`**: Input placeholder text
- **`emptyStateText`**: Text shown when no items match
- **`limit`**: Maximum number of suggestions to show
- **`modalClass`**: Custom CSS class for the modal
- **`containerClass`**: Custom CSS class for suggestion container

## Features

### 1. Multiple Data Sources

**Static Arrays:**
```tsx
items: ["Option 1", "Option 2", "Option 3"]
```

**Async Functions:**
```tsx
items: async () => {
    const response = await fetch('/api/data');
    return response.json();
}
```

**Datacore Queries:**
```tsx
query: "@page and #project and status = 'active'"
```

### 2. Custom Rendering

Rich suggestion display with custom HTML:

```tsx
renderSuggestion: (item, el) => {
    el.createDiv({ text: item.title, cls: "suggestion-title" });
    el.createDiv({ text: item.description, cls: "suggestion-subtitle" });
}
```

### 3. Reactive Updates

Query-based suggestions automatically update when vault data changes:

```tsx
// This will re-run the query when files are added/modified
const openTaskSearch = dc.useQueryFuzzySuggest({
    query: "@task and !$completed",
    itemText: (task) => task.$text
});
```

### 4. Type Safety

Full TypeScript support with generic types:

```tsx
interface Project {
    id: number;
    name: string;
    status: 'active' | 'completed' | 'planning';
}

const openProjectSearch = dc.useFuzzySuggest<Project>({
    items: projects,
    itemText: (project) => project.name,
    onSelect: (project) => {
        // project is properly typed as Project
        console.log(project.status);
    }
});
```

## Use Cases

### 1. Content Navigation
- Page/file selection with tag filtering
- Section navigation within long documents
- Task and project browsing

### 2. Data Entry
- Tag selection with autocomplete
- Person/contact assignment
- Category and classification selection

### 3. Quick Actions
- Template selection
- Command palette-style interfaces
- Setting and preference selection

### 4. Research and Analysis
- Literature review interfaces
- Source citation selection
- Reference management

## Implementation Details

### Architecture

The implementation consists of several key components:

1. **DatacoreFuzzySuggestModal**: Extended FuzzySuggestModal class that integrates with datacore
2. **Modal Registry**: Lifecycle management to prevent memory leaks
3. **React Integration**: Hooks and components that work seamlessly with React
4. **Query Integration**: Live updating queries using existing datacore infrastructure

### Performance Considerations

- Async item loading with loading states
- Query result caching through existing datacore mechanisms
- Automatic cleanup of modal instances
- Debounced search for large datasets

### Accessibility

- Full keyboard navigation support
- Screen reader compatibility
- Focus management
- Standard Obsidian modal patterns

## Examples

See `fuzzy-suggest-examples.md` for comprehensive usage examples including:

- Basic string list selection
- Query-based page selection with rich rendering
- Task assignment with complex data structures
- Async data loading patterns
- Custom styling and theming

## Technical Requirements

- Obsidian API FuzzySuggestModal
- React/Preact hooks integration
- Datacore query system
- TypeScript generic support
- CSS custom properties for theming

## Backwards Compatibility

This feature is purely additive and does not affect existing datacore functionality. It integrates cleanly with the existing `dc` object API and follows established patterns for hooks and components.