import { CloudSaveData, LibrarianAvatar, GameStats } from '../types/game';
import { INITIAL_TBR_BOOKS, INITIAL_LOANED_OUT_RECORDS, INITIAL_BORROWED_IN_RECORDS, generateRandomBook } from './bookGenerator';
import { generateDailyQuests, getTodayDateString } from './questGenerator';

const CLOUD_SAVE_KEY_PREFIX = 'bibliotheca_cloud_slot_';
const ACTIVE_SLOT_KEY = 'bibliotheca_active_slot_id';

export const DEFAULT_AVATAR: LibrarianAvatar = {
  name: 'Librarian Elspeth',
  hairstyle: 'classic_bun',
  hairColor: '#854d0e', // Chestnut auburn
  skinTone: '#fcd34d', // Warm golden
  eyewear: 'round_wire',
  outfitStyle: 'cardigan',
  outfitColor: '#166534', // Forest green
  outfitTrimColor: '#fef08a', // Cream
  accessory: 'cuppa_tea',
};

export const DEFAULT_STATS: GameStats = {
  totalBooksShelved: 0,
  highestCombo: 1,
  vintageBooksRestored: 0,
  teasBrewed: 0,
  patronsHelped: 0,
  libraryLevel: 1,
  deweyPoints: 120, // Initial pocket change to explore
  gildedRibbons: 2,
  experiencePoints: 0,
  nextLevelExp: 200,
};

export function createInitialCloudData(slotId: number = 1, slotName: string = 'Main Archive'): CloudSaveData {
  const today = getTodayDateString();
  return {
    slotId,
    slotName,
    timestamp: Date.now(),
    stats: { ...DEFAULT_STATS },
    avatar: { ...DEFAULT_AVATAR },
    unlockedUpgradeIds: [],
    unlockedVintageBookIds: ['vintage_2', 'vintage_6'],
    inventoryBooks: [
      generateRandomBook('fiction'),
      generateRandomBook('botany'),
      generateRandomBook('philosophy' as any),
      generateRandomBook('astronomy'),
    ],
    tbrBooks: [...INITIAL_TBR_BOOKS],
    loanedOutRecords: [...INITIAL_LOANED_OUT_RECORDS],
    borrowedInRecords: [...INITIAL_BORROWED_IN_RECORDS],
    activeBuff: null,
    timeOfDayHour: 15.5, // 3:30 PM golden afternoon
    version: 1,
    dailyQuests: generateDailyQuests(today),
    lastQuestDate: today,
    allQuestsClaimedBonus: false,
  };
}

export interface CloudSlotSummary {
  slotId: number;
  slotName: string;
  timestamp: number;
  level: number;
  deweyPoints: number;
  booksShelved: number;
  avatarName: string;
  isEmpty: boolean;
}

class CloudSaveService {
  private activeSlotId: number = 1;
  private isSaving: boolean = false;
  private lastSavedTime: number = Date.now();
  private syncStatus: 'synced' | 'saving' | 'offline' = 'synced';
  private listeners: Set<(status: 'synced' | 'saving' | 'offline') => void> = new Set();

  constructor() {
    try {
      const storedSlot = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (storedSlot) {
        this.activeSlotId = parseInt(storedSlot, 10) || 1;
      }
    } catch {
      // LocalStorage fallback
    }
  }

  public getActiveSlotId(): number {
    return this.activeSlotId;
  }

  public setActiveSlotId(slotId: number): void {
    this.activeSlotId = slotId;
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, slotId.toString());
    } catch {
      // ignore
    }
  }

  public onSyncStatusChange(cb: (status: 'synced' | 'saving' | 'offline') => void): () => void {
    this.listeners.add(cb);
    cb(this.syncStatus);
    return () => this.listeners.delete(cb);
  }

  private notifyStatus(status: 'synced' | 'saving' | 'offline') {
    this.syncStatus = status;
    this.listeners.forEach((cb) => cb(status));
  }

  public getSlotSummaries(): CloudSlotSummary[] {
    const slots: CloudSlotSummary[] = [];
    for (let i = 1; i <= 3; i++) {
      const data = this.loadSlot(i);
      if (data) {
        slots.push({
          slotId: i,
          slotName: data.slotName,
          timestamp: data.timestamp,
          level: data.stats.libraryLevel,
          deweyPoints: data.stats.deweyPoints,
          booksShelved: data.stats.totalBooksShelved,
          avatarName: data.avatar.name,
          isEmpty: false,
        });
      } else {
        slots.push({
          slotId: i,
          slotName: i === 1 ? 'Main Archive' : i === 2 ? 'Zen Stacks' : 'Rare Collector',
          timestamp: 0,
          level: 1,
          deweyPoints: 0,
          booksShelved: 0,
          avatarName: 'New Librarian',
          isEmpty: true,
        });
      }
    }
    return slots;
  }

  public loadSlot(slotId: number): CloudSaveData | null {
    try {
      const key = `${CLOUD_SAVE_KEY_PREFIX}${slotId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as CloudSaveData;
    } catch {
      return null;
    }
  }

  public async saveToCloud(data: CloudSaveData): Promise<boolean> {
    this.isSaving = true;
    this.notifyStatus('saving');

    const updatedData: CloudSaveData = {
      ...data,
      timestamp: Date.now(),
    };

    try {
      const key = `${CLOUD_SAVE_KEY_PREFIX}${updatedData.slotId}`;
      localStorage.setItem(key, JSON.stringify(updatedData));
      this.lastSavedTime = updatedData.timestamp;

      // Also attempt real API sync if server is present
      try {
        await fetch('/api/cloud-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        }).catch(() => {
          // offline safe
        });
      } catch {
        // Safe offline
      }

      // Small debounce simulation for UI feedback
      await new Promise((r) => setTimeout(r, 400));
      this.isSaving = false;
      this.notifyStatus('synced');
      return true;
    } catch (e) {
      console.warn('Local save warning:', e);
      this.isSaving = false;
      this.notifyStatus('offline');
      return false;
    }
  }

  public deleteSlot(slotId: number): void {
    try {
      localStorage.removeItem(`${CLOUD_SAVE_KEY_PREFIX}${slotId}`);
    } catch {
      // ignore
    }
  }

  public exportSaveAsJSON(data: CloudSaveData): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliotheca_save_slot${data.slotId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public importSaveFromJSON(jsonText: string): CloudSaveData | null {
    try {
      const parsed = JSON.parse(jsonText) as CloudSaveData;
      if (parsed && parsed.stats && parsed.avatar) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const cloudSaveService = new CloudSaveService();
