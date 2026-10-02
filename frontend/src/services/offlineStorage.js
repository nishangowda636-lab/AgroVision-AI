// AgroVision AI Offline-First Storage & Automated Sync Queue Service

const STORAGE_KEYS = {
  FARMS: 'agrovision_cached_farms',
  ACTIVE_FARM: 'agrovision_cached_active_farm',
  CROP_STAGE: 'agrovision_cached_crop_stage',
  WEATHER: 'agrovision_cached_weather',
  FARM_PLAN: 'agrovision_cached_farm_plan',
  DISEASE_HISTORY: 'agrovision_cached_disease_history',
  CROP_CALENDAR: 'agrovision_cached_crop_calendar',
  FERTILIZER_HISTORY: 'agrovision_cached_fertilizer_history',
  FERTILIZER_REC: 'agrovision_cached_fertilizer_rec',
  LEDGER_TRANSACTIONS: 'agrovision_cached_ledger_transactions',
  LEDGER_SUMMARY: 'agrovision_cached_ledger_summary',
  AI_CONVERSATIONS: 'agrovision_cached_ai_conversations',
  SYNC_QUEUE: 'agrovision_offline_sync_queue',
  SYNC_STATUS: 'agrovision_offline_sync_status' // 'ONLINE', 'OFFLINE', 'SYNCING', 'SYNCED'
};

