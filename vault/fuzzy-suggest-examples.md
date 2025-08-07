# FuzzySuggestModal Examples

This file demonstrates various ways to use the new FuzzySuggestModal integration in datacore.

## Basic String List Example

This example shows how to use `dc.useFuzzySuggest` with a simple array of strings.

```datacoretsx
return function BasicStringExample() {
    const [selected, setSelected] = dc.useState("");
    
    const openSearch = dc.useFuzzySuggest({
        items: ["Red", "Green", "Blue", "Yellow", "Purple", "Orange", "Pink"],
        itemText: (color) => color,
        onSelect: (color) => setSelected(color),
        placeholder: "Choose a color...",
        emptyStateText: "No colors found"
    });
    
    return (
        <dc.Stack>
            <h3>Color Selector</h3>
            <dc.Group>
                <dc.Textbox 
                    value={selected} 
                    placeholder="No color selected"
                    disabled 
                />
                <dc.Button onClick={openSearch}>
                    Select Color
                </dc.Button>
            </dc.Group>
            {selected && (
                <dc.Callout type="info">
                    You selected: <strong>{selected}</strong>
                </dc.Callout>
            )}
        </dc.Stack>
    );
}
```

## Query-Based Page Selector

This example uses `dc.useQueryFuzzySuggest` with a datacore query to search through pages.

```datacoretsx
return function PageSelector() {
    const [selectedPage, setSelectedPage] = dc.useState(null);
    
    const openPageSearch = dc.useQueryFuzzySuggest({
        query: "@page",
        itemText: (page) => page.$name,
        renderSuggestion: (page, el) => {
            el.createDiv({ text: page.$name, cls: "suggestion-title" });
            if (page.$tags && page.$tags.length > 0) {
                el.createDiv({ 
                    text: `Tags: ${page.$tags.join(", ")}`, 
                    cls: "suggestion-subtitle" 
                });
            }
        },
        onSelect: (page) => setSelectedPage(page),
        placeholder: "Search for a page...",
        limit: 10
    });
    
    return (
        <dc.Stack>
            <h3>Page Selector</h3>
            <dc.Button onClick={openPageSearch} intent="info">
                Select Page
            </dc.Button>
            {selectedPage && (
                <dc.Card>
                    <h4>{selectedPage.$name}</h4>
                    <p>Path: {selectedPage.$path}</p>
                    {selectedPage.$tags && selectedPage.$tags.length > 0 && (
                        <p>Tags: {selectedPage.$tags.join(", ")}</p>
                    )}
                    <dc.Link path={selectedPage.$path}>Open Page →</dc.Link>
                </dc.Card>
            )}
        </dc.Stack>
    );
}
```

## Advanced Task Assignment Example

This example shows a more complex use case with dynamic data and multiple modals.

```datacoretsx
return function TaskAssignment() {
    const [tasks, setTasks] = dc.useState([
        { id: 1, text: "Review PR #123", assignee: null, priority: "high" },
        { id: 2, text: "Write documentation", assignee: null, priority: "medium" },
        { id: 3, text: "Fix login bug", assignee: null, priority: "high" },
        { id: 4, text: "Update dependencies", assignee: null, priority: "low" }
    ]);
    
    const people = [
        { name: "Alice Johnson", role: "Developer", email: "alice@example.com" },
        { name: "Bob Smith", role: "Designer", email: "bob@example.com" },
        { name: "Charlie Davis", role: "Developer", email: "charlie@example.com" },
        { name: "Diana Miller", role: "Manager", email: "diana@example.com" }
    ];
    
    const createAssignModal = (taskId) => {
        return dc.useFuzzySuggest({
            items: people,
            itemText: (person) => person.name,
            renderSuggestion: (person, el) => {
                el.createDiv({ text: person.name, cls: "suggestion-title" });
                el.createDiv({ 
                    text: `${person.role} • ${person.email}`, 
                    cls: "suggestion-subtitle" 
                });
            },
            onSelect: (person) => {
                setTasks(tasks.map(task => 
                    task.id === taskId 
                        ? { ...task, assignee: person.name }
                        : task
                ));
            },
            placeholder: "Search for team member...",
            emptyStateText: "No team members found"
        });
    };
    
    const priorityColors = {
        high: "error",
        medium: "warn",
        low: "info"
    };
    
    return (
        <dc.Stack>
            <h3>Task Management</h3>
            <dc.Table
                data={tasks}
                columns={[
                    { 
                        key: "text", 
                        title: "Task",
                        width: "40%"
                    },
                    { 
                        key: "priority", 
                        title: "Priority",
                        width: "15%",
                        render: (task) => (
                            <dc.Callout type={priorityColors[task.priority]} compact>
                                {task.priority.toUpperCase()}
                            </dc.Callout>
                        )
                    },
                    { 
                        key: "assignee", 
                        title: "Assignee",
                        width: "25%",
                        render: (task) => task.assignee || <em>Unassigned</em>
                    },
                    {
                        key: "actions",
                        title: "Actions",
                        width: "20%",
                        render: (task) => (
                            <dc.Button 
                                onClick={createAssignModal(task.id)}
                                intent={task.assignee ? undefined : "warn"}
                                size="small"
                            >
                                {task.assignee ? "Reassign" : "Assign"}
                            </dc.Button>
                        )
                    }
                ]}
            />
            
            <h4>Summary</h4>
            <p>Assigned tasks: {tasks.filter(t => t.assignee).length} / {tasks.length}</p>
        </dc.Stack>
    );
}
```

