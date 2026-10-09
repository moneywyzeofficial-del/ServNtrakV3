const DB_NAME = "servntrak-offline";
const STORE_NAME = "mutations";
const DB_VERSION = 1;

interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body?: unknown;
  createdAt: number;
  retries: number;
}

type Listener = (count: number) => void;
const listeners = new Set<Listener>();
let pendingCount = 0;

async function updatePendingCount() {
  pendingCount = await getQueueLength();
  listeners.forEach((fn) => fn(pendingCount));
}

export function subscribeOfflineQueue(fn: Listener) {
  listeners.add(fn);
  fn(pendingCount);
  return () => listeners.delete(fn);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getQueueLength(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const countReq = tx.objectStore(STORE_NAME).count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });
  } catch {
    return 0;
  }
}

export async function addToQueue(request: Omit<QueuedRequest, "id" | "createdAt" | "retries">): Promise<void> {
  try {
    const db = await openDB();
    const item: QueuedRequest = { ...request, createdAt: Date.now(), retries: 0 };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Offline queue: failed to save mutation", err);
  }
}

export async function triggerSync(): Promise<{ synced: number; failed: number }> {
  const db = await openDB();

  const all: QueuedRequest[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let synced = 0;
  let failed = 0;

  for (const item of all) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body ? JSON.stringify(item.body) : undefined,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(item.id!);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      synced++;
    } catch {
      item.retries++;
      if (item.retries >= 3) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(item.id!);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
      failed++;
      break;
    }
  }

  await updatePendingCount();
  return { synced, failed };
}

// Auto-sync when back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    triggerSync();
  });
  updatePendingCount();

  // Monkey-patch global fetch to queue failed mutations when offline
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      return await originalFetch(input, init);
    } catch (err) {
      const method = (init?.method ?? (typeof input === "object" && "method" in input ? (input as any).method : undefined) ?? "GET").toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : "url" in input ? (input as any).url : "";
      if (method !== "GET" && url.startsWith("/api/") && !url.includes("/api/auth/")) {
        let body: unknown = undefined;
        if (init?.body && typeof init.body === "string") {
          try { body = JSON.parse(init.body); } catch {}
        }
        await addToQueue({ url, method, body });
        await updatePendingCount();
        throw new Error("Sem ligação à internet. A alteração será sincronizada automaticamente quando houver rede.");
      }
      throw err;
    }
  };
}
