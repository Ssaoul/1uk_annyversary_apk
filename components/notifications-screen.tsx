"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, Clock, Settings, Trash2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAnniversaries } from "@/hooks/use-anniversaries"
import { SimpleAuthService } from "@/lib/simple-auth"

interface NotificationItem {
  id: string
  title: string
  message: string
  date: string
  time: string
  type: "upcoming" | "today" | "past"
  anniversaryId?: string
}

export default function NotificationsScreen() {
  const { anniversaries } = useAnniversaries()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const currentUser = SimpleAuthService.getCurrentUser()

  useEffect(() => {
    generateNotifications()
  }, [anniversaries])

  const generateNotifications = () => {
    const today = new Date()
    const generatedNotifications: NotificationItem[] = []

    // 사용자의 기념일만 처리 (더미 데이터 제외)
    anniversaries.forEach((anniversary) => {
      const anniversaryDate = new Date(anniversary.date)
      const currentYear = today.getFullYear()

      // 올해 기념일 날짜 계산
      let thisYearDate = new Date(currentYear, anniversaryDate.getMonth(), anniversaryDate.getDate())

      // 이미 지났으면 내년으로
      if (thisYearDate < today) {
        thisYearDate = new Date(currentYear + 1, anniversaryDate.getMonth(), anniversaryDate.getDate())
      }

      const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 알림 설정에 따라 알림 생성
      if (anniversary.notification_enabled) {
        // 당일 알림
        if (anniversary.notify_same_day && daysUntil === 0) {
          generatedNotifications.push({
            id: `${anniversary.id}-today`,
            title: "오늘은 기념일입니다! 🎉",
            message: `${anniversary.contact_name || "소중한 분"}의 ${anniversary.name}`,
            date: today.toISOString().split("T")[0],
            time: "09:00",
            type: "today",
            anniversaryId: anniversary.id,
          })
        }

        // 1일 전 알림
        if (anniversary.notify_one_day_before && daysUntil === 1) {
          generatedNotifications.push({
            id: `${anniversary.id}-1day`,
            title: "내일은 기념일입니다 📅",
            message: `${anniversary.contact_name || "소중한 분"}의 ${anniversary.name}이 내일입니다`,
            date: today.toISOString().split("T")[0],
            time: "18:00",
            type: "upcoming",
            anniversaryId: anniversary.id,
          })
        }

        // 3일 전 알림
        if (anniversary.notify_three_days_before && daysUntil === 3) {
          generatedNotifications.push({
            id: `${anniversary.id}-3days`,
            title: "기념일이 3일 후입니다 ⏰",
            message: `${anniversary.contact_name || "소중한 분"}의 ${anniversary.name}`,
            date: today.toISOString().split("T")[0],
            time: "10:00",
            type: "upcoming",
            anniversaryId: anniversary.id,
          })
        }

        // 1주일 전 알림
        if (anniversary.notify_one_week_before && daysUntil === 7) {
          generatedNotifications.push({
            id: `${anniversary.id}-1week`,
            title: "기념일이 일주일 후입니다 📝",
            message: `${anniversary.contact_name || "소중한 분"}의 ${anniversary.name} 준비하세요`,
            date: today.toISOString().split("T")[0],
            time: "09:00",
            type: "upcoming",
            anniversaryId: anniversary.id,
          })
        }
      }
    })

    setNotifications(generatedNotifications)
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "today":
        return "🎉"
      case "upcoming":
        return "📅"
      default:
        return "🔔"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "today":
        return "border-red-200 bg-red-50"
      case "upcoming":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Bell className="h-6 w-6" />
          <h1 className="text-xl font-semibold">알림</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-20">
        {/* 알림 설정 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">알림 활성화</Label>
              <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound">알림 소리</Label>
              <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* 최근 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 알림</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">알림이 없습니다</p>
                <p className="text-sm">
                  {anniversaries.length === 0
                    ? "기념일을 추가하면 알림을 받을 수 있습니다"
                    : "다가오는 기념일 알림이 여기에 표시됩니다"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{notification.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 알림 권한 안내 */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-green-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">브라우저 알림</p>
                <p className="text-xs text-muted-foreground">브라우저에서 알림 권한을 허용해주세요</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission()
                  }
                }}
              >
                권한 요청
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
