/** @module api/ui/modals */
import { App, FuzzySuggestModal } from "obsidian";
import { Datacore } from "index/datacore";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import { APP_CONTEXT, DATACORE_CONTEXT } from "ui/markdown";
import { useFullQuery } from "ui/hooks";

/**
 * Configuration for FuzzySuggest functionality.
 * @public
 */
export interface FuzzySuggestConfig<T> {
    /** The items to search through. Can be an array, promise, or function returning items. */
    items?: T[] | (() => T[] | Promise<T[]>) | (() => Promise<T[]>);
    /** Datacore query to use as the source of items. */
    query?: string;
    /** Transform function for query results (only used with query). */
    transform?: (items: Indexable[]) => T[];
    /** Function to extract searchable text from an item. */
    itemText: (item: T) => string;
    /** Custom rendering function for suggestions. */
    renderSuggestion?: (item: T, el: HTMLElement) => void;
    /** Callback when an item is selected. */
    onSelect: (item: T) => void;
    /** Callback when the modal is closed without selection. */
    onClose?: () => void;
    /** Placeholder text for the input. */
    placeholder?: string;
    /** Text shown when no items match. */
    emptyStateText?: string;
    /** Maximum number of suggestions to show. */
    limit?: number;
    /** Custom CSS class for the modal. */
    modalClass?: string;
    /** Custom CSS class for the suggestion container. */
    containerClass?: string;
}

/**
 * Extended FuzzySuggestModal that works with datacore.
 * @internal
 */
class DatacoreFuzzySuggestModal<T> extends FuzzySuggestModal<T> {
    private config: FuzzySuggestConfig<T>;
    private datacore?: Datacore;
    private items: T[] = [];
    private isLoading = false;

    constructor(app: App, config: FuzzySuggestConfig<T>, datacore?: Datacore) {
        super(app);
        this.config = config;
        this.datacore = datacore;
        
        // Apply custom styling
        if (config.modalClass) {
            this.modalEl.addClasses(config.modalClass.split(' '));
        }
        if (config.containerClass) {
            this.containerEl.addClasses(config.containerClass.split(' '));
        }
        
        this.setPlaceholder(config.placeholder || "Search...");
        this.setInstructions([
            { command: "↑↓", purpose: "to navigate" },
            { command: "↵", purpose: "to select" },
            { command: "esc", purpose: "to dismiss" },
        ]);
    }

    async onOpen() {
        super.onOpen();
        await this.loadItems();
    }

    private async loadItems() {
        this.isLoading = true;
        try {
            let items: T[];

            if (this.config.query && this.datacore) {
                // Use datacore query
                const result = await this.datacore.datastore.query(this.config.query);
                if (result.successful) {
                    items = this.config.transform 
                        ? this.config.transform(result.value.data)
                        : result.value.data as T[];
                } else {
                    console.error("Datacore query failed:", result.error);
                    items = [];
                }
            } else if (this.config.items) {
                // Use provided items
                if (typeof this.config.items === 'function') {
                    const result = this.config.items();
                    items = await Promise.resolve(result);
                } else {
                    items = this.config.items;
                }
            } else {
                items = [];
            }

            this.items = items;
            
            // Apply limit if specified
            if (this.config.limit && this.items.length > this.config.limit) {
                this.items = this.items.slice(0, this.config.limit);
            }
            
            this.updateSuggestions();
        } catch (error) {
            console.error("Failed to load items:", error);
            this.items = [];
        } finally {
            this.isLoading = false;
        }
    }

    getItems(): T[] {
        return this.items;
    }

    getItemText(item: T): string {
        return this.config.itemText(item);
    }

    onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void {
        this.config.onSelect(item);
        this.close();
    }

    renderSuggestion(item: T, el: HTMLElement): void {
        if (this.config.renderSuggestion) {
            this.config.renderSuggestion(item, el);
        } else {
            // Default rendering
            el.createDiv({ text: this.getItemText(item) });
        }
    }