function generateUUID() {
  return 'sync_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export const offlineStorage = {
  // Generic cache setter with timestamp
  saveCache(key, data) {
    try {
      const payload = {
        data,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Offline storage write error for', key, e);
    }
  },

  // Generic cache getter
  getCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Offline storage read error for', key, e);
      return null;
    }
  },

  // ==========================================
  // Domain Specific Cache Setters & Getters
  // ==========================================

  // Farms
  saveFarms(farms) {
    this.saveCache(STORAGE_KEYS.FARMS, farms);
  },
  getFarms() {
    const res = this.getCache(STORAGE_KEYS.FARMS);
    return res ? res.data : [];
  },

  // Active Farm
  saveActiveFarm(farm) {
    this.saveCache(STORAGE_KEYS.ACTIVE_FARM, farm);
  },
  getActiveFarm() {
    const res = this.getCache(STORAGE_KEYS.ACTIVE_FARM);
    return res ? res.data : null;
  },

  // Crop Stage
  saveCropStage(farmId, stageData) {
    this.saveCache(`${STORAGE_KEYS.CROP_STAGE}_${farmId}`, stageData);
  },
  getCropStage(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.CROP_STAGE}_${farmId}`);
    return res ? res.data : null;
  },

  // Today's Farm Plan
  saveFarmPlan(farmId, plan) {
    this.saveCache(`${STORAGE_KEYS.FARM_PLAN}_${farmId}`, plan);
  },
  getFarmPlan(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.FARM_PLAN}_${farmId}`);
    return res ? res.data : null;
  },

  // Live Weather Snapshot
  saveWeather(farmId, weather) {
    this.saveCache(`${STORAGE_KEYS.WEATHER}_${farmId}`, weather);
  },
  getWeather(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.WEATHER}_${farmId}`);
    return res ? res.data : null;
  },

  // Crop Calendar & Farm Activities
  saveCropCalendar(farmId, calendar) {
    this.saveCache(`${STORAGE_KEYS.CROP_CALENDAR}_${farmId}`, calendar);
  },
  getCropCalendar(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.CROP_CALENDAR}_${farmId}`);
    return res ? res.data : null;
  },

  // Crop Health / Disease Scans
  saveDiseaseHistory(farmId, history) {
    this.saveCache(`${STORAGE_KEYS.DISEASE_HISTORY}_${farmId}`, history);
  },
  getDiseaseHistory(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.DISEASE_HISTORY}_${farmId}`);
    return res ? res.data : [];
  },

  // Fertilizer History & Recommendations
  saveFertilizerHistory(farmId, apps) {
    this.saveCache(`${STORAGE_KEYS.FERTILIZER_HISTORY}_${farmId}`, apps);
  },
  getFertilizerHistory(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.FERTILIZER_HISTORY}_${farmId}`);
    return res ? res.data : [];
  },

  saveFertilizerRecommendation(farmId, rec) {
    this.saveCache(`${STORAGE_KEYS.FERTILIZER_REC}_${farmId}`, rec);
  },
  getFertilizerRecommendation(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.FERTILIZER_REC}_${farmId}`);
    return res ? res.data : null;
  },

  // Farm Ledger Transactions & Summary
  saveLedgerTransactions(farmId, txs) {
    this.saveCache(`${STORAGE_KEYS.LEDGER_TRANSACTIONS}_${farmId}`, txs);
  },
  getLedgerTransactions(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.LEDGER_TRANSACTIONS}_${farmId}`);
    return res ? res.data : [];
  },

  saveLedgerSummary(farmId, summary) {
    this.saveCache(`${STORAGE_KEYS.LEDGER_SUMMARY}_${farmId}`, summary);
  },
  getLedgerSummary(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.LEDGER_SUMMARY}_${farmId}`);
    return res ? res.data : null;
  },

  // AI Conversations History
  saveAIConversations(farmId, convos) {
    this.saveCache(`${STORAGE_KEYS.AI_CONVERSATIONS}_${farmId}`, convos);
  },
  getAIConversations(farmId) {
    const res = this.getCache(`${STORAGE_KEYS.AI_CONVERSATIONS}_${farmId}`);
    return res ? res.data : [];
  },

  // ==========================================
  // SYNC QUEUE MANAGEMENT (PENDING -> SYNCING -> SYNCED / FAILED)
  // ==========================================

  getSyncQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '[]');
    } catch {
      return [];
    }
  },

  // Enqueue an offline action (e.g. RECORD_EXPENSE, ADD_ACTIVITY, ADD_NOTE)
  enqueueSyncAction(actionType, payload) {
    try {
      const queue = this.getSyncQueue();
      const client_sync_id = payload.client_sync_id || generateUUID();
      const item = {
        id: client_sync_id,
        actionType,
        payload: { ...payload, client_sync_id },
        status: 'PENDING', // PENDING, SYNCING, SYNCED, FAILED
        createdAt: new Date().toISOString(),
        retryCount: 0,
        errorMessage: null
      };

      queue.push(item);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

      // Also optimistically store into local domain cache
      if (actionType === 'RECORD_TRANSACTION') {
        const farmId = payload.farm_id;
        if (farmId) {
          const cached = this.getLedgerTransactions(farmId);
          this.saveLedgerTransactions(farmId, [
            {
              ...payload,
              id: Date.now(),
              created_at: new Date().toISOString()
            },
            ...cached
          ]);
        }
      }

      return item;
    } catch (e) {
      console.warn('Queue sync error:', e);
      return null;
    }
  },

  updateSyncItemStatus(id, status, errorMessage = null) {
    try {
      const queue = this.getSyncQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index !== -1) {
        queue[index].status = status;
        if (errorMessage) queue[index].errorMessage = errorMessage;
        if (status === 'SYNCING') queue[index].retryCount = (queue[index].retryCount || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Update sync item error:', e);
    }
  },

  removeSyncItem(id) {
    try {
      const queue = this.getSyncQueue();
      const updated = queue.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Remove sync item error:', e);
    }
  },

  clearSyncedItems() {
    try {
      const queue = this.getSyncQueue();
      const pending = queue.filter(item => item.status !== 'SYNCED');
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(pending));
    } catch (e) {
      console.warn('Clear synced error:', e);
    }
  },

  // Automated Sync Worker: pushes all PENDING items to backend
  async processSyncQueue(apiClient) {
    const queue = this.getSyncQueue();
    const pendingItems = queue.filter(item => item.status === 'PENDING' || item.status === 'FAILED');

    if (pendingItems.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const item of pendingItems) {
      this.updateSyncItemStatus(item.id, 'SYNCING');
      try {
        if (item.actionType === 'RECORD_TRANSACTION') {
          await apiClient.post('/ledger/transactions', item.payload);
        } else if (item.actionType === 'ADD_ACTIVITY') {
          await apiClient.post(`/calendar/${item.payload.farm_id}/events`, item.payload);
        } else if (item.actionType === 'COMPLETE_TASK') {
          await apiClient.post(`/farms/${item.payload.farm_id}/today-plan/${item.payload.task_id}/complete`, item.payload);
        } else if (item.actionType === 'UPDATE_ACTION_STATUS') {
          await apiClient.post(`/ai-farm-agent/today-plan/${item.payload.farm_id}/action-status`, item.payload);
        }
        this.updateSyncItemStatus(item.id, 'SYNCED');
        processed++;
      } catch (err) {
        console.error('Failed to sync item:', item, err);
        this.updateSyncItemStatus(item.id, 'FAILED', err.message);
        failed++;
      }
    }

    // Clean up successfully synced records after brief delay
    setTimeout(() => this.clearSyncedItems(), 4000);

    return { processed, failed };
  }
};

export default offlineStorage;