## Declarative Component Example

This example uses the `dc.FuzzySuggestModal` component with controlled state.

```datacoretsx
return function DeclarativeExample() {
    const [isOpen, setIsOpen] = dc.useState(false);
    const [selectedFruit, setSelectedFruit] = dc.useState(null);
    
    const fruits = [
        { name: "Apple", emoji: "🍎", color: "red" },
        { name: "Banana", emoji: "🍌", color: "yellow" },
        { name: "Cherry", emoji: "🍒", color: "red" },
        { name: "Date", emoji: "🌴", color: "brown" },
        { name: "Elderberry", emoji: "🫐", color: "purple" },
        { name: "Fig", emoji: "🟣", color: "purple" },
        { name: "Grape", emoji: "🍇", color: "purple" },
        { name: "Honeydew", emoji: "🍈", color: "green" }
    ];
    
    return (
        <dc.Stack>
            <h3>Fruit Picker (Declarative)</h3>
            
            <dc.Button onClick={() => setIsOpen(true)} intent="success">
                {selectedFruit ? `Change from ${selectedFruit.name}` : "Pick a Fruit"}
            </dc.Button>
            
            {selectedFruit && (
                <dc.Card>
                    <h4>{selectedFruit.emoji} {selectedFruit.name}</h4>
                    <p>Color: {selectedFruit.color}</p>
                </dc.Card>
            )}
            
            <dc.FuzzySuggestModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                app={dc.api.app}
                datacore={dc.api.core}
                items={fruits}
                itemText={(fruit) => fruit.name}
                renderSuggestion={(fruit, el) => {
                    const container = el.createDiv({ cls: "suggestion-container" });
                    container.createSpan({ text: fruit.emoji + " ", cls: "suggestion-emoji" });
                    container.createSpan({ text: fruit.name, cls: "suggestion-title" });
                    container.createSpan({ 
                        text: ` (${fruit.color})`, 
                        cls: "suggestion-subtitle" 
                    });
                }}
                onSelect={(fruit) => {
                    setSelectedFruit(fruit);
                }}
                placeholder="Search fruits..."
                emptyStateText="No fruits match your search"
            />
        </dc.Stack>
    );
}
```

## Query-Based Task Selector with Transformation

This example uses `dc.useQueryFuzzySuggest` to search tasks with custom transformation.