    onNoSuggestion(): void {
        if (this.isLoading) {
            this.resultContainerEl.createDiv({ 
                text: "Loading...", 
                cls: "suggestion-item mod-complex" 
            });
        } else {
            this.resultContainerEl.createDiv({ 
                text: this.config.emptyStateText || "No items found", 
                cls: "suggestion-item mod-complex" 
            });
        }
    }

    onClose(): void {
        super.onClose();
        if (this.config.onClose) {
            this.config.onClose();
        }
    }
}

/**
 * Hook to create a FuzzySuggest function that opens a modal when called.
 * @public
 * @group Hooks
 */
export function useFuzzySuggest<T>(config: FuzzySuggestConfig<T>): () => void {
    const app = useContext(APP_CONTEXT);
    const datacore = useContext(DATACORE_CONTEXT);
    
    return useCallback(() => {
        if (!app) {
            console.error("useFuzzySuggest: App context not available");
            return;
        }
        
        const modal = new DatacoreFuzzySuggestModal(app, config, datacore);
        modal.open();
    }, [app, datacore, config]);
}

/**
 * Hook specifically for query-based fuzzy suggestions with live updates.
 * @public
 * @group Hooks
 */
export function useQueryFuzzySuggest<T>(config: Omit<FuzzySuggestConfig<T>, 'items'> & { 
    query: string;
    transform?: (items: Indexable[]) => T[];
}): () => void {
    const app = useContext(APP_CONTEXT);
    const datacore = useContext(DATACORE_CONTEXT);
    
    // Use the existing useFullQuery hook for reactive updates
    const queryResult = useFullQuery(datacore!, config.query);
    
    const openModal = useCallback(() => {
        if (!app || !datacore) {
            console.error("useQueryFuzzySuggest: Required contexts not available");
            return;
        }

        // Transform query results if needed
        const items = config.transform && queryResult.successful 
            ? config.transform(queryResult.value.data)
            : queryResult.successful 
                ? queryResult.value.data as T[]
                : [];

        const modalConfig: FuzzySuggestConfig<T> = {
            ...config,
            items: items
        };
        
        const modal = new DatacoreFuzzySuggestModal(app, modalConfig, datacore);
        modal.open();
    }, [app, datacore, config, queryResult]);
    
    return openModal;
}

/**
 * Props for the declarative FuzzySuggestModal component.
 * @public
 */
export interface FuzzySuggestModalProps<T> extends FuzzySuggestConfig<T> {
    /** Whether the modal is open. */
    isOpen: boolean;
    /** App instance (usually from dc.api.app). */
    app: App;
    /** Datacore instance (usually from dc.api.core). */
    datacore?: Datacore;
}

/**
 * Declarative FuzzySuggestModal component.
 * @public
 */
export function FuzzySuggestModal<T>(props: FuzzySuggestModalProps<T>) {
    const modalRef = useRef<DatacoreFuzzySuggestModal<T> | null>(null);
    
    useEffect(() => {
        if (props.isOpen && !modalRef.current) {
            // Open modal
            const config: FuzzySuggestConfig<T> = {
                items: props.items,
                query: props.query,
                transform: props.transform,
                itemText: props.itemText,
                renderSuggestion: props.renderSuggestion,
                onSelect: (item) => {
                    props.onSelect(item);
                    modalRef.current = null;
                },
                onClose: () => {
                    if (props.onClose) props.onClose();
                    modalRef.current = null;
                },
                placeholder: props.placeholder,
                emptyStateText: props.emptyStateText,
                limit: props.limit,
                modalClass: props.modalClass,
                containerClass: props.containerClass
            };
            
            modalRef.current = new DatacoreFuzzySuggestModal(props.app, config, props.datacore);
            modalRef.current.open();
        } else if (!props.isOpen && modalRef.current) {
            // Close modal
            modalRef.current.close();
            modalRef.current = null;
        }
        
        // Cleanup on unmount
        return () => {
            if (modalRef.current) {
                modalRef.current.close();
                modalRef.current = null;
            }
        };
    }, [props.isOpen, props]);
    
    // This component doesn't render anything visible
    return null;
}