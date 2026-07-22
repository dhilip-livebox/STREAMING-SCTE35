const DB_NAME = 'StreamPulse_IndexedDB_Store';
const DB_VERSION = 1;
const STORE_NAME = 'media_store';

export const indexedDBService = {
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  async set(key, value) {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error("IndexedDB set error:", err);
    }
  },

  async get(key) {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error("IndexedDB get error:", err);
      return null;
    }
  }
};
