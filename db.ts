import { WorkDay, AppSettings, PeriodState } from './types';
import { auth, dbFirestore } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Firestore rejects undefined values — strip them recursively
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }
  return obj;
}

export const db = {
  // Not needed for Firestore per se, but kept for interface compatibility
  open: async (): Promise<boolean> => {
    return true; 
  },

  getAllEntries: async (): Promise<Record<string, WorkDay>> => {
    try {
      const uid = getUserId();
      const entriesRef = collection(dbFirestore, 'users', uid, 'entries');
      const snapshot = await getDocs(entriesRef);
      
      const entriesMap: Record<string, WorkDay> = {};
      snapshot.docs.forEach(doc => {
        entriesMap[doc.id] = doc.data() as WorkDay;
      });
      return entriesMap;
    } catch (e) {
      console.error("Error fetching entries:", e);
      return {};
    }
  },

  saveEntry: async (entry: WorkDay): Promise<void> => {
    const uid = getUserId();
    const entryRef = doc(dbFirestore, 'users', uid, 'entries', entry.date);
    // Merge true allows updating fields without overwriting the whole doc if schema changes later
    await setDoc(entryRef, stripUndefined(entry), { merge: true });
  },

  getSettings: async (): Promise<AppSettings | null> => {
    try {
      const uid = getUserId();
      const settingsRef = doc(dbFirestore, 'users', uid, 'settings', 'global');
      const snapshot = await getDoc(settingsRef);
      
      if (snapshot.exists()) {
        return snapshot.data() as AppSettings;
      }
      return null;
    } catch (e) {
      console.error("Error fetching settings:", e);
      return null;
    }
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    const uid = getUserId();
    const settingsRef = doc(dbFirestore, 'users', uid, 'settings', 'global');
    await setDoc(settingsRef, settings, { merge: true });
  },

  getPeriodState: async (id: string): Promise<PeriodState | null> => {
    try {
      const uid = getUserId();
      const stateRef = doc(dbFirestore, 'users', uid, 'period_states', id);
      const snapshot = await getDoc(stateRef);
      
      if (snapshot.exists()) {
        return snapshot.data() as PeriodState;
      }
      return null;
    } catch (e) {
      console.error("Error fetching period state:", e);
      return null;
    }
  },

  savePeriodState: async (state: PeriodState): Promise<void> => {
    const uid = getUserId();
    const stateRef = doc(dbFirestore, 'users', uid, 'period_states', state.id);
    await setDoc(stateRef, state, { merge: true });
  },
  
  getAllPeriodStates: async (): Promise<PeriodState[]> => {
    try {
      const uid = getUserId();
      const statesRef = collection(dbFirestore, 'users', uid, 'period_states');
      const snapshot = await getDocs(statesRef);
      return snapshot.docs.map(doc => doc.data() as PeriodState);
    } catch (e) {
      console.error("Error fetching period states:", e);
      return [];
    }
  },

  // Bulk import for Restore functionality (Modified for Firestore Batch)
  importData: async (data: { entries: Record<string, WorkDay>, settings: AppSettings, periodStates?: PeriodState[] }): Promise<void> => {
    const uid = getUserId();
    const batch = writeBatch(dbFirestore);
    
    // 1. Settings
    const settingsRef = doc(dbFirestore, 'users', uid, 'settings', 'global');
    batch.set(settingsRef, data.settings);

    // 2. Entries (Firestore limits batches to 500 ops, assuming <500 for import or split logic needed for huge restores)
    // For simplicity in this demo, we iterate. If >500, we'd need multiple batches.
    let opCount = 1; 
    
    Object.values(data.entries).forEach(entry => {
      const entryRef = doc(dbFirestore, 'users', uid, 'entries', entry.date);
      batch.set(entryRef, entry);
      opCount++;
    });

    // 3. Period States
    if (data.periodStates) {
        data.periodStates.forEach(ps => {
            const psRef = doc(dbFirestore, 'users', uid, 'period_states', ps.id);
            batch.set(psRef, ps);
            opCount++;
        });
    }

    // Commit
    await batch.commit();
  }
};
