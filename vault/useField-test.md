# useField Test

## Existing useField Test

```datacoretsx
return function FieldTest() {
    const currentFile = dc.useCurrentFile();
    const [name, setName] = dc.useField(currentFile, "name", "");
    const [count, setCount] = dc.useField(currentFile, "count", 0);
    
    return (
        <dc.Stack>
            <h3>Field Editor Test</h3>
            <dc.Group>
                <label>Name:</label>
                <dc.Textbox 
                    value={name} 
                    onChange={setName}
                    placeholder="Enter name"
                />
            </dc.Group>
            <dc.Group>
                <label>Count:</label>
                <dc.Textbox 
                    value={count.toString()} 
                    onChange={(val) => setCount(parseInt(val) || 0)}
                    placeholder="Enter number"
                />
            </dc.Group>
            <p>Current values: name="{name}", count={count}</p>
        </dc.Stack>
    );
}
```

## FuzzySuggest Test

Test the new FuzzySuggest functionality:

```datacoretsx
return function FuzzySuggestTest() {
    const [selectedColor, setSelectedColor] = dc.useState("");
    const [selectedPage, setSelectedPage] = dc.useState(null);
    
    // Test basic fuzzy suggest with static items
    const openColorSearch = dc.useFuzzySuggest({
        items: ["Red", "Green", "Blue", "Yellow", "Purple", "Orange"],
        itemText: (color) => color,
        onSelect: (color) => setSelectedColor(color),
        placeholder: "Choose a color...",
        emptyStateText: "No colors found"
    });
    
    // Test query-based fuzzy suggest
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
        limit: 5
    });
    
    return (
        <dc.Stack>
            <h3>FuzzySuggest Test</h3>
            
            <h4>Color Selector</h4>
            <dc.Group>
                <dc.Button onClick={openColorSearch}>
                    Select Color
                </dc.Button>
                <dc.Textbox 
                    value={selectedColor} 
                    placeholder="No color selected"
                    disabled 
                />
            </dc.Group>
            
            <h4>Page Selector</h4>
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
                </dc.Card>
            )}
            
            <h4>Test Results</h4>
            <p>Selected color: {selectedColor || "None"}</p>
            <p>Selected page: {selectedPage?.$name || "None"}</p>
        </dc.Stack>
    );
}
```