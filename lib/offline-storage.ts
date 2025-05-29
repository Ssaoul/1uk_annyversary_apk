// IndexedDB를 사용한 오프라인 데이터 저장소 - 충돌 관리 기능 추가
class OfflineStorage {
  private dbName = "AnniversaryAppDB"
  private version = 3 // 버전 업그레이드
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 기존 저장소들...
        if (!db.objectStoreNames.contains("anniversaries")) {
          const anniversaryStore = db.createObjectStore("anniversaries", { keyPath: "id" })
          anniversaryStore.createIndex("date", "date", { unique: false })
          anniversaryStore.createIndex("category", "category", { unique: false })
          anniversaryStore.createIndex("synced", "synced", { unique: false })
          anniversaryStore.createIndex("lastModified", "lastModified", { unique: false })
        }

        if (!db.objectStoreNames.contains("pending_sync")) {
          const syncStore = db.createObjectStore("pending_sync", { keyPath: "id", autoIncrement: true })
          syncStore.createIndex("timestamp", "timestamp", { unique: false })
          syncStore.createIndex("action", "action", { unique: false })
          syncStore.createIndex("retryCount", "retryCount", { unique: false })
          syncStore.createIndex("priority", "priority", { unique: false })
        }

        if (!db.objectStoreNames.contains("pending_images")) {
          const imageStore = db.createObjectStore("pending_images", { keyPath: "id", autoIncrement: true })
          imageStore.createIndex("anniversaryId", "anniversaryId", { unique: false })
          imageStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("pending_settings")) {
          const settingsStore = db.createObjectStore("pending_settings", { keyPath: "id", autoIncrement: true })
          settingsStore.createIndex("timestamp", "timestamp", { unique: false })
          settingsStore.createIndex("type", "type", { unique: false })
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }

        if (!db.objectStoreNames.contains("api_cache")) {
          const cacheStore = db.createObjectStore("api_cache", { keyPath: "url" })
          cacheStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("sync_logs")) {
          const logStore = db.createObjectStore("sync_logs", { keyPath: "id", autoIncrement: true })
          logStore.createIndex("timestamp", "timestamp", { unique: false })
          logStore.createIndex("status", "status", { unique: false })
        }

        // 충돌 관리 저장소 추가
        if (!db.objectStoreNames.contains("data_conflicts")) {
          const conflictStore = db.createObjectStore("data_conflicts", { keyPath: "id" })
          conflictStore.createIndex("entityType", "entityType", { unique: false })
          conflictStore.createIndex("entityId", "entityId", { unique: false })
          conflictStore.createIndex("status", "status", { unique: false })
          conflictStore.createIndex("created_at", "created_at", { unique: false })
          conflictStore.createIndex("resolvedAt", "resolvedAt", { unique: false })
        }

