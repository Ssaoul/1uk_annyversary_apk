"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bell, Calendar, Download, Info, Shield, Upload, Loader2, LogOut, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { NotificationService } from "@/lib/notification-service"
import type { NotificationSettings } from "@/types/anniversary"
import { toast } from "sonner"
import PrivacyPolicy from "./privacy-policy"
import TermsOfService from "./terms-of-service"
import OpenSourceLicenses from "./open-source-licenses"
import { AuthService } from "@/lib/auth-service"

interface SettingsScreenProps {
  onBack?: () => void
  onNavigateToOfficialHolidays?: () => void
  onLogout?: () => void
  user?: any
}

// Use the same demo UUID that we created in the database
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

export default function SettingsScreen({ onBack, onNavigateToOfficialHolidays, onLogout, user }: SettingsScreenProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)
  const [showOpenSourceLicenses, setShowOpenSourceLicenses] = useState(false)

  useEffect(() => {
    loadNotificationSettings()
    checkNotificationPermission()
  }, [])

  const checkNotificationPermission = async () => {
    const granted = await NotificationService.requestNotificationPermission()
    setPermissionGranted(granted)
  }

  const loadNotificationSettings = async () => {
    try {
      setLoading(true)
      let userSettings = await NotificationService.getNotificationSettings(DEMO_USER_ID)

      if (!userSettings) {
        // 기본 설정 생성
        userSettings = await NotificationService.saveNotificationSettings(DEMO_USER_ID, {
          notifications_enabled: true,
          same_day: true,
          one_day_before: true,
          three_days_before: false,
          five_days_before: false,
          one_week_before: false,
        })
      }

      if (userSettings) {
        setSettings(userSettings)
      } else {
        // 설정 생성에 실패한 경우 기본값 사용
        setSettings({
          id: "",
          user_id: DEMO_USER_ID,
          notifications_enabled: true,
          same_day: true,
          one_day_before: true,
          three_days_before: false,
          five_days_before: false,
          one_week_before: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        toast.warning("알림 설정을 기본값으로 설정했습니다")
      }
    } catch (error) {
      console.error("Error loading notification settings:", error)
      toast.error("알림 설정을 불러오는데 실패했습니다")

      // 에러 발생 시 기본값 설정
      setSettings({
        id: "",
        user_id: DEMO_USER_ID,
        notifications_enabled: true,
        same_day: true,
        one_day_before: true,
        three_days_before: false,
        five_days_before: false,
        one_week_before: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      setSaving(true)
      const updatedSettings = await NotificationService.saveNotificationSettings(DEMO_USER_ID, {
        ...settings,
        ...newSettings,
      })

      if (updatedSettings) {
        setSettings(updatedSettings)
        toast.success("알림 설정이 저장되었습니다")
      } else {
        // 저장 실패 시 로컬 상태만 업데이트
        setSettings({ ...settings, ...newSettings })
        toast.warning("설정이 임시로 저장되었습니다")
      }
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast.error("알림 설정 저장에 실패했습니다")

      // 에러 발생 시에도 로컬 상태는 업데이트
      setSettings({ ...settings, ...newSettings })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      const granted = await NotificationService.requestNotificationPermission()
      if (!granted) {
        toast.error("알림 권한이 필요합니다")
        return
      }
      setPermissionGranted(true)
    }

    await saveNotificationSettings({ notifications_enabled: enabled })
  }

  const handleNotificationDayChange = async (day: string, checked: boolean) => {
    await saveNotificationSettings({ [day]: checked })
  }

  const handleLogout = async () => {
    try {
      await AuthService.signOut()
      toast.success("로그아웃되었습니다")
      onLogout?.()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("로그아웃 중 오류가 발생했습니다")
    }
  }

  // 약관 화면들이 표시되는 경우
  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
  }

  if (showTermsOfService) {
    return <TermsOfService onBack={() => setShowTermsOfService(false)} />
  }

  if (showOpenSourceLicenses) {
    return <OpenSourceLicenses onBack={() => setShowOpenSourceLicenses(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>설정을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">설정</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* 사용자 정보 */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#3F51B5] rounded-full flex items-center justify-center text-white text-lg font-medium">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-medium">{user.name || "사용자"}</p>
                  <p className="text-sm text-muted-foreground">{user.email || "이메일 없음"}</p>
                </div>
              </div>
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 전체 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              전체 알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 권한 상태 */}
            {!permissionGranted && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">알림을 받으려면 브라우저에서 알림 권한을 허용해주세요.</p>
                <Button size="sm" className="mt-2" onClick={checkNotificationPermission}>
                  권한 요청
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">전체 알림 사용</Label>
              <Switch
                id="notifications"
                checked={settings?.notifications_enabled || false}
                onCheckedChange={handleNotificationToggle}
                disabled={saving}
              />
            </div>

            {settings?.notifications_enabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">기본 알림 일정 (개별 기념일에서 재설정 가능)</Label>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameDay"
                        checked={settings.same_day}
                        onCheckedChange={(checked) => handleNotificationDayChange("same_day", checked as boolean)}
                        disabled={saving}
                      />
                      <Label htmlFor="sameDay" className="text-sm">
                        당일
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="oneDay"
                        checked={settings.one_day_before}
                        onCheckedChange={(checked) => handleNotificationDayChange("one_day_before", checked as boolean)}
                        disabled={saving}
                      />
                      <Label htmlFor="oneDay" className="text-sm">
                        1일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="threeDays"
                        checked={settings.three_days_before}
                        onCheckedChange={(checked) =>
                          handleNotificationDayChange("three_days_before", checked as boolean)
                        }
                        disabled={saving}
                      />
                      <Label htmlFor="threeDays" className="text-sm">
                        3일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fiveDays"
                        checked={settings.five_days_before}
                        onCheckedChange={(checked) =>
                          handleNotificationDayChange("five_days_before", checked as boolean)
                        }
                        disabled={saving}
                      />
                      <Label htmlFor="fiveDays" className="text-sm">
                        5일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="oneWeek"
                        checked={settings.one_week_before}
                        onCheckedChange={(checked) =>
                          handleNotificationDayChange("one_week_before", checked as boolean)
                        }
                        disabled={saving}
                      />
                      <Label htmlFor="oneWeek" className="text-sm">
                        1주일 전
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기념일 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              기념일 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" onClick={onNavigateToOfficialHolidays}>
              공식 기념일 관리
            </Button>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              데이터 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Upload className="h-4 w-4 mr-2" />
              백업하기
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              복원하기
            </Button>
          </CardContent>
        </Card>

        {/* 앱 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />앱 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">버전</span>
              <span className="text-sm">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">개발자</span>
              <span className="text-sm">기념일 앱 팀</span>
            </div>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto"
              onClick={() => setShowPrivacyPolicy(true)}
            >
              <span className="text-sm">개인정보 처리방침</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto"
              onClick={() => setShowTermsOfService(true)}
            >
              <span className="text-sm">서비스 이용약관</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto"
              onClick={() => setShowOpenSourceLicenses(true)}
            >
              <span className="text-sm">오픈소스 라이선스</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
