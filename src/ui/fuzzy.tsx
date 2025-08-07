import { App, FuzzySuggestModal } from "obsidian";
import { useCallback, useContext, useMemo, useRef } from "preact/hooks";
import { APP_CONTEXT, DATACORE_CONTEXT } from "ui/markdown";
import { Datacore } from "index/datacore";
import { DatacoreApi } from "api/api";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";

/** Options for opening a fuzzy suggest modal. */
export interface FuzzySuggestOptions<T> {
    /**
     * A static list of items to show. If provided together with getItems/query, this takes precedence.
     */
    items?: T[] | Promise<T[]>;
    /**
     * A function that returns the items to show. This will be invoked when the modal is opened.
     */
    getItems?: () => T[] | Promise<T[]>;
    /**
     * Optional datacore query whose results will be used as the items. If provided, items are the current query results
     * at the time of opening the modal.
     */
    query?: string | IndexQuery;
    /**
     * Map a datacore query result (Indexable) into an item of type T. Only used when `query` is provided.
     */
    mapItem?: (idx: Indexable) => T;
    /**
     * Convert an item into display text for the suggestion list.
     */
    getText?: (item: T) => string;
    /**
     * Called when an item is selected.
     */
    onSelect?: (item: T) => void | Promise<void>;
    /** Placeholder text for the input. */
    placeholder?: string;
    /** Empty state text when there are no items. */
    emptyStateText?: string;
    /** Maximum number of shown results. */
    limit?: number;
}

/** Internal modal that adapts options into an Obsidian FuzzySuggestModal. */
class DatacoreFuzzyModal<T> extends FuzzySuggestModal<T> {
    private readonly items: T[];
    private readonly getTextFn: (item: T) => string;
    private readonly onSelectFn?: (item: T) => void | Promise<void>;

    public constructor(app: App, items: T[], getText: (item: T) => string, onSelect?: (item: T) => void | Promise<void>, opts?: { placeholder?: string; emptyStateText?: string; limit?: number }) {
        super(app);
        this.items = items;
        this.getTextFn = getText;
        this.onSelectFn = onSelect;

        if (opts?.placeholder) this.setPlaceholder(opts.placeholder);
        if (opts?.emptyStateText) this.emptyStateText = opts.emptyStateText;
        if (opts?.limit !== undefined) this.limit = opts.limit;
    }

    getItems(): T[] {
        return this.items;
    }

    getItemText(item: T): string {
        return this.getTextFn(item);
    }

    async onChooseItem(item: T): Promise<void> {
        if (this.onSelectFn) await this.onSelectFn(item);
    }
}

async function resolveItems<T>(opts: FuzzySuggestOptions<T>, datacore: Datacore): Promise<T[]> {
    if (opts.items) return await opts.items;
    if (opts.getItems) return await opts.getItems();

    if (opts.query !== undefined) {
        const api = new DatacoreApi(datacore);
        const parsed = api.parseQuery(opts.query);
        const result = datacore.datastore.search(parsed);
        if (!result.successful) throw new Error("Failed to execute query: " + result.error);

        const mapper = opts.mapItem ?? (((x) => x) as (idx: Indexable) => T);
        return result.value.results.map(mapper);
    }

    return [];
}

/**
 * React hook that returns a function you can call to open an Obsidian FuzzySuggestModal.
 * - Supports static `items`, dynamic `getItems`, or a datacore `query` for suggestions.
 * - Integrates with React: you can close over state and the latest values are used when opening.
 */
export function useFuzzySuggest<T>(options: FuzzySuggestOptions<T>): () => Promise<T | undefined> {
    const app = useContext(APP_CONTEXT);
    const datacore = useContext(DATACORE_CONTEXT);

    // Always use the latest options without changing the `open` function identity.
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const open = useCallback(async (): Promise<T | undefined> => {
        const current = optionsRef.current;
        const items = await resolveItems(current, datacore);
        const getText = current.getText ?? ((item: T) => String(item));

        return new Promise<T | undefined>((resolve) => {
            const modal = new DatacoreFuzzyModal<T>(app, items, getText, async (item: T) => {
                try {
                    await current.onSelect?.(item);
                } finally {
                    resolve(item);
                }
            }, {
                placeholder: current.placeholder,
                emptyStateText: current.emptyStateText,
                limit: current.limit,
            });

            // If the modal is closed without selection, resolve undefined.
            const originalOnClose = (modal as any).onClose?.bind(modal) as (() => void) | undefined;
            (modal as any).onClose = () => {
                try {
                    if (originalOnClose) originalOnClose();
                } finally {
                    resolve(undefined);
                }
            };

            modal.open();
        });
    }, [app, datacore]);

    return open;
}

/** Convenience hook specialized for datacore query results as items. */
export function useFuzzyQuery(
    query: string | IndexQuery,
    options?: Omit<FuzzySuggestOptions<Indexable>, "items" | "getItems" | "query" | "mapItem"> & {
        mapItem?: (idx: Indexable) => Indexable;
    }
): () => Promise<Indexable | undefined> {
    // Default text renderer for Indexable results.
    const defaultGetText = useMemo(() => {
        return (idx: Indexable) => {
            // Prefer a human-friendly name if available; fall back to ID or JSON.
            const name = (idx as any).$name ?? (idx as any).name ?? undefined;
            if (typeof name === "string" && name.length > 0) return name;
            if (typeof (idx as any).$id === "string") return (idx as any).$id as string;
            if (typeof (idx as any).$file === "string") return (idx as any).$file as string;
            try {
                return JSON.stringify(idx);
            } catch {
                return String(idx);
            }
        };
    }, []);

    return useFuzzySuggest<Indexable>({
        ...(options ?? {}),
        query,
        mapItem: options?.mapItem,
        getText: options?.getText ?? defaultGetText,
    });
}