"use client"

import { useState, useEffect } from "react"
import { Bell, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function NotificationsScreenSimple() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    reminderDays: 7,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem("notification-settings")
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error)
    }
  }, [])

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("notification-settings", JSON.stringify(newSettings))
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push">푸시 알림</Label>
              <Switch
                id="push"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email">이메일 알림</Label>
              <Switch
                id="email"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">아직 알림이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
