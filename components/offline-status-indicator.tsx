"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, RefreshCw, AlertCircle, Settings, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { offlineManager } from "@/lib/offline-manager"
import { conflictResolver } from "@/lib/conflict-resolver"

// 동기화 상태 패널과 충돌 관리자 추가
import SyncStatusPanel from "./sync-status-panel"
import ConflictManager from "./conflict-manager"

export default function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null })
  const [conflictCount, setConflictCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [showConflictManager, setShowConflictManager] = useState(false)
  const [syncProgress, setSyncProgress] = useState<any>(null)

  useEffect(() => {
    loadSyncStatus()
    loadConflictCount()

    const handleStatusChange = (event: CustomEvent) => {
      const { isOnline: online } = event.detail
      setIsOnline(online)
      loadSyncStatus()
    }

    // 동기화 진행 상황 리스너
    const handleSyncProgress = (event: CustomEvent) => {
      setSyncProgress(event.detail)
    }

    const handleSyncComplete = () => {
      setSyncProgress(null)
      loadSyncStatus()
    }

    // 충돌 발생 리스너
    const handleConflict = () => {
      loadConflictCount()
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("offline-status-change", handleStatusChange as EventListener)
    window.addEventListener("sync-progress", handleSyncProgress as EventListener)
    window.addEventListener("sync-complete", handleSyncComplete as EventListener)
    window.addEventListener("sync-error", handleSyncComplete as EventListener)
    window.addEventListener("data-conflict", handleConflict as EventListener)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("offline-status-change", handleStatusChange as EventListener)
      window.removeEventListener("sync-progress", handleSyncProgress as EventListener)
      window.removeEventListener("sync-complete", handleSyncComplete as EventListener)
      window.removeEventListener("sync-error", handleSyncComplete as EventListener)
      window.removeEventListener("data-conflict", handleConflict as EventListener)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadSyncStatus = async () => {
    try {
      const status = await offlineManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error("Failed to load sync status:", error)
    }
  }

  const loadConflictCount = async () => {
    try {
      const stats = await conflictResolver.getConflictStats()
      setConflictCount(stats.pending)
    } catch (error) {
      console.error("Failed to load conflict count:", error)
    }
  }

  const handleForceSync = async () => {
    try {
      await offlineManager.forcSync()
      await loadSyncStatus()
    } catch (error) {
      console.error("Force sync failed:", error)
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "동기화 안됨"

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return "방금 전"
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2">
          {/* 온라인 상태 표시 */}
          <Badge
            variant={isOnline ? "default" : "destructive"}
            className={`cursor-pointer transition-all ${
              isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            }`}
            onClick={() => setShowDetails(!showDetails)}
          >
            {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isOnline ? "온라인" : "오프라인"}
          </Badge>

          {/* 동기화 진행 표시 */}
          {syncProgress && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              동기화 중 ({syncProgress.progress}/{syncProgress.total})
            </Badge>
          )}

          {/* 충돌 표시 */}
          {conflictCount > 0 && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 cursor-pointer"
              onClick={() => setShowConflictManager(true)}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              충돌 {conflictCount}개
            </Badge>
          )}

          {/* 동기화 대기 표시 */}
          {syncStatus.pending > 0 && !syncProgress && (
            <Badge
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer"
              onClick={() => setShowSyncPanel(true)}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {syncStatus.pending}개 대기
            </Badge>
          )}
        </div>

        {/* 상세 정보 카드 */}
        {showDetails && (
          <Card className="absolute top-10 right-0 w-64 shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">연결 상태</span>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{isOnline ? "온라인" : "오프라인"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">동기화 대기</span>
                <span className="text-sm">{syncStatus.pending}개</span>
              </div>

              {conflictCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">데이터 충돌</span>
                  <span className="text-sm text-red-600">{conflictCount}개</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">마지막 동기화</span>
                <span className="text-xs text-muted-foreground">{formatLastSync(syncStatus.lastSync)}</span>
              </div>

              {/* 충돌 관리 버튼 */}
              {conflictCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setShowConflictManager(true)
                    setShowDetails(false)
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  충돌 해결
                </Button>
              )}

              {/* 동기화 상태 패널 열기 버튼 */}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowSyncPanel(true)
                  setShowDetails(false)
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                동기화 상세
              </Button>

              {isOnline && (
                <Button size="sm" variant="outline" className="w-full" onClick={handleForceSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  지금 동기화
                </Button>
              )}

              {!isOnline && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  오프라인 모드에서는 데이터가 로컬에 저장되며, 온라인 복구 시 자동으로 동기화됩니다.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 동기화 상태 패널 */}
      <SyncStatusPanel isOpen={showSyncPanel} onClose={() => setShowSyncPanel(false)} />

      {/* 충돌 관리자 */}
      <ConflictManager isOpen={showConflictManager} onClose={() => setShowConflictManager(false)} />
    </>
  )
}
