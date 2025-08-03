# useField Hook Test

This is a test file to demonstrate the `useField` hook functionality.

## Test frontmatter:
```yaml
---
title: "Test Document"
count: 0
tags: ["react", "datacore", "test"]
rating: 5
status: "draft"
---
```

## Interactive Test Component

```datacoretsx
const { useField, useCurrentFileField } = await dc.require("useField.tsx");

function TestComponent() {
    // Test basic string field
    const [title, setTitle] = useField("useField-test.md", "title", "Default Title");
    
    // Test number field with validation
    const [count, setCount] = useField("useField-test.md", "count", 0, {
        validate: (value) => typeof value === 'number' && value >= 0,
        onValidationError: (value, field) => {
            console.error(`Invalid ${field}: ${value} - must be a non-negative number`);
        }
    });
    
    // Test array field
    const [tags, setTags] = useField("useField-test.md", "tags", []);
    
    // Test current file field usage
    const [status, setStatus] = useCurrentFileField("status", "draft");
    
    // Test rating with validation
    const [rating, setRating] = useField("useField-test.md", "rating", 1, {
        validate: (value) => typeof value === 'number' && value >= 1 && value <= 5,
        onValidationError: (value, field) => alert(`Invalid ${field}: ${value} - must be 1-5`)
    });

    return (
        <dc.Stack style={{ gap: "20px", padding: "20px" }}>
            <dc.Group>
                <strong>Title:</strong>
                <input 
                    value={title || ""} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ marginLeft: "10px" }}
                />
            </dc.Group>
            
            <dc.Group>
                <strong>Count ({count}):</strong>
                <dc.Button onClick={() => setCount((count || 0) + 1)}>+1</dc.Button>
                <dc.Button onClick={() => setCount(Math.max(0, (count || 0) - 1))}>-1</dc.Button>
            </dc.Group>
            
            <dc.Group>
                <strong>Status:</strong>
                <select 
                    value={status || "draft"} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ marginLeft: "10px" }}
                >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                </select>
            </dc.Group>
            
            <dc.Group>
                <strong>Rating ({rating}):</strong>
                {[1,2,3,4,5].map(n => (
                    <dc.Button 
                        key={n}
                        onClick={() => setRating(n)}
                        style={{ 
                            backgroundColor: rating === n ? '#007acc' : '#f0f0f0',
                            color: rating === n ? 'white' : 'black'
                        }}
                    >
                        {n}
                    </dc.Button>
                ))}
            </dc.Group>
            
            <dc.Group>
                <strong>Tags:</strong>
                <div>{JSON.stringify(tags)}</div>
                <dc.Button onClick={() => setTags([...(tags || []), "new-tag"])}>
                    Add Tag
                </dc.Button>
                <dc.Button onClick={() => setTags((tags || []).slice(0, -1))}>
                    Remove Last
                </dc.Button>
            </dc.Group>
            
            <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f9f9f9" }}>
                <strong>Test Actions:</strong>
                <dc.Group style={{ marginTop: "10px" }}>
                    <dc.Button onClick={() => setTitle(undefined)}>Clear Title</dc.Button>
                    <dc.Button onClick={() => setCount(undefined)}>Clear Count</dc.Button>
                    <dc.Button onClick={() => setTags(undefined)}>Clear Tags</dc.Button>
                </dc.Group>
            </div>
        </dc.Stack>
    );
}

return <TestComponent />;
```

## Expected Behavior

1. **Reactive Updates**: Changes should immediately reflect in the frontmatter and trigger re-renders
2. **Type Safety**: TypeScript should provide proper type checking
3. **Validation**: Invalid values (like negative counts or ratings outside 1-5) should be rejected
4. **External Changes**: If you manually edit the frontmatter in the file, the UI should update
5. **Field Deletion**: Setting a field to `undefined` should remove it from frontmatter
6. **Current File**: `useCurrentFileField` should work with this file's frontmatter

## Frontmatter Inspection

Current frontmatter values:
```datacoretsx
const currentFile = dc.useCurrentFile();
const frontmatter = currentFile?.frontmatter || {};

return (
    <dc.Stack>
        <h4>Live Frontmatter Values:</h4>
        <pre style={{ background: "#f5f5f5", padding: "10px" }}>
            {JSON.stringify(frontmatter, null, 2)}
        </pre>
    </dc.Stack>
);
```