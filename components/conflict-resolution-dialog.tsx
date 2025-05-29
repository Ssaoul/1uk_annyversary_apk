"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Check, X, Merge, Clock, User, Server, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { conflictResolver } from "@/lib/conflict-resolver"
import type { DataConflict } from "@/types/conflict"
import { toast } from "sonner"

interface ConflictResolutionDialogProps {
  conflict: DataConflict | null
  isOpen: boolean
  onClose: () => void
  onResolved: () => void
}

export default function ConflictResolutionDialog({
  conflict,
  isOpen,
  onClose,
  onResolved,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<"local" | "server" | "custom">("local")
  const [customData, setCustomData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (conflict) {
      setCustomData({ ...conflict.localData })
      setSelectedResolution("local")
    }
  }, [conflict])

  if (!conflict) return null

  const handleResolve = async () => {
    setLoading(true)
    try {
      const success = await conflictResolver.resolveConflict(conflict.id, selectedResolution, customData)

      if (success) {
        toast.success("충돌이 해결되었습니다")
        onResolved()
        onClose()
      } else {
        toast.error("충돌 해결에 실패했습니다")
      }
    } catch (error) {
      console.error("Conflict resolution failed:", error)
      toast.error("충돌 해결 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ko-KR")
  }

  const getConflictIcon = (field: string) => {
    switch (field) {
      case "name":
      case "date":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "memo":
        return <Merge className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const renderFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">없음</span>

    switch (field) {
      case "date":
        return new Date(value).toLocaleDateString("ko-KR")
      case "is_lunar":
      case "is_favorite":
      case "notification_enabled":
        return value ? "예" : "아니오"
      case "memo":
        return (
          <div className="max-w-xs">
            <p className="text-sm truncate">{value}</p>
          </div>
        )
      case "image_url":
        return value ? (
          <div className="flex items-center gap-2">
            <img src={value || "/placeholder.svg"} alt="이미지" className="w-8 h-8 object-cover rounded" />
            <span className="text-xs text-muted-foreground">이미지 있음</span>
          </div>
        ) : (
          <span className="text-muted-foreground">이미지 없음</span>
        )
      default:
        return String(value)
    }
  }

  const renderCustomField = (field: string, value: any, onChange: (newValue: any) => void) => {
    switch (field) {
      case "name":
        return (
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="기념일명을 입력하세요" />
        )

      case "date":
        return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />

      case "memo":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={3}
          />
        )

      case "is_lunar":
      case "is_favorite":
      case "notification_enabled":
        return <Switch checked={value || false} onCheckedChange={onChange} />

      case "contact_name":
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="연락처 이름을 입력하세요"
          />
        )

      case "category":
        return (
          <RadioGroup value={value || "birthday"} onValueChange={onChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="birthday" id="birthday" />
              <Label htmlFor="birthday">생일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="anniversary" id="anniversary" />
              <Label htmlFor="anniversary">기념일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company">회사</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">기타</Label>
            </div>
          </RadioGroup>
        )

      default:
        return (
          <Input
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${field} 값을 입력하세요`}
          />
        )
    }
  }

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      name: "기념일명",
      date: "날짜",
      is_lunar: "음력 여부",
      contact_name: "연락처",
      category: "구분",
      repeat_type: "반복 설정",
      memo: "메모",
      image_url: "이미지",
      is_favorite: "즐겨찾기",
      notification_enabled: "알림 사용",
      notify_same_day: "당일 알림",
      notify_one_day_before: "1일 전 알림",
      notify_three_days_before: "3일 전 알림",
      notify_five_days_before: "5일 전 알림",
      notify_one_week_before: "1주일 전 알림",
    }
    return fieldNames[field] || field
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            데이터 충돌 해결
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 충돌 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">충돌 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">기념일:</span> {conflict.entityName}
                </div>
                <div>
                  <span className="font-medium">충돌 수:</span> {conflict.conflicts.length}개
                </div>
                <div>
                  <span className="font-medium">로컬 수정:</span> {formatTimestamp(conflict.localTimestamp)}
                </div>
                <div>
                  <span className="font-medium">서버 수정:</span> {formatTimestamp(conflict.serverTimestamp)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 충돌 필드 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">충돌 필드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {conflict.conflicts.map((conflictData, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getConflictIcon(conflictData.field)}
                    <div className="flex-1">
                      <div className="font-medium">{getFieldDisplayName(conflictData.field)}</div>
                      <div className="text-xs text-muted-foreground">
                        로컬: {formatTimestamp(conflictData.localTimestamp)} | 서버:{" "}
                        {formatTimestamp(conflictData.serverTimestamp)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      충돌
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 해결 방법 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">해결 방법 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedResolution} onValueChange={(value) => setSelectedResolution(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="local" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    로컬 데이터 사용
                  </TabsTrigger>
                  <TabsTrigger value="server" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    서버 데이터 사용
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    수동 병합
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="local" className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">로컬 데이터 (이 기기)</h4>
                    <div className="space-y-2">
                      {conflict.conflicts.map((conflictData, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{getFieldDisplayName(conflictData.field)}:</span>
                          <div className="text-sm">{renderFieldValue(conflictData.field, conflictData.localValue)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="server" className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">서버 데이터 (다른 기기)</h4>
                    <div className="space-y-2">
                      {conflict.conflicts.map((conflictData, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{getFieldDisplayName(conflictData.field)}:</span>
                          <div className="text-sm">
                            {renderFieldValue(conflictData.field, conflictData.serverValue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium mb-3">수동 병합 - 원하는 값을 직접 설정하세요</h4>
                    <div className="space-y-4">
                      {conflict.conflicts.map((conflictData, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm font-medium">{getFieldDisplayName(conflictData.field)}</Label>
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                            <div>로컬: {renderFieldValue(conflictData.field, conflictData.localValue)}</div>
                            <div>서버: {renderFieldValue(conflictData.field, conflictData.serverValue)}</div>
                            <div>선택:</div>
                          </div>
                          {renderCustomField(conflictData.field, customData?.[conflictData.field], (newValue) =>
                            setCustomData((prev: any) => ({ ...prev, [conflictData.field]: newValue })),
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button onClick={handleResolve} disabled={loading}>
              {loading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              해결하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
