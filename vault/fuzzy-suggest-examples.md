# Fuzzy Suggest Examples

Below are example datacoretsx blocks demonstrating how to open a FuzzySuggestModal from a button.

## Static List

```datacoretsx
return function View() {
  const open = dc.useFuzzySuggest<string>({
    items: ["Alpha", "Bravo", "Charlie", "Delta"],
    getText: (s) => s,
    onSelect: (s) => console.log("Selected:", s),
    placeholder: "Pick an item...",
  });

  return (
    <dc.Stack>
      <dc.Button onClick={open}>Open Static Fuzzy</dc.Button>
    </dc.Stack>
  );
}
```

## From a Datacore Query

```datacoretsx
return function View() {
  // Query all pages; you can refine this query.
  const open = dc.useFuzzyQuery("@page", {
    getText: (idx) => idx.$name ?? idx.$file ?? idx.$id,
    onSelect: (idx) => console.log("Picked page:", idx.$file),
    placeholder: "Select a page...",
  });

  return (
    <dc.Stack>
      <dc.Button onClick={open}>Choose Page</dc.Button>
    </dc.Stack>
  );
}
```

## Dynamic Items

```datacoretsx
return function View() {
  const [prefix, setPrefix] = dc.useState("A");

  const open = dc.useFuzzySuggest<string>({
    getItems: () => ["Aardvark", "Banana", "Avocado", "Blueberry"].filter(x => x.startsWith(prefix)),
    onSelect: (s) => console.log("Selected:", s),
  });

  return (
    <dc.Stack>
      <dc.Group>
        <dc.Textbox value={prefix} onInput={(e) => setPrefix(e.currentTarget.value)} />
        <dc.Button onClick={open}>Open Filtered</dc.Button>
      </dc.Group>
    </dc.Stack>
  );
}
```