```datacoretsx
return function TaskSelector() {
    const [selectedTask, setSelectedTask] = dc.useState(null);
    
    // Note: This assumes you have tasks in your vault with proper metadata
    const openTaskSearch = dc.useQueryFuzzySuggest({
        query: "@task and !$completed",
        transform: (tasks) => tasks.map(task => ({
            text: task.$text,
            page: task.$page?.$name || "Unknown",
            path: task.$page?.$path,
            priority: task.priority || "normal",
            due: task.due
        })),
        itemText: (task) => task.text,
        renderSuggestion: (task, el) => {
            el.createDiv({ text: task.text, cls: "suggestion-title" });
            const details = [];
            if (task.page) details.push(`📄 ${task.page}`);
            if (task.priority !== "normal") details.push(`⚡ ${task.priority}`);
            if (task.due) details.push(`📅 ${task.due}`);
            
            if (details.length > 0) {
                el.createDiv({ 
                    text: details.join(" • "), 
                    cls: "suggestion-subtitle" 
                });
            }
        },
        onSelect: (task) => setSelectedTask(task),
        placeholder: "Search incomplete tasks...",
        emptyStateText: "No incomplete tasks found"
    });
    
    return (
        <dc.Stack>
            <h3>Task Finder</h3>
            <dc.Button onClick={openTaskSearch}>
                Find Task
            </dc.Button>
            
            {selectedTask && (
                <dc.Callout type="info">
                    <h4>Selected Task</h4>
                    <p>{selectedTask.text}</p>
                    {selectedTask.page && (
                        <p>
                            From: <dc.Link path={selectedTask.path}>{selectedTask.page}</dc.Link>
                        </p>
                    )}
                    {selectedTask.priority !== "normal" && (
                        <p>Priority: {selectedTask.priority}</p>
                    )}
                    {selectedTask.due && (
                        <p>Due: {selectedTask.due}</p>
                    )}
                </dc.Callout>
            )}
        </dc.Stack>
    );
}
```

## Async Items Example

This example demonstrates loading items asynchronously.

```datacoretsx
return function AsyncItemsExample() {
    const [selected, setSelected] = dc.useState(null);
    const [loading, setLoading] = dc.useState(false);
    
    // Simulate an async data fetch
    const fetchItems = async () => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real usage, this could be an API call or complex query
        const items = [
            { id: 1, name: "Project Alpha", status: "active" },
            { id: 2, name: "Project Beta", status: "completed" },
            { id: 3, name: "Project Gamma", status: "active" },
            { id: 4, name: "Project Delta", status: "planning" },
            { id: 5, name: "Project Epsilon", status: "active" }
        ];
        
        setLoading(false);
        return items;
    };
    
    const openProjectSearch = dc.useFuzzySuggest({
        items: fetchItems,
        itemText: (project) => project.name,
        renderSuggestion: (project, el) => {
            el.createDiv({ text: project.name, cls: "suggestion-title" });
            el.createDiv({ 
                text: `Status: ${project.status}`, 
                cls: "suggestion-subtitle" 
            });
        },
        onSelect: (project) => setSelected(project),
        placeholder: "Search projects...",
        emptyStateText: "No projects found"
    });
    
    return (
        <dc.Stack>
            <h3>Async Project Selector</h3>
            <dc.Group>
                <dc.Button onClick={openProjectSearch} disabled={loading}>
                    {loading ? "Loading..." : "Select Project"}
                </dc.Button>
                {loading && <span>Fetching projects...</span>}
            </dc.Group>
            
            {selected && (
                <dc.Card>
                    <h4>{selected.name}</h4>
                    <p>Status: <strong>{selected.status}</strong></p>
                </dc.Card>
            )}
        </dc.Stack>
    );
}
```

## Custom Styling Example

This example shows how to apply custom CSS classes to the modal.

```datacoretsx
return function CustomStyledExample() {
    const [selected, setSelected] = dc.useState("");
    
    const themes = [
        { name: "Minimal", class: "theme-minimal", description: "Clean and simple" },
        { name: "Dark", class: "theme-dark", description: "Easy on the eyes" },
        { name: "Light", class: "theme-light", description: "Bright and clear" },
        { name: "Colorful", class: "theme-colorful", description: "Vibrant colors" },
        { name: "Monospace", class: "theme-mono", description: "Code-focused" }
    ];
    
    const openThemeSelector = dc.useFuzzySuggest({
        items: themes,
        itemText: (theme) => theme.name,
        renderSuggestion: (theme, el) => {
            el.addClass(theme.class);
            el.createDiv({ text: theme.name, cls: "suggestion-title" });
            el.createDiv({ text: theme.description, cls: "suggestion-subtitle" });
        },
        onSelect: (theme) => setSelected(theme.name),
        placeholder: "Choose a theme...",
        modalClass: "dc-fuzzy-modal theme-selector-modal",
        containerClass: "theme-selector-container"
    });
    
    return (
        <dc.Stack>
            <h3>Theme Selector</h3>
            <dc.Button onClick={openThemeSelector}>
                Select Theme
            </dc.Button>
            {selected && (
                <p>Current theme: <strong>{selected}</strong></p>
            )}
        </dc.Stack>
    );
}
```

## Advanced Integration Example

This example shows integration with existing datacore components and complex state management.

