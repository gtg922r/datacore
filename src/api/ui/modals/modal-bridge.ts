/** @module api/ui/modals */
import { Modal, App } from "obsidian";

/**
 * Registry for tracking modal instances and their lifecycle.
 * This helps with cleanup and prevents memory leaks in React components.
 * @internal
 */
class ModalRegistry {
    private modals = new Map<string, Modal>();
    private nextId = 0;

    /**
     * Register a modal with the registry.
     */
    register(modal: Modal): string {
        const id = `modal-${this.nextId++}`;
        this.modals.set(id, modal);
        
        // Clean up when modal closes
        const originalClose = modal.close.bind(modal);
        modal.close = () => {
            this.unregister(id);
            originalClose();
        };
        
        return id;
    }

    /**
     * Unregister a modal from the registry.
     */
    unregister(id: string): void {
        this.modals.delete(id);
    }

    /**
     * Close and unregister a modal by ID.
     */
    close(id: string): void {
        const modal = this.modals.get(id);
        if (modal) {
            modal.close();
        }
    }

    /**
     * Close all registered modals.
     */
    closeAll(): void {
        for (const modal of this.modals.values()) {
            modal.close();
        }
        this.modals.clear();
    }

    /**
     * Get the number of registered modals.
     */
    get size(): number {
        return this.modals.size;
    }
}

/**
 * Global modal registry instance.
 * @internal
 */
export const modalRegistry = new ModalRegistry();

/**
 * Utility to create a cleanup function for modal management in React components.
 * @internal
 */
export function createModalCleanup(modalId?: string): () => void {
    return () => {
        if (modalId) {
            modalRegistry.close(modalId);
        }
    };
}

/**
 * Wrapper for modal creation that automatically handles registration.
 * @internal
 */
export function createManagedModal<T extends Modal>(
    modalFactory: () => T
): [T, string, () => void] {
    const modal = modalFactory();
    const id = modalRegistry.register(modal);
    const cleanup = createModalCleanup(id);
    
    return [modal, id, cleanup];
}