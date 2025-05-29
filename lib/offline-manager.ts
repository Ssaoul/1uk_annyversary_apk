import { offlineStorage } from "./offline-storage"
import type { Anniversary } from "@/types/anniversary"

export class OfflineManager {
  private static instance: OfflineManager
  private isOnline: boolean = navigator.onLine
  private syncInProgress = false

  constructor() {
    this.setupEventListeners()
    this.init()
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  private async init() {
    await offlineStorage.init()

    // 앱 시작 시 동기화 시도
    if (this.isOnline) {
      this.syncPendingData()
    }

    // 주기적으로 만료된 캐시 정리
    setInterval(() => {
      offlineStorage.cleanExpiredCache()
    }, 60000) // 1분마다
  }

  private setupEventListeners() {
    // 온라인/오프라인 상태 감지
    window.addEventListener("online", () => {
      console.log("App is now online")
      this.isOnline = true
      this.syncPendingData()
      this.notifyStatusChange("online")
    })

    window.addEventListener("offline", () => {
      console.log("App is now offline")
      this.isOnline = false
      this.notifyStatusChange("offline")
    })

    // 페이지 가시성 변경 시 동기화
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingData()
      }
    })
  }

  // 온라인 상태 확인
  isAppOnline(): boolean {
    return this.isOnline
  }

  // 기념일 저장 (오프라인 지원)
  async saveAnniversary(anniversary: Anniversary): Promise<Anniversary> {
    try {
      // 로컬에 저장
      await offlineStorage.saveAnniversary(anniversary)

      if (this.isOnline) {
        // 온라인이면 서버에도 저장
        try {
          const response = await fetch("/api/anniversaries", {
            method: anniversary.id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(anniversary),
          })

          if (response.ok) {
            const serverData = await response.json()
            // 서버 응답으로 로컬 데이터 업데이트
            await offlineStorage.saveAnniversary({ ...serverData, synced: true })
            return serverData
          }
        } catch (error) {
          console.error("Failed to save to server:", error)
          // 서버 저장 실패 시 동기화 대기열에 추가
          await this.addToPendingSync("save", anniversary)
        }
      } else {
        // 오프라인이면 동기화 대기열에 추가
        await this.addToPendingSync("save", anniversary)
      }

      return anniversary
    } catch (error) {
      console.error("Failed to save anniversary:", error)
      throw error
    }
  }

  // 기념일 목록 조회 (오프라인 지원)
  async getAnniversaries(): Promise<Anniversary[]> {
    try {
      if (this.isOnline) {
        // 온라인이면 서버에서 최신 데이터 가져오기
        try {
          const response = await fetch("/api/anniversaries")
          if (response.ok) {
            const serverData = await response.json()

            // 서버 데이터를 로컬에 캐시
            for (const anniversary of serverData) {
              await offlineStorage.saveAnniversary({ ...anniversary, synced: true })
            }

            return serverData
          }
        } catch (error) {
          console.error("Failed to fetch from server:", error)
        }
      }

      // 오프라인이거나 서버 요청 실패 시 로컬 데이터 반환
      return await offlineStorage.getAnniversaries()
    } catch (error) {
      console.error("Failed to get anniversaries:", error)
      return []
    }
  }

  // 기념일 삭제 (오프라인 지원)
  async deleteAnniversary(id: string): Promise<boolean> {
    try {
      // 로컬에서 삭제
      await offlineStorage.deleteAnniversary(id)

      if (this.isOnline) {
        // 온라인이면 서버에서도 삭제
        try {
          const response = await fetch(`/api/anniversaries/${id}`, {
            method: "DELETE",
          })

          if (!response.ok) {
            throw new Error("Server delete failed")
          }
        } catch (error) {
          console.error("Failed to delete from server:", error)
          // 서버 삭제 실패 시 동기화 대기열에 추가
          await this.addToPendingSync("delete", { id })
        }
      } else {
        // 오프라인이면 동기화 대기열에 추가
        await this.addToPendingSync("delete", { id })
      }

      return true
    } catch (error) {
      console.error("Failed to delete anniversary:", error)
      return false
    }
  }

  // 동기화 대기열에 추가
  private async addToPendingSync(action: string, data: any) {
    await offlineStorage.addPendingSync({
      action,
      data,
      timestamp: Date.now(),
    })

    // 백그라운드 동기화 등록
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("anniversary-sync")
      } catch (error) {
        console.error("Failed to register background sync:", error)
      }
    }
  }

  // 대기 중인 데이터 동기화
  async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true

    try {
      const pendingItems = await offlineStorage.getPendingSync()

      if (pendingItems.length === 0) {
        return
      }

      console.log(`Syncing ${pendingItems.length} pending items`)

      for (const item of pendingItems) {
        try {
          switch (item.action) {
            case "save":
              await this.syncSaveItem(item.data)
              break
            case "delete":
              await this.syncDeleteItem(item.data.id)
              break
          }
        } catch (error) {
          console.error("Failed to sync item:", item, error)
          // 개별 항목 동기화 실패는 전체 동기화를 중단하지 않음
        }
      }

      // 동기화 완료 후 대기열 정리
      await offlineStorage.clearPendingSync()
      console.log("Sync completed successfully")

      // 동기화 완료 알림
      this.notifyStatusChange("synced")
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSaveItem(data: any): Promise<void> {
    const response = await fetch("/api/anniversaries", {
      method: data.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Server save failed: ${response.status}`)
    }

    const serverData = await response.json()
    await offlineStorage.saveAnniversary({ ...serverData, synced: true })
  }

  private async syncDeleteItem(id: string): Promise<void> {
    const response = await fetch(`/api/anniversaries/${id}`, {
      method: "DELETE",
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`Server delete failed: ${response.status}`)
    }
  }

  // 상태 변경 알림
  private notifyStatusChange(status: "online" | "offline" | "synced") {
    window.dispatchEvent(
      new CustomEvent("offline-status-change", {
        detail: { status, isOnline: this.isOnline },
      }),
    )
  }

  // 동기화 상태 확인
  async getSyncStatus(): Promise<{ pending: number; lastSync: number | null }> {
    const pendingItems = await offlineStorage.getPendingSync()
    const lastSync = await offlineStorage.getSetting("lastSyncTime")

    return {
      pending: pendingItems.length,
      lastSync,
    }
  }

  // 수동 동기화 트리거
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingData()
      await offlineStorage.saveSetting("lastSyncTime", Date.now())
    }
  }
}

export const offlineManager = OfflineManager.getInstance()
