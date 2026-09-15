export interface MediaAssetMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  createdAt: number;
}

interface MediaAssetRecord extends MediaAssetMeta {
  blob: Blob;
}

const DB_NAME = "voice-and-vision-media";
const DB_VERSION = 1;
const STORE = "assets";

function assetId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Durable media storage is unavailable in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open media storage."));
    request.onblocked = () => reject(new Error("Media storage upgrade is blocked by another tab."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = work(tx.objectStore(STORE));
      let requestDone = false;
      let transactionDone = false;
      let result: T;
      let settled = false;

      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error instanceof Error ? error : new Error("Media storage transaction failed."));
      };
      const finish = () => {
        if (settled || !requestDone || !transactionDone) return;
        settled = true;
        resolve(result);
      };

      request.onsuccess = () => {
        result = request.result;
        requestDone = true;
        finish();
      };
      request.onerror = () => fail(request.error ?? new Error("Media storage request failed."));
      tx.oncomplete = () => {
        transactionDone = true;
        finish();
      };
      tx.onerror = () => fail(tx.error ?? new Error("Media storage transaction failed."));
      tx.onabort = () => fail(tx.error ?? new Error("Media storage transaction aborted."));
    });
  } finally {
    db.close();
  }
}

export async function persistMediaFile(file: File): Promise<MediaAssetMeta> {
  const record: MediaAssetRecord = {
    id: assetId(),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified,
    createdAt: Date.now(),
    blob: file,
  };
  await withStore("readwrite", (store) => store.put(record));
  const { blob: _blob, ...meta } = record;
  return meta;
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  const record = await withStore<MediaAssetRecord | undefined>("readonly", (store) => store.get(id));
  return record?.blob ?? null;
}

export async function materializeMediaUrl(id: string): Promise<string | null> {
  const blob = await getMediaBlob(id);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function deleteMediaAssets(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const id of new Set(ids)) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not delete media assets."));
      tx.onabort = () => reject(tx.error ?? new Error("Media storage transaction aborted."));
    });
  } finally {
    db.close();
  }
}

export async function pruneMediaAssets(keepIds: string[]): Promise<void> {
  const keep = new Set(keepIds);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        for (const key of request.result) {
          const id = String(key);
          if (!keep.has(id)) store.delete(key);
        }
      };
      request.onerror = () => reject(request.error ?? new Error("Could not enumerate media assets."));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not prune media assets."));
      tx.onabort = () => reject(tx.error ?? new Error("Media storage transaction aborted."));
    });
  } finally {
    db.close();
  }
}
