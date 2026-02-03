import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";

const DB_NAME = "wplace-overlay-manager";
const STORE_NAME = "kv";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => reject(request.error);
    });
}

function idbSet<T>(db: IDBDatabase, key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function migrateFromLocalStorage<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return undefined;
        const parsed = JSON.parse(raw) as T;
        await idbSet(db, key, parsed);
        localStorage.removeItem(key);
        return parsed;
    } catch {
        return undefined;
    }
}

export function createIDBStorage<T>(): AsyncStorage<T> {
    const dbPromise = openDB();

    return {
        async getItem(key: string, initialValue: T): Promise<T> {
            const db = await dbPromise;
            const value = await idbGet<T>(db, key);
            if (value !== undefined) return value;

            const migrated = await migrateFromLocalStorage<T>(db, key);
            if (migrated !== undefined) return migrated;

            return initialValue;
        },
        async setItem(key: string, newValue: T): Promise<void> {
            const db = await dbPromise;
            await idbSet(db, key, newValue);
        },
        async removeItem(key: string): Promise<void> {
            const db = await dbPromise;
            await idbDelete(db, key);
        },
    };
}
