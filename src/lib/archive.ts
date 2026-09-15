import type { InvoiceMeta } from "@/lib/invoice";

export type ArchivedInvoice = {
  id: string;
  fileName: string;
  savedAt: number;
  xmlText: string;
  meta: InvoiceMeta;
};

const DB_NAME = "efatura-viewer";
const DB_VERSION = 1;
const STORE_NAME = "invoices";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("savedAt", "savedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Tarayıcı arşivi açılamadı."));
  });
}

export async function listArchivedInvoices(): Promise<ArchivedInvoice[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const items = (request.result as ArchivedInvoice[]).sort((a, b) => b.savedAt - a.savedAt);
        resolve(items);
      };
      request.onerror = () => reject(request.error ?? new Error("Arşiv okunamadı."));
    });
  } finally {
    db.close();
  }
}

export async function saveArchivedInvoice(input: {
  xmlText: string;
  fileName: string;
  meta: InvoiceMeta;
}): Promise<ArchivedInvoice> {
  const id = input.meta.id?.trim() || crypto.randomUUID();
  const record: ArchivedInvoice = {
    id,
    fileName: input.fileName,
    savedAt: Date.now(),
    xmlText: input.xmlText,
    meta: input.meta,
  };

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Fatura arşive kaydedilemedi."));
      tx.onabort = () => reject(tx.error ?? new Error("Fatura arşive kaydedilemedi."));
    });
  } finally {
    db.close();
  }

  return record;
}

export async function deleteArchivedInvoice(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Fatura arşivden silinemedi."));
      tx.onabort = () => reject(tx.error ?? new Error("Fatura arşivden silinemedi."));
    });
  } finally {
    db.close();
  }
}
