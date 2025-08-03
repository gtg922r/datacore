/**
 * useField Hook for Datacore
 * 
 * A React hook that provides useState-like behavior for Obsidian frontmatter fields.
 * Place this file in your vault and load it with: const { useField } = await dc.require("path/to/useField.tsx");
 * 
 * Features:
 * - Reactive updates when frontmatter changes (including external changes)
 * - Support for all frontmatter field types (string, number, boolean, array, object)
 * - Default values when field doesn't exist
 * - TypeScript support with generics
 * - Automatic field creation/deletion
 * 
 * Usage example:
 * ```tsx
 * const { useField, useCurrentFileField } = await dc.require("useField.tsx");
 * 
 * function MyComponent() {
 *   // Basic usage with different types
 *   const [title, setTitle] = useField("MyFile.md", "title", "Default Title");
 *   const [tags, setTags] = useField<string[]>("MyFile.md", "tags", []);
 *   const [count, setCount] = useField<number>("MyFile.md", "count", 0);
 *   
 *   // Usage with validation
 *   const [rating, setRating] = useField<number>("MyFile.md", "rating", 1, {
 *     validate: (value) => typeof value === 'number' && value >= 1 && value <= 5,
 *     onValidationError: (value, field) => alert(`Invalid ${field}: ${value}`)
 *   });
 *   
 *   // Current file usage (automatically uses the current file path)
 *   const [status, setStatus] = useCurrentFileField("status", "draft");
 *   
 *   return (
 *     <div>
 *       <input value={title} onChange={(e) => setTitle(e.target.value)} />
 *       <button onClick={() => setCount(count + 1)}>Count: {count}</button>
 *       <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
 *         {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */


// Type definitions for better TypeScript support
type Literal = string | number | boolean | null | undefined | Literal[] | { [key: string]: Literal };

interface DatacoreLocalApi {
    useFile: (path: string, settings?: { debounce?: number }) => any;
    currentPath: () => string;
    app: {
        vault: {
            getFileByPath: (path: string) => any;
        };
        fileManager: {
            processFrontMatter: (file: any, fn: (frontmatter: Record<string, any>) => void) => Promise<void>;
        };
    };
}

interface FileMetadata {
    frontmatter?: Record<string, any>;
    $file?: string;
    $id?: string;
}

type UseFieldReturn<T> = [T | undefined, (value: T | undefined) => Promise<void>];

interface UseFieldOptions {
    /**
     * Debounce time in milliseconds for file change detection.
     * Defaults to datacore's default debounce setting.
     */
    debounce?: number;
    
    /**
     * Whether to validate the field value before setting.
     */
    validate?: (value: any) => boolean;
    
    /**
     * Callback called when validation fails.
     */
    onValidationError?: (value: any, fieldName: string) => void;
}

/**
 * Create the useField hooks with access to the datacore context.
 * This function is called with the dc context when the module is loaded.
 */
function createUseFieldHooks(dc: DatacoreLocalApi) {
    /**
     * Hook for managing frontmatter fields in Obsidian files with React-like state behavior.
     * Returns a tuple of [value, setValue] similar to useState, but backed by frontmatter.
     * 
     * @param filePath - The path to the file containing the frontmatter
     * @param fieldName - The name of the frontmatter field to manage  
     * @param defaultValue - Default value if the field doesn't exist (optional)
     * @param options - Additional options for debouncing and validation
     * @returns A tuple of [currentValue, setterFunction]
     */
    function useField<T = Literal>(
        filePath: string,
        fieldName: string,
        defaultValue?: T,
        options: UseFieldOptions = {}
    ): UseFieldReturn<T> {
        const { debounce, validate, onValidationError } = options;
        
        // Use the datacore file metadata hook to track changes
        const fileMetadata: FileMetadata = dc.useFile(filePath, { debounce });
        
        // Extract the current field value from frontmatter
        const currentValue = dc.useMemo(() => {
            if (!fileMetadata?.frontmatter) {
                return defaultValue;
            }
            
            const frontmatterValue = fileMetadata.frontmatter[fieldName];
            return frontmatterValue !== undefined ? frontmatterValue : defaultValue;
        }, [fileMetadata, fieldName, defaultValue]);

        // Create setter function that updates frontmatter
        const setValue = dc.useCallback(async (newValue: T | undefined): Promise<void> => {
            // Validation check
            if (newValue !== undefined && validate && !validate(newValue)) {
                const errorMsg = `Validation failed for field '${fieldName}' with value: ${JSON.stringify(newValue)}`;
                console.error(errorMsg);
                
                if (onValidationError) {
                    onValidationError(newValue, fieldName);
                } else {
                    throw new Error(errorMsg);
                }
                return;
            }

            if (!dc?.app) {
                const error = new Error('Datacore app not available for useField');
                console.error(error.message);
                throw error;
            }

            const file = dc.app.vault.getFileByPath(filePath);
            if (!file) {
                const error = new Error(`File not found: ${filePath}`);
                console.error(error.message);
                throw error;
            }

            try {
                await dc.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, any>) => {
                    if (newValue === undefined) {
                        // Remove the field if setting to undefined
                        delete frontmatter[fieldName];
                    } else {
                        // Set the new value
                        frontmatter[fieldName] = newValue;
                    }
                });
            } catch (error) {
                const enhancedError = new Error(`Error updating frontmatter field '${fieldName}' in file '${filePath}': ${error}`);
                console.error(enhancedError.message);
                throw enhancedError;
            }
        }, [filePath, fieldName, validate, onValidationError]);

        return [currentValue, setValue];
    }

    /**
     * Alternative version that works with the current file automatically
     * 
     * @param fieldName - The name of the frontmatter field to manage
     * @param defaultValue - Default value if the field doesn't exist (optional)
     * @param options - Additional options for debouncing and validation
     * @returns A tuple of [currentValue, setterFunction]
     */
    function useCurrentFileField<T = Literal>(
        fieldName: string,
        defaultValue?: T,
        options: UseFieldOptions = {}
    ): UseFieldReturn<T> {
        const currentPath = dc.currentPath();
        return useField(currentPath, fieldName, defaultValue, options);
    }

    return {
        useField,
        useCurrentFileField
    };
}

// The dc context is available in the execution context when this module is loaded
// We return the hook factory function that will be called with the dc context
return createUseFieldHooks(dc);