        // 충돌 해결 기록 저장소
        if (!db.objectStoreNames.contains("conflict_resolutions")) {
          const resolutionStore = db.createObjectStore("conflict_resolutions", { keyPath: "id", autoIncrement: true })
          resolutionStore.createIndex("conflictId", "conflictId", { unique: false })
          resolutionStore.createIndex("timestamp", "timestamp", { unique: false })
          resolutionStore.createIndex("strategy", "strategy", { unique: false })
        }
      }
    })
  }

  // 충돌 저장
  async saveConflict(conflict: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["data_conflicts"], "readwrite")
      const store = transaction.objectStore("data_conflicts")

      const request = store.put(conflict)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 충돌 업데이트
  async updateConflict(conflict: any): Promise<void> {
    return this.saveConflict(conflict)
  }

  // 충돌 조회
  async getConflict(conflictId: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["data_conflicts"], "readonly")
      const store = transaction.objectStore("data_conflicts")
      const request = store.get(conflictId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 모든 충돌 조회
  async getAllConflicts(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["data_conflicts"], "readonly")
      const store = transaction.objectStore("data_conflicts")
      const index = store.index("created_at")
      const request = index.getAll()

      request.onsuccess = () => {
        const results = request.result || []
        // 최신순으로 정렬
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 엔티티별 충돌 조회
  async getConflictsByEntity(entityType: string, entityId: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["data_conflicts"], "readonly")
      const store = transaction.objectStore("data_conflicts")
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result || []
        const filtered = results.filter(
          (conflict) => conflict.entityType === entityType && conflict.entityId === entityId,
        )
        resolve(filtered)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 충돌 해결 기록 저장
  async saveConflictResolution(resolution: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conflict_resolutions"], "readwrite")
      const store = transaction.objectStore("conflict_resolutions")

      const request = store.add({
        ...resolution,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 오래된 충돌 정리
  async cleanOldConflicts(cutoffDate: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["data_conflicts"], "readwrite")
      const store = transaction.objectStore("data_conflicts")
      const index = store.index("created_at")

      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          // 해결된 충돌만 삭제
          if (cursor.value.status === "resolved" || cursor.value.status === "auto-resolved") {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 기존 메서드들...
  async addPendingSync(data: any, priority = 1): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readwrite")
      const store = transaction.objectStore("pending_sync")

      const request = store.add({
        ...data,
        timestamp: Date.now(),
        priority,
        retryCount: 0,
        lastRetry: null,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSyncByPriority(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readonly")
      const store = transaction.objectStore("pending_sync")
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result || []
        results.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority
          }
          return a.timestamp - b.timestamp
        })
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingSync(id: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readwrite")
      const store = transaction.objectStore("pending_sync")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async saveAnniversary(anniversary: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["anniversaries"], "readwrite")
      const store = transaction.objectStore("anniversaries")

      const request = store.put({
        ...anniversary,
        lastModified: Date.now(),
        synced: navigator.onLine,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAnniversaries(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["anniversaries"], "readonly")
      const store = transaction.objectStore("anniversaries")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteAnniversary(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["anniversaries"], "readwrite")
      const store = transaction.objectStore("anniversaries")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSync(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readonly")
      const store = transaction.objectStore("pending_sync")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async clearPendingSync(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readwrite")
      const store = transaction.objectStore("pending_sync")
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value)
      request.onerror = () => reject(request.error)
    })
  }

  // 기타 기존 메서드들은 동일...
  async addSyncLog(action: string, status: "success" | "failed" | "pending", details?: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_logs"], "readwrite")
      const store = transaction.objectStore("sync_logs")

      const request = store.add({
        action,
        status,
        details,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncLogs(limit = 50): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_logs"], "readonly")
      const store = transaction.objectStore("sync_logs")
      const index = store.index("timestamp")

      const request = index.openCursor(null, "prev")
      const results: any[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor && count < limit) {
          results.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getFailedSyncItems(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["pending_sync"], "readonly")
      const store = transaction.objectStore("pending_sync")
      const index = store.index("retryCount")

      const request = index.openCursor(IDBKeyRange.lowerBound(1))
      const results: any[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedItems(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["anniversaries"], "readonly")
      const store = transaction.objectStore("anniversaries")
      const index = store.index("synced")

      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncStats(): Promise<{
    pending: number
    failed: number
    unsynced: number
    lastSync: number | null
  }> {
    if (!this.db) await this.init()

    const [pending, failed, unsynced, lastSync] = await Promise.all([
      this.getPendingSync(),
      this.getFailedSyncItems(),
      this.getUnsyncedItems(),
      this.getSetting("lastSyncTime"),
    ])

    return {
      pending: pending.length,
      failed: failed.length,
      unsynced: unsynced.length,
      lastSync,
    }
  }

  async cleanOldLogs(daysToKeep = 30): Promise<void> {
    if (!this.db) await this.init()

    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["sync_logs"], "readwrite")
      const store = transaction.objectStore("sync_logs")
      const index = store.index("timestamp")

      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async cacheApiResponse(url: string, data: any, ttl = 3600000): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["api_cache"], "readwrite")
      const store = transaction.objectStore("api_cache")

      const request = store.put({
        url,
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedApiResponse(url: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["api_cache"], "readonly")
      const store = transaction.objectStore("api_cache")
      const request = store.get(url)

      request.onsuccess = () => {
        const result = request.result
        if (result && result.expires > Date.now()) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async cleanExpiredCache(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["api_cache"], "readwrite")
      const store = transaction.objectStore("api_cache")
      const index = store.index("timestamp")
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.expires < Date.now()) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStorage = new OfflineStorage()
