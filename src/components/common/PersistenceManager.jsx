/**
 * @class PersistenceManager
 * @description Manages data persistence in the browser's localStorage with a unique prefix,
 * error handling, and a fallback to in-memory storage.
 */
class PersistenceManager {
    /**
     * @param {string} prefix - A unique prefix for all localStorage keys to avoid conflicts.
     */
    constructor(prefix = 'app_') {
        this.prefix = prefix;
        this.storage = this._getStorage();
    }

    /**
     * @private
     * @description Checks for localStorage availability and returns a compatible storage interface.
     * @returns {Storage | Map} The localStorage object or an in-memory Map as a fallback.
     */
    _getStorage() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return localStorage;
        } catch (e) {
            console.warn('localStorage is not available. Falling back to in-memory storage. Data will not persist across sessions.');
            return new Map();
        }
    }

    /**
     * @private
     * @param {string} key - The key to be prefixed.
     * @returns {string} The key with the application prefix.
     */
    _getPrefixedKey(key) {
        if (typeof key !== 'string' || !key) {
            throw new Error('Key must be a non-empty string.');
        }
        return `${this.prefix}${key}`;
    }

    /**
     * Saves a value to storage under a specified key.
     * @param {string} key - The key under which to save the value.
     * @param {any} value - The value to save (can be a string, number, boolean, or JSON-serializable object).
     * @returns {Promise<void>}
     */
    async save(key, value) {
        return Promise.resolve().then(() => {
            const prefixedKey = this._getPrefixedKey(key);
            try {
                const serializedValue = JSON.stringify(value);
                this.storage.setItem(prefixedKey, serializedValue);
            } catch (error) {
                console.error(`Error saving data for key "${key}":`, error);
                throw new Error('Failed to save data. Storage might be full.');
            }
        });
    }

    /**
     * Retrieves a value from storage for a specified key.
     * @param {string} key - The key of the value to retrieve.
     * @param {any} [defaultValue=null] - The default value to return if the key doesn't exist.
     * @returns {Promise<any>} The retrieved value or the default value.
     */
    async get(key, defaultValue = null) {
        return Promise.resolve().then(() => {
            const prefixedKey = this._getPrefixedKey(key);
            try {
                const serializedValue = this.storage.getItem(prefixedKey);
                if (serializedValue === null || serializedValue === undefined) {
                    return defaultValue;
                }
                return JSON.parse(serializedValue);
            } catch (error) {
                console.error(`Error retrieving or parsing data for key "${key}":`, error);
                return defaultValue;
            }
        });
    }

    /**
     * Updates an existing value or saves a new one. Alias for save().
     * @param {string} key - The key of the value to update.
     * @param {any} value - The new value.
     * @returns {Promise<void>}
     */
    async update(key, value) {
        return this.save(key, value);
    }

    /**
     * Removes a key-value pair from storage.
     * @param {string} key - The key to remove.
     * @returns {Promise<void>}
     */
    async remove(key) {
        return Promise.resolve().then(() => {
            const prefixedKey = this._getPrefixedKey(key);
            this.storage.removeItem(prefixedKey);
        });
    }

    /**
     * Checks if a key exists in storage.
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} True if the key exists, false otherwise.
     */
    async has(key) {
        return Promise.resolve().then(() => {
            const prefixedKey = this._getPrefixedKey(key);
            return this.storage.getItem(prefixedKey) !== null;
        });
    }

    /**
     * Clears all keys from storage that match the application prefix.
     * @returns {Promise<void>}
     */
    async clear() {
        return Promise.resolve().then(() => {
            if (this.storage instanceof Map) {
                this.storage.clear();
                return;
            }
            
            Object.keys(this.storage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => this.storage.removeItem(key));
        });
    }
}

// Export a singleton instance for easy use across the app
export const persistenceManager = new PersistenceManager('teacher_reg_');