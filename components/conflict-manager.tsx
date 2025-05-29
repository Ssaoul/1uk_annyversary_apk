"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, CheckCircle, Settings, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { conflictResolver } from "@/lib/conflict-resolver"
import type { DataConflict, ConflictResolutionSettings } from "@/types/conflict"
import ConflictResolutionDialog from "./conflict-resolution-dialog"
import { toast } from "sonner"

interface ConflictManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConflictManager({ isOpen, onClose }: ConflictManagerProps) {
  const [conflicts, setConflicts] = useState<DataConflict[]>([])
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null)
  const [showResolutionDialog, setShowResolutionDialog] = useState(false)
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, autoResolved: 0 })
  const [settings, setSettings] = useState<ConflictResolutionSettings>({
    defaultStrategy: "latest",
    fieldRules: [],
    autoResolveEnabled: true,
    notifyOnConflict: true,
    keepConflictHistory: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadConflicts()
      loadStats()
      loadSettings()
    }

    // 충돌 이벤트 리스너
    const handleConflict = (event: CustomEvent) => {
      loadConflicts()
      loadStats()
      toast.warning(event.detail.message)
    }

    window.addEventListener("data-conflict", handleConflict as EventListener)

    return () => {
      window.removeEventListener("data-conflict", handleConflict as EventListener)
    }
  }, [isOpen])

  const loadConflicts = async () => {
    try {
      const allConflicts = await conflictResolver.getAllConflicts()
      setConflicts(allConflicts)
    } catch (error) {
      console.error("Failed to load conflicts:", error)
    }
  }

  const loadStats = async () => {
    try {
      const conflictStats = await conflictResolver.getConflictStats()
      setStats(conflictStats)
    } catch (error) {
      console.error("Failed to load conflict stats:", error)
    }
  }

  const loadSettings = async () => {
    // 설정 로드 로직 (실제로는 conflictResolver에서 가져옴)
  }

  const handleConflictClick = (conflict: DataConflict) => {
    if (conflict.status === "pending") {
      setSelectedConflict(conflict)
      setShowResolutionDialog(true)
    }
  }

  const handleConflictResolved = () => {
    loadConflicts()
    loadStats()
  }

  const handleSettingsChange = async (newSettings: Partial<ConflictResolutionSettings>) => {
    try {
      await conflictResolver.saveSettings(newSettings)
      setSettings((prev) => ({ ...prev, ...newSettings }))
      toast.success("설정이 저장되었습니다")
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("설정 저장에 실패했습니다")
    }
  }

  const handleCleanOldConflicts = async () => {
    setLoading(true)
    try {
      await conflictResolver.cleanOldConflicts(30)
      await loadConflicts()
      await loadStats()
      toast.success("오래된 충돌 기록이 정리되었습니다")
    } catch (error) {
      console.error("Failed to clean old conflicts:", error)
      toast.error("충돌 기록 정리에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ko-KR")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "auto-resolved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "auto-resolved":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                충돌 관리
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-y-auto">
            <Tabs defaultValue="conflicts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conflicts">충돌 목록</TabsTrigger>
                <TabsTrigger value="stats">통계</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
              </TabsList>

              {/* 충돌 목록 탭 */}
              <TabsContent value="conflicts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">데이터 충돌 목록</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={loadConflicts}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      새로고침
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCleanOldConflicts} disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      정리
                    </Button>
                  </div>
                </div>

                {conflicts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">충돌이 없습니다</h3>
                    <p className="text-sm text-muted-foreground">모든 데이터가 정상적으로 동기화되었습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conflicts.map((conflict) => (
                      <Card
                        key={conflict.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          conflict.status === "pending" ? "border-red-200" : ""
                        }`}
                        onClick={() => handleConflictClick(conflict)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(conflict.status)}
                              <div>
                                <h4 className="font-medium">{conflict.entityName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {conflict.conflicts.length}개 필드 충돌 • {formatTimestamp(conflict.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(conflict.status)}>
                                {conflict.status === "pending"
                                  ? "대기 중"
                                  : conflict.status === "resolved"
                                    ? "해결됨"
                                    : "자동 해결"}
                              </Badge>
                              {conflict.status === "pending" && (
                                <Badge variant="destructive" className="text-xs">
                                  해결 필요
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* 충돌 필드 미리보기 */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {conflict.conflicts.slice(0, 3).map((c, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {c.field}
                              </Badge>
                            ))}
                            {conflict.conflicts.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{conflict.conflicts.length - 3}개 더
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* 통계 탭 */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">전체 충돌</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
                      <div className="text-sm text-muted-foreground">대기 중</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                      <div className="text-sm text-muted-foreground">수동 해결</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.autoResolved}</div>
                      <div className="text-sm text-muted-foreground">자동 해결</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">충돌 해결 현황</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>해결률</span>
                        <span className="font-medium">
                          {stats.total > 0
                            ? Math.round(((stats.resolved + stats.autoResolved) / stats.total) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${stats.total > 0 ? ((stats.resolved + stats.autoResolved) / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 설정 탭 */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      충돌 해결 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 기본 전략 */}
                    <div className="space-y-2">
                      <Label>기본 해결 전략</Label>
                      <Select
                        value={settings.defaultStrategy}
                        onValueChange={(value) =>
                          handleSettingsChange({ defaultStrategy: value as "local" | "server" | "latest" | "manual" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">로컬 데이터 우선</SelectItem>
                          <SelectItem value="server">서버 데이터 우선</SelectItem>
                          <SelectItem value="latest">최신 데이터 우선</SelectItem>
                          <SelectItem value="manual">항상 수동 해결</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        자동 해결이 가능한 경우 사용할 기본 전략을 선택하세요.
                      </p>
                    </div>

                    {/* 자동 해결 활성화 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>자동 해결 활성화</Label>
                        <p className="text-xs text-muted-foreground">가능한 경우 충돌을 자동으로 해결합니다.</p>
                      </div>
                      <Switch
                        checked={settings.autoResolveEnabled}
                        onCheckedChange={(checked) => handleSettingsChange({ autoResolveEnabled: checked })}
                      />
                    </div>

                    {/* 충돌 알림 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>충돌 발생 시 알림</Label>
                        <p className="text-xs text-muted-foreground">데이터 충돌이 발생하면 알림을 표시합니다.</p>
                      </div>
                      <Switch
                        checked={settings.notifyOnConflict}
                        onCheckedChange={(checked) => handleSettingsChange({ notifyOnConflict: checked })}
                      />
                    </div>

                    {/* 충돌 기록 보관 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>충돌 기록 보관</Label>
                        <p className="text-xs text-muted-foreground">해결된 충돌의 기록을 보관합니다.</p>
                      </div>
                      <Switch
                        checked={settings.keepConflictHistory}
                        onCheckedChange={(checked) => handleSettingsChange({ keepConflictHistory: checked })}
                      />
                    </div>

                    {/* 필드별 규칙 */}
                    <div className="space-y-3">
                      <Label>필드별 해결 규칙</Label>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2 font-medium text-muted-foreground">
                          <span>필드</span>
                          <span>전략</span>
                          <span>우선순위</span>
                        </div>
                        {settings.fieldRules.map((rule, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2 items-center">
                            <span>{rule.field}</span>
                            <Badge variant="outline" className="text-xs">
                              {rule.strategy === "manual"
                                ? "수동"
                                : rule.strategy === "latest"
                                  ? "최신"
                                  : rule.strategy === "merge"
                                    ? "병합"
                                    : rule.strategy}
                            </Badge>
                            <span className="text-muted-foreground">{rule.priority}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        중요한 필드(이름, 날짜)는 수동 해결, 기타 필드는 자동 해결을 권장합니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 충돌 해결 다이얼로그 */}
      <ConflictResolutionDialog
        conflict={selectedConflict}
        isOpen={showResolutionDialog}
        onClose={() => {
          setShowResolutionDialog(false)
          setSelectedConflict(null)
        }}
        onResolved={handleConflictResolved}
      />
    </>
  )
}
