"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Settings, Users, Eye, MousePointer, Edit3, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { clientOnlyCollaboration } from "@/lib/client-only-collaboration"
import type { CollaborationSettings as CollaborationSettingsType } from "@/types/collaboration"

interface CollaborationSettingsProps {
  onClose?: () => void
}

// 클라이언트 사이드에서만 렌더링
const CollaborationSettingsContent = dynamic(() => Promise.resolve(CollaborationSettingsComponent), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center">로딩 중...</div>,
})

function CollaborationSettingsComponent({ onClose }: CollaborationSettingsProps) {
  const [settings, setSettings] = useState<CollaborationSettingsType>({
    showOtherUsers: true,
    showCursors: true,
    showEditing: true,
    showUserNames: true,
    enableRealtimeSync: true,
    conflictResolution: "manual",
    presenceTimeout: 30000,
  })

  useEffect(() => {
    // 현재 설정 로드
    const currentSettings = clientOnlyCollaboration.getSettings()
    setSettings(currentSettings)
  }, [])

  const handleSettingChange = async (key: keyof CollaborationSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await clientOnlyCollaboration.saveSettings({ [key]: value })
  }

  const handlePresenceTimeoutChange = (value: number[]) => {
    handleSettingChange("presenceTimeout", value[0] * 1000) // 초를 밀리초로 변환
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <Settings className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">협업 설정</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* 표시 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              표시 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showOtherUsers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                다른 사용자 표시
              </Label>
              <Switch
                id="showOtherUsers"
                checked={settings.showOtherUsers}
                onCheckedChange={(checked) => handleSettingChange("showOtherUsers", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCursors" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                커서 위치 표시
              </Label>
              <Switch
                id="showCursors"
                checked={settings.showCursors}
                onCheckedChange={(checked) => handleSettingChange("showCursors", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showEditing" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                편집 상태 표시
              </Label>
              <Switch
                id="showEditing"
                checked={settings.showEditing}
                onCheckedChange={(checked) => handleSettingChange("showEditing", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showUserNames" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                사용자 이름 표시
              </Label>
              <Switch
                id="showUserNames"
                checked={settings.showUserNames}
                onCheckedChange={(checked) => handleSettingChange("showUserNames", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 실시간 동기화 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              실시간 동기화
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableRealtimeSync">실시간 동기화 사용</Label>
              <Switch
                id="enableRealtimeSync"
                checked={settings.enableRealtimeSync}
                onCheckedChange={(checked) => handleSettingChange("enableRealtimeSync", checked)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">프레즌스 타임아웃</Label>
              <div className="px-3">
                <Slider
                  value={[settings.presenceTimeout / 1000]}
                  onValueChange={handlePresenceTimeoutChange}
                  max={120}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10초</span>
                  <span>{settings.presenceTimeout / 1000}초</span>
                  <span>120초</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">사용자가 비활성 상태로 간주되기까지의 시간입니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 충돌 해결 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">충돌 해결 방식</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.conflictResolution}
              onValueChange={(value) => handleSettingChange("conflictResolution", value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex-1">
                  <div>
                    <div className="font-medium">수동 해결</div>
                    <div className="text-sm text-muted-foreground">충돌 발생 시 사용자가 직접 선택</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="flex-1">
                  <div>
                    <div className="font-medium">자동 해결</div>
                    <div className="text-sm text-muted-foreground">미리 정의된 규칙에 따라 자동 해결</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last-writer-wins" id="last-writer-wins" />
                <Label htmlFor="last-writer-wins" className="flex-1">
                  <div>
                    <div className="font-medium">최종 작성자 우선</div>
                    <div className="text-sm text-muted-foreground">가장 마지막에 수정한 내용을 우선</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 협업 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">현재 협업 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>온라인 사용자:</span>
              <span className="font-medium">{clientOnlyCollaboration.getActiveUsers().length}명</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>활성 편집 세션:</span>
              <span className="font-medium">{clientOnlyCollaboration.getEditingSessions().length}개</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>실시간 동기화:</span>
              <span className={`font-medium ${settings.enableRealtimeSync ? "text-green-600" : "text-red-600"}`}>
                {settings.enableRealtimeSync ? "활성" : "비활성"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CollaborationSettings(props: CollaborationSettingsProps) {
  return <CollaborationSettingsContent {...props} />
}