```datacoretsx
return function AdvancedIntegrationExample() {
    const [projects, setProjects] = dc.useState([]);
    const [selectedProject, setSelectedProject] = dc.useState(null);
    const [filterTag, setFilterTag] = dc.useState("");
    
    // Load projects from vault pages
    const allPages = dc.useQuery("@page and #project");
    
    dc.useEffect(() => {
        if (allPages.successful) {
            const projectData = allPages.value.data.map(page => ({
                id: page.$path,
                name: page.$name,
                path: page.$path,
                tags: page.$tags || [],
                status: page.status || "planning",
                description: page.description || "",
                team: page.team || []
            }));
            setProjects(projectData);
        }
    }, [allPages]);
    
    // Dynamic project search with filtering
    const openProjectSearch = dc.useFuzzySuggest({
        items: () => {
            let filteredProjects = projects;
            if (filterTag) {
                filteredProjects = projects.filter(p => 
                    p.tags.includes(filterTag)
                );
            }
            return filteredProjects;
        },
        itemText: (project) => project.name,
        renderSuggestion: (project, el) => {
            const container = el.createDiv({ cls: "suggestion-container" });
            container.createDiv({ text: project.name, cls: "suggestion-title" });
            
            if (project.description) {
                container.createDiv({ 
                    text: project.description, 
                    cls: "suggestion-subtitle" 
                });
            }
            
            if (project.tags.length > 0) {
                const tagContainer = container.createDiv({ cls: "suggestion-tags" });
                project.tags.forEach(tag => {
                    tagContainer.createSpan({ 
                        text: `#${tag}`, 
                        cls: "suggestion-tag" 
                    });
                });
            }
        },
        onSelect: (project) => setSelectedProject(project),
        placeholder: filterTag ? `Search ${filterTag} projects...` : "Search all projects...",
        emptyStateText: "No projects found"
    });
    
    const availableTags = [...new Set(projects.flatMap(p => p.tags))];
    
    const openTagFilter = dc.useFuzzySuggest({
        items: ["", ...availableTags], // "" means "all tags"
        itemText: (tag) => tag || "All Projects",
        onSelect: (tag) => setFilterTag(tag),
        placeholder: "Filter by tag...",
        emptyStateText: "No tags available"
    });
    
    return (
        <dc.Stack>
            <h3>Project Browser</h3>
            
            <dc.Group>
                <dc.Button onClick={openTagFilter}>
                    Filter: {filterTag || "All"}
                </dc.Button>
                <dc.Button onClick={openProjectSearch} intent="primary">
                    Select Project
                </dc.Button>
            </dc.Group>
            
            {selectedProject && (
                <dc.Card>
                    <h4>{selectedProject.name}</h4>
                    <p>{selectedProject.description}</p>
                    <p>Status: <strong>{selectedProject.status}</strong></p>
                    {selectedProject.tags.length > 0 && (
                        <p>Tags: {selectedProject.tags.map(tag => `#${tag}`).join(", ")}</p>
                    )}
                    {selectedProject.team.length > 0 && (
                        <p>Team: {selectedProject.team.join(", ")}</p>
                    )}
                    <dc.Link path={selectedProject.path}>Open Project →</dc.Link>
                </dc.Card>
            )}
            
            <h4>Project Summary</h4>
            <dc.Table
                data={projects.slice(0, 5)}
                columns={[
                    { key: "name", title: "Name" },
                    { key: "status", title: "Status" },
                    { 
                        key: "tags", 
                        title: "Tags",
                        render: (project) => project.tags.length > 0 
                            ? project.tags.map(tag => `#${tag}`).join(", ")
                            : "—"
                    }
                ]}
            />
        </dc.Stack>
    );
}
```

## Tips and Best Practices

1. **Memory Management**: The modal automatically cleans up when the component unmounts
2. **Query Performance**: For large vaults, consider adding filters to your queries
3. **Custom Rendering**: Use `renderSuggestion` for rich suggestion displays
4. **Async Data**: The modal handles promises automatically
5. **Keyboard Navigation**: The modal supports standard Obsidian keyboard shortcuts
6. **Mobile Support**: The modal is responsive and works on mobile devices
7. **Type Safety**: Use TypeScript generics for better development experience
8. **Performance**: Consider using `limit` option for large datasets
9. **User Experience**: Provide meaningful placeholder and empty state text
10. **Integration**: Combine with other dc components for rich interfaces