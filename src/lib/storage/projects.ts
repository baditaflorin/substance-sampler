import type { TextureSettings } from "@/features/sampler/types";

const DB_NAME = "substance-sampler";
const STORE_NAME = "projects";
const SETTINGS_KEY = "last-settings";

export async function saveSettings(settings: TextureSettings): Promise<void> {
  const db = await openDb();
  await tx(db, "readwrite", (store) => store.put(settings, SETTINGS_KEY));
  db.close();
}

export async function loadSettings(): Promise<TextureSettings | null> {
  const db = await openDb();
  const value = await tx<TextureSettings | null>(db, "readonly", (store) =>
    store.get(SETTINGS_KEY)
  );
  db.close();
  return value;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    request.onsuccess = () => resolve(request.result);
  });
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | IDBRequest<IDBValidKey>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store) as IDBRequest<T>;
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    request.onsuccess = () => resolve(request.result);
  });
}
