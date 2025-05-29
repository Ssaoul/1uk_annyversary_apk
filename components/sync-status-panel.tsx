"use client"

import { useState, useEffect } from "react"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { backgroundSyncManager } from "@/lib/background-sync-manager"
import { toast } from "sonner"

interface SyncStatusPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SyncStatusPanel({ isOpen, onClose }: SyncStatusPanelProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncProgress, setSyncProgress] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSyncStatus()
    }

    // 동기화 이벤트 리스너
    const handleSyncProgress = (event: CustomEvent) => {
      setSyncProgress(event.detail)
    }

    const handleSyncComplete = (event: CustomEvent) => {
      setSyncProgress(null)
      loadSyncStatus()
      toast.success(`동기화 완료: ${event.detail.success}개 성공, ${event.detail.failed}개 실패`)
    }

    const handleSyncError = (event: CustomEvent) => {
      setSyncProgress(null)
      loadSyncStatus()
      toast.error(`동기화 오류: ${event.detail.error}`)
    }

    window.addEventListener("sync-progress", handleSyncProgress as EventListener)
    window.addEventListener("sync-complete", handleSyncComplete as EventListener)
    window.addEventListener("sync-error", handleSyncError as EventListener)

    return () => {
      window.removeEventListener("sync-progress", handleSyncProgress as EventListener)
      window.removeEventListener("sync-complete", handleSyncComplete as EventListener)
      window.removeEventListener("sync-error", handleSyncError as EventListener)
    }
  }, [isOpen])

  const loadSyncStatus = async () => {
    try {
      const status = await backgroundSyncManager.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error("Failed to load sync status:", error)
    }
  }

  const handleManualSync = async () => {
    setLoading(true)
    try {
      await backgroundSyncManager.manualSync()
      toast.info("동기화를 시작했습니다")
    } catch (error) {
      console.error("Manual sync failed:", error)
      toast.error("동기화 시작에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleRetryFailed = async () => {
    setLoading(true)
    try {
      await backgroundSyncManager.retryFailedItems()
      toast.info("실패한 항목들을 다시 동기화합니다")
    } catch (error) {
      console.error("Retry failed items failed:", error)
      toast.error("재시도에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("ko-KR")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">동기화 상태</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {/* 동기화 진행 상황 */}
          {syncProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">동기화 중...</span>
                <span className="text-xs text-muted-foreground">
                  {syncProgress.progress}/{syncProgress.total}
                </span>
              </div>
              <Progress value={(syncProgress.progress / syncProgress.total) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">현재: {syncProgress.item}</p>
            </div>
          )}

          {/* 동기화 통계 */}
          {syncStatus && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{syncStatus.stats.pending}</div>
                <div className="text-xs text-muted-foreground">대기 중</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">{syncStatus.stats.failed}</div>
                <div className="text-xs text-muted-foreground">실패</div>
              </div>
            </div>
          )}

          {/* 마지막 동기화 시간 */}
          {syncStatus?.stats.lastSync && (
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">마지막 동기화</div>
              <div className="text-xs text-green-600">{formatTimestamp(syncStatus.stats.lastSync)}</div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-2">
            <Button onClick={handleManualSync} disabled={loading || syncProgress} className="w-full" size="sm">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              지금 동기화
            </Button>

            {syncStatus?.stats.failed > 0 && (
              <Button
                onClick={handleRetryFailed}
                disabled={loading || syncProgress}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                실패한 항목 재시도
              </Button>
            )}
          </div>

          {/* 동기화 로그 */}
          {syncStatus?.logs && syncStatus.logs.length > 0 && (
            <Collapsible open={showLogs} onOpenChange={setShowLogs}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between" size="sm">
                  <span>동기화 로그</span>
                  {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {syncStatus.logs.slice(0, 5).map((log: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                    {getStatusIcon(log.status)}
                    <div className="flex-1">
                      <div className="font-medium">{log.action}</div>
                      {log.details && (
                        <div className="text-muted-foreground">
                          {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString("ko-KR")}</div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* 상태 설명 */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <p className="mb-1">
              <strong>자동 동기화:</strong> 온라인 복구 시, 앱 포그라운드 진입 시
            </p>
            <p>
              <strong>백그라운드 동기화:</strong> 브라우저가 지원하는 경우 백그라운드에서 자동 실행
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
