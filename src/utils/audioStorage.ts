/**
 * Offline IndexedDB storage for user-selected custom audio files
 * (custom night ambient music & custom timer alarm sounds).
 */

const DB_NAME = 'ravi_naghsh_audio_db';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

export type CustomAudioSlot = 'night_music' | 'timer_alarm';

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open audio DB'));
  });
}

export async function saveCustomAudioFile(slot: CustomAudioSlot, file: File): Promise<void> {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, slot);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Failed to store audio'));
    };
  });
}

export async function getCustomAudioUrl(slot: CustomAudioSlot): Promise<string | null> {
  try {
    const db = await openAudioDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slot);
      req.onsuccess = () => {
        db.close();
        const blob = req.result as Blob | undefined;
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(URL.createObjectURL(blob));
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteCustomAudioFile(slot: CustomAudioSlot): Promise<void> {
  try {
    const db = await openAudioDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(slot);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
}
