import { offlineStorage } from "./offline-storage"
import { conflictResolver } from "./conflict-resolver"
import type { Anniversary } from "@/types/anniversary"

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager
  private syncInProgress = false
  private syncQueue: Array<() => Promise<void>> = []
  private maxRetries = 3
  private retryDelay = 1000 // 1초

  constructor() {
    this.setupEventListeners()
  }

  static getInstance(): BackgroundSyncManager {
    if (typeof window === "undefined") {
      // 서버사이드에서는 더미 인스턴스 반환
      return {
        triggerSync: async () => {},
        getSyncStatus: async () => ({
          inProgress: false,
          stats: {},
          logs: [],
          conflicts: 0,
        }),
        retryFailedItems: async () => {},
        manualSync: async () => {},
      } as any
    }

    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager()
    }
    return BackgroundSyncManager.instance
  }

  private setupEventListeners() {
    if (typeof window === "undefined") return

    // 서비스 워커 메시지 리스너
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        this.handleServiceWorkerMessage(event.data)
      })
    }

    // 온라인 상태 변경 리스너
    window.addEventListener("online", () => {
      this.triggerSync()
    })

    // 페이지 가시성 변경 리스너
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && navigator.onLine) {
        this.triggerSync()
      }
    })
  }

  // 서비스 워커 메시지 처리
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case "sync-progress":
        this.notifyProgress(data)
        break
      case "sync-complete":
        this.notifySyncComplete(data)
        break
      case "sync-error":
        this.notifySyncError(data)
        break
    }
  }

  // 동기화 트리거
  async triggerSync(force = false): Promise<void> {
    if (this.syncInProgress && !force) {
      return
    }

    if (!navigator.onLine) {
      console.log("Offline: Cannot trigger sync")
      return
    }

    try {
      // 백그라운드 동기화 등록
      if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("anniversary-sync")
        console.log("Background sync registered")
      } else {
        // 백그라운드 동기화 미지원 시 직접 동기화
        await this.performDirectSync()
      }
    } catch (error) {
      console.error("Failed to trigger sync:", error)
      await this.performDirectSync() // 폴백
    }
  }

  // 직접 동기화 수행 (충돌 감지 포함)
  private async performDirectSync(): Promise<void> {
    if (this.syncInProgress) {
      return
    }

    this.syncInProgress = true

    try {
      await offlineStorage.addSyncLog("direct-sync", "pending", { trigger: "manual" })

      const pendingItems = await offlineStorage.getPendingSyncByPriority()

      if (pendingItems.length === 0) {
        console.log("No items to sync")
        return
      }

      console.log(`Starting direct sync of ${pendingItems.length} items`)

      let successCount = 0
      let failCount = 0

      for (const item of pendingItems) {
        try {
          await this.syncItemWithConflictDetection(item)
          await offlineStorage.removePendingSync(item.id)
          successCount++

          // 진행 상황 알림
          this.notifyProgress({
            progress: successCount + failCount,
            total: pendingItems.length,
            item: item.data.name || "항목",
          })
        } catch (error) {
          console.error("Failed to sync item:", item, error)
          failCount++

          // 재시도 횟수 증가
          if (item.retryCount < this.maxRetries) {
            await this.scheduleRetry(item)
          } else {
            await offlineStorage.addSyncLog("sync-item", "failed", {
              item: item.data.name,
              error: error.message,
              maxRetriesReached: true,
            })
          }
        }
      }

      // 동기화 완료 처리
      await this.completeSyncProcess(successCount, failCount)
    } catch (error) {
      console.error("Direct sync failed:", error)
      await offlineStorage.addSyncLog("direct-sync", "failed", { error: error.message })
      this.notifySyncError({ error: error.message })
    } finally {
      this.syncInProgress = false
    }
  }

  // 충돌 감지를 포함한 개별 항목 동기화
  private async syncItemWithConflictDetection(item: any): Promise<void> {
    const { action, data } = item

    try {
      switch (action) {
        case "create":
          await this.syncCreateItem(data)
          break
        case "update":
          await this.syncUpdateItemWithConflictDetection(data)
          break
        case "delete":
          await this.syncDeleteItem(data)
          break
        default:
          throw new Error(`Unknown sync action: ${action}`)
      }

      await offlineStorage.addSyncLog("sync-item", "success", {
        action,
        item: data.name || data.id,
      })
    } catch (error) {
      // 충돌이 아닌 다른 오류인 경우 재시도
      if (!error.message.includes("conflict")) {
        throw error
      }
    }
  }

  // 생성 동기화
  private async syncCreateItem(data: Anniversary): Promise<void> {
    const response = await fetch("/api/anniversaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Create sync failed: ${response.status}`)
    }

    const result = await response.json()

    // 로컬 데이터 업데이트 (임시 ID를 서버 ID로 교체)
    await offlineStorage.deleteAnniversary(data.id)
    await offlineStorage.saveAnniversary({ ...result, synced: true })
  }

  // 충돌 감지를 포함한 수정 동기화
  private async syncUpdateItemWithConflictDetection(data: Anniversary): Promise<void> {
    // 먼저 서버에서 최신 데이터 가져오기
    const getResponse = await fetch(`/api/anniversaries/${data.id}`)

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch server data: ${getResponse.status}`)
    }

    const serverData = await getResponse.json()

    // 충돌 감지
    const conflict = await conflictResolver.detectConflicts(data, serverData)

    if (conflict && conflict.status === "pending") {
      // 수동 해결이 필요한 충돌 발생
      throw new Error(`Data conflict detected for ${data.name}`)
    }

    // 충돌이 없거나 자동 해결된 경우 업데이트 진행
    const response = await fetch(`/api/anniversaries/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Update sync failed: ${response.status}`)
    }

    const result = await response.json()
    await offlineStorage.saveAnniversary({ ...result, synced: true })
  }

  // 삭제 동기화
  private async syncDeleteItem(data: { id: string }): Promise<void> {
    const response = await fetch(`/api/anniversaries/${data.id}`, {
      method: "DELETE",
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete sync failed: ${response.status}`)
    }

    // 로컬에서도 삭제 확인
    await offlineStorage.deleteAnniversary(data.id)
  }

  // 재시도 스케줄링
  private async scheduleRetry(item: any): Promise<void> {
    const retryCount = (item.retryCount || 0) + 1
    const delay = this.retryDelay * Math.pow(2, retryCount - 1) // 지수 백오프

    setTimeout(async () => {
      try {
        await this.syncItemWithConflictDetection({ ...item, retryCount })
        await offlineStorage.removePendingSync(item.id)
      } catch (error) {
        console.error(`Retry ${retryCount} failed for item:`, item, error)

        if (retryCount < this.maxRetries) {
          await this.scheduleRetry({ ...item, retryCount })
        } else {
          await offlineStorage.addSyncLog("sync-retry", "failed", {
            item: item.data.name,
            retryCount,
            error: error.message,
          })
        }
      }
    }, delay)
  }

  // 동기화 완료 처리
  private async completeSyncProcess(successCount: number, failCount: number): Promise<void> {
    await offlineStorage.saveSetting("lastSyncTime", Date.now())
    await offlineStorage.addSyncLog("direct-sync", "success", {
      successCount,
      failCount,
      timestamp: Date.now(),
    })

    this.notifySyncComplete({ success: successCount, failed: failCount })

    // 오래된 로그 정리
    await offlineStorage.cleanOldLogs(30)

    // 오래된 충돌 정리
    await conflictResolver.cleanOldConflicts(30)
  }

  // 진행 상황 알림
  private notifyProgress(data: any) {
    window.dispatchEvent(new CustomEvent("sync-progress", { detail: data }))
  }

  // 동기화 완료 알림
  private notifySyncComplete(data: any) {
    window.dispatchEvent(new CustomEvent("sync-complete", { detail: data }))
  }

  // 동기화 오류 알림
  private notifySyncError(data: any) {
    window.dispatchEvent(new CustomEvent("sync-error", { detail: data }))
  }

  // 동기화 상태 조회
  async getSyncStatus(): Promise<{
    inProgress: boolean
    stats: any
    logs: any[]
    conflicts: number
  }> {
    const stats = await offlineStorage.getSyncStats()
    const logs = await offlineStorage.getSyncLogs(10)
    const conflictStats = await conflictResolver.getConflictStats()

    return {
      inProgress: this.syncInProgress,
      stats,
      logs,
      conflicts: conflictStats.pending,
    }
  }

  // 실패한 항목 재시도
  async retryFailedItems(): Promise<void> {
    const failedItems = await offlineStorage.getFailedSyncItems()

    for (const item of failedItems) {
      // 재시도 횟수 초기화
      await offlineStorage.addPendingSync({
        ...item,
        retryCount: 0,
        timestamp: Date.now(),
      })

      // 기존 실패 항목 제거
      await offlineStorage.removePendingSync(item.id)
    }

    // 동기화 트리거
    await this.triggerSync(true)
  }

  // 수동 동기화 (우선순위 높음)
  async manualSync(): Promise<void> {
    await this.triggerSync(true)
  }
}

export const backgroundSyncManager = BackgroundSyncManager.getInstance()
