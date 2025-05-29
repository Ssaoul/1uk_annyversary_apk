"use client"

import { useState, useEffect } from "react"
import { offlineManager } from "@/lib/offline-manager"
import type { Anniversary } from "@/types/anniversary"
import { toast } from "sonner"

// 백그라운드 동기화 매니저 통합
import { backgroundSyncManager } from "@/lib/background-sync-manager"
import { offlineStorage } from "@/lib/offline-storage"

export function useOfflineAnniversaries() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null })

  useEffect(() => {
    loadAnniversaries()
    loadSyncStatus()

    // 오프라인 상태 변경 리스너
    const handleStatusChange = (event: CustomEvent) => {
      const { status, isOnline: online } = event.detail
      setIsOnline(online)

      if (status === "online") {
        toast.success("온라인 상태로 변경되었습니다")
        loadAnniversaries() // 온라인 복구 시 데이터 새로고침
        // 백그라운드 동기화 트리거
        backgroundSyncManager.triggerSync()
      } else if (status === "offline") {
        toast.warning("오프라인 모드입니다. 데이터는 로컬에 저장됩니다.")
      } else if (status === "synced") {
        toast.success("데이터 동기화가 완료되었습니다")
        loadSyncStatus()
        loadAnniversaries() // 동기화 후 데이터 새로고침
      }
    }

    // 동기화 진행 상황 리스너 추가
    const handleSyncProgress = (event: CustomEvent) => {
      // 진행 상황을 상태로 관리하거나 토스트로 표시
      const { progress, total, item } = event.detail
      if (progress === 1) {
        toast.loading(`동기화 중: ${item}`, { id: "sync-progress" })
      } else {
        toast.loading(`동기화 중: ${progress}/${total} - ${item}`, { id: "sync-progress" })
      }
    }

    const handleSyncComplete = (event: CustomEvent) => {
      const { success, failed } = event.detail
      toast.success(`동기화 완료: ${success}개 성공${failed > 0 ? `, ${failed}개 실패` : ""}`, {
        id: "sync-progress",
      })
      loadAnniversaries()
      loadSyncStatus()
    }

    const handleSyncError = (event: CustomEvent) => {
      toast.error(`동기화 오류: ${event.detail.error}`, { id: "sync-progress" })
      loadSyncStatus()
    }

    window.addEventListener("offline-status-change", handleStatusChange as EventListener)
    window.addEventListener("sync-progress", handleSyncProgress as EventListener)
    window.addEventListener("sync-complete", handleSyncComplete as EventListener)
    window.addEventListener("sync-error", handleSyncError as EventListener)

    return () => {
      window.removeEventListener("offline-status-change", handleStatusChange as EventListener)
      window.removeEventListener("sync-progress", handleSyncProgress as EventListener)
      window.removeEventListener("sync-complete", handleSyncComplete as EventListener)
      window.removeEventListener("sync-error", handleSyncError as EventListener)
    }
  }, [])

  const loadAnniversaries = async () => {
    try {
      setLoading(true)
      const data = await offlineManager.getAnniversaries()
      setAnniversaries(data)
      setError(null)
    } catch (err) {
      setError("기념일을 불러오는데 실패했습니다.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const status = await offlineManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error("Failed to load sync status:", error)
    }
  }

  const addAnniversary = async (anniversary: Omit<Anniversary, "id" | "created_at" | "updated_at">) => {
    try {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newAnniversary = {
        ...anniversary,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false, // 동기화 상태 표시
      } as Anniversary

      // 로컬에 저장
      const savedAnniversary = await offlineManager.saveAnniversary(newAnniversary)
      setAnniversaries((prev) => [...prev, savedAnniversary])

      // 동기화 대기열에 추가 (높은 우선순위)
      await offlineStorage.addPendingSync(
        {
          action: "create",
          data: savedAnniversary,
        },
        3,
      ) // 우선순위 3 (높음)

      // 온라인이면 즉시 동기화 시도
      if (isOnline) {
        backgroundSyncManager.triggerSync()
      } else {
        toast.info("오프라인 모드: 온라인 복구 시 서버에 동기화됩니다")
      }

      loadSyncStatus()
      return savedAnniversary
    } catch (err) {
      setError("기념일 추가에 실패했습니다.")
      console.error(err)
      return null
    }
  }

  const updateAnniversary = async (id: string, updates: Partial<Anniversary>) => {
    try {
      const existingAnniversary = anniversaries.find((ann) => ann.id === id)
      if (!existingAnniversary) return null

      const updatedAnniversary = {
        ...existingAnniversary,
        ...updates,
        updated_at: new Date().toISOString(),
        synced: false, // 동기화 상태 표시
      }

      // 로컬에 저장
      const savedAnniversary = await offlineManager.saveAnniversary(updatedAnniversary)
      setAnniversaries((prev) => prev.map((ann) => (ann.id === id ? savedAnniversary : ann)))

      // 동기화 대기열에 추가 (중간 우선순위)
      await offlineStorage.addPendingSync(
        {
          action: "update",
          data: savedAnniversary,
        },
        2,
      ) // 우선순위 2 (중간)

      // 온라인이면 즉시 동기화 시도
      if (isOnline) {
        backgroundSyncManager.triggerSync()
      } else {
        toast.info("오프라인 모드: 온라인 복구 시 서버에 동기화됩니다")
      }

      loadSyncStatus()
      return savedAnniversary
    } catch (err) {
      setError("기념일 수정에 실패했습니다.")
      console.error(err)
      return null
    }
  }

  const deleteAnniversary = async (id: string) => {
    try {
      const anniversary = anniversaries.find((ann) => ann.id === id)
      if (!anniversary) return false

      // 로컬에서 삭제
      const success = await offlineManager.deleteAnniversary(id)
      if (success) {
        setAnniversaries((prev) => prev.filter((ann) => ann.id !== id))

        // 동기화 대기열에 추가 (낮은 우선순위)
        await offlineStorage.addPendingSync(
          {
            action: "delete",
            data: { id, name: anniversary.name },
          },
          1,
        ) // 우선순위 1 (낮음)

        // 온라인이면 즉시 동기화 시도
        if (isOnline) {
          backgroundSyncManager.triggerSync()
        } else {
          toast.info("오프라인 모드: 온라인 복구 시 서버에 동기화됩니다")
        }

        loadSyncStatus()
        return true
      }
    } catch (err) {
      setError("기념일 삭제에 실패했습니다.")
      console.error(err)
    }
    return false
  }

  const toggleFavorite = async (id: string) => {
    const anniversary = anniversaries.find((ann) => ann.id === id)
    if (anniversary) {
      return await updateAnniversary(id, { is_favorite: !anniversary.is_favorite })
    }
    return false
  }

  const forceSync = async () => {
    if (!isOnline) {
      toast.error("동기화하려면 인터넷 연결이 필요합니다")
      return
    }

    try {
      await backgroundSyncManager.manualSync()
      toast.info("동기화를 시작했습니다")
    } catch (error) {
      console.error("Force sync failed:", error)
      toast.error("동기화 시작에 실패했습니다")
    }
  }

  // 기존 함수들과 호환성 유지
  const getUpcomingAnniversaries = () => {
    return anniversaries
      .filter((ann) => ann.repeat_type !== "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .filter((anniversary) => anniversary.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }

  const getCumulativeAnniversaries = () => {
    return anniversaries
      .filter((ann) => ann.repeat_type === "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .sort((a, b) => Math.abs(a.daysLeft) - Math.abs(b.daysLeft))
  }

  const getAnniversariesByType = (type: string) => {
    return anniversaries.filter((anniversary) => anniversary.category === type)
  }

  return {
    anniversaries,
    loading,
    error,
    isOnline,
    syncStatus,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    toggleFavorite,
    getUpcomingAnniversaries,
    getCumulativeAnniversaries,
    getAnniversariesByType,
    forceSync,
    refetch: loadAnniversaries,
  }
}

// D-day 계산 함수
function calculateDaysLeft(date: string, repeatType: string): number {
  const today = new Date()
  const anniversaryDate = new Date(date)

  if (repeatType === "once") {
    const diffTime = anniversaryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } else if (repeatType === "yearly") {
    const currentYear = today.getFullYear()
    const thisYearAnniversary = new Date(currentYear, anniversaryDate.getMonth(), anniversaryDate.getDate())

    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(currentYear + 1)
    }

    const diffTime = thisYearAnniversary.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } else if (repeatType === "cumulative") {
    const diffTime = today.getTime() - anniversaryDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  return 0
}
