"use client"

import { useState, useEffect } from "react"
import { Bell, Settings, Clock, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { NotificationService } from "@/lib/notification-service"
import type { NotificationSettings } from "@/types/anniversary"
import { toast } from "sonner"

// Use the same demo UUID that we created in the database
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

const mockNotifications = [
  {
    id: 1,
    title: "어머니 생신",
    message: "내일이 어머니 생신입니다.",
    time: "1시간 전",
    type: "upcoming",
    isRead: false,
    daysLeft: 1,
  },
  {
    id: 2,
    title: "결혼기념일",
    message: "3일 후 결혼기념일입니다.",
    time: "3시간 전",
    type: "reminder",
    isRead: false,
    daysLeft: 3,
  },
  {
    id: 3,
    title: "친구 생일",
    message: "김철수님의 생일을 축하해주세요!",
    time: "어제",
    type: "birthday",
    isRead: true,
    daysLeft: 0,
  },
]

export default function EnhancedNotificationsScreen() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    loadNotificationSettings()
    checkNotificationPermission()
    checkPushSubscription()
  }, [])

  const checkNotificationPermission = async () => {
    const granted = await NotificationService.requestNotificationPermission()
    setPermissionGranted(granted)
  }

  const checkPushSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setPushSubscribed(!!subscription)
      } catch (error) {
        console.error("Error checking push subscription:", error)
      }
    }
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

  const handlePushSubscriptionToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const subscription = await NotificationService.subscribeToPush()
        setPushSubscribed(!!subscription)
        if (subscription) {
          toast.success("푸시 알림이 활성화되었습니다")
        } else {
          toast.error("푸시 알림 활성화에 실패했습니다")
        }
      } else {
        const success = await NotificationService.unsubscribeFromPush()
        setPushSubscribed(!success)
        if (success) {
          toast.success("푸시 알림이 비활성화되었습니다")
        } else {
          toast.error("푸시 알림 비활성화에 실패했습니다")
        }
      }
    } catch (error) {
      console.error("Error toggling push subscription:", error)
      toast.error("푸시 알림 설정 중 오류가 발생했습니다")
    }
  }

  const sendTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification()
      toast.success("테스트 알림을 전송했습니다")
    } catch (error) {
      console.error("Error sending test notification:", error)
      toast.error("테스트 알림 전송에 실패했습니다")
    }
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>알림 설정을 불러오는 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <h1 className="text-xl font-semibold">알림</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-[#FF4081] text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={markAllAsRead}>
            모두 읽음
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              알림 설정
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

            {/* 푸시 알림 상태 표시 */}
            {permissionGranted && (
              <div
                className={`p-3 border rounded-lg ${pushSubscribed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">푸시 알림 상태</p>
                    <p className="text-xs text-muted-foreground">
                      {pushSubscribed ? "활성화됨 - 백그라운드에서도 알림을 받을 수 있습니다" : "비활성화됨"}
                    </p>
                  </div>
                  <Switch checked={pushSubscribed} onCheckedChange={handlePushSubscriptionToggle} disabled={saving} />
                </div>
                {pushSubscribed && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={sendTestNotification}>
                    테스트 알림 전송
                  </Button>
                )}
              </div>
            )}

            {/* 기존 전체 알림 설정 */}
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
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">알림 일정</Label>
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

        {/* 알림 목록 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">최근 알림</h3>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md cursor-pointer ${
                !notification.isRead ? "border-l-4 border-l-[#FF4081] bg-blue-50/50 dark:bg-blue-950/20" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === "upcoming" && <Clock className="h-5 w-5 text-orange-500" />}
                    {notification.type === "reminder" && <Bell className="h-5 w-5 text-blue-500" />}
                    {notification.type === "birthday" && <Star className="h-5 w-5 text-pink-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`font-medium truncate ${
                          !notification.isRead ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[#FF4081] rounded-full flex-shrink-0 ml-2"></div>
                      )}
                    </div>

                    <p className={`text-sm mb-2 ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{notification.time}</span>

                      {notification.daysLeft !== undefined && (
                        <Badge variant={notification.daysLeft <= 1 ? "destructive" : "secondary"} className="text-xs">
                          {notification.daysLeft === 0 ? "오늘" : `D-${notification.daysLeft}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빈 상태 */}
        {notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">알림이 없습니다</h3>
              <p className="text-sm text-muted-foreground">새로운 알림이 있으면 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
