"use client"

import { useState, useEffect } from "react"
import { Calendar, Settings, Check, X, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { GoogleCalendarIntegration } from "@/lib/google-calendar-integration"

interface CalendarSyncSettingsProps {
  anniversaryData: any
  onClose: () => void
}

export default function CalendarSyncSettings({ anniversaryData, onClose }: CalendarSyncSettingsProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState("09:00")
  const [calendarName, setCalendarName] = useState("기념일")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const authStatus = await GoogleCalendarIntegration.checkAuthStatus()
      setIsConnected(authStatus.isAuthenticated)
      setUserEmail(authStatus.userEmail)
    } catch (error) {
      console.error("Auth status check failed:", error)
    }
  }

  const handleGoogleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await GoogleCalendarIntegration.authenticate()

      if (result.success) {
        setIsConnected(true)
        setUserEmail(result.userEmail)
        toast.success(`구글 캘린더에 연결되었습니다! (${result.userEmail})`)
      } else {
        throw new Error(result.error || "인증에 실패했습니다")
      }
    } catch (error: any) {
      console.error("Google Calendar 연결 실패:", error)
      setError(error.message)
      toast.error("구글 캘린더 연결에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncToCalendar = async () => {
    if (!isConnected) {
      toast.error("먼저 구글 캘린더에 연결해주세요")
      return
    }

    if (!anniversaryData.name || !anniversaryData.date) {
      toast.error("기념일 이름과 날짜를 입력해주세요")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const eventData = {
        summary: anniversaryData.name,
        description: anniversaryData.memo || "",
        date: anniversaryData.date,
        isRecurring: anniversaryData.repeat_type === "yearly",
        reminderMinutes:
          reminderTime === "09:00" ? 540 : reminderTime === "12:00" ? 720 : reminderTime === "18:00" ? 1080 : 1260,
      }

      const result = await GoogleCalendarIntegration.createEvent(eventData)

      if (result.success) {
        toast.success(`"${anniversaryData.name}" 기념일이 구글 캘린더에 추가되었습니다!`)
        onClose()
      } else {
        throw new Error(result.error || "캘린더 이벤트 생성에 실패했습니다")
      }
    } catch (error: any) {
      console.error("캘린더 동기화 실패:", error)
      setError(error.message)
      toast.error("캘린더 동기화에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await GoogleCalendarIntegration.signOut()
      setIsConnected(false)
      setUserEmail(null)
      toast.success("구글 캘린더 연결이 해제되었습니다")
    } catch (error) {
      console.error("Sign out failed:", error)
      toast.error("연결 해제에 실패했습니다")
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            구글 캘린더 연동
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 에러 표시 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 연결 상태 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`} />
                <div>
                  <p className="font-medium">구글 캘린더</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? `연결됨 (${userEmail})` : "연결되지 않음"}
                  </p>
                </div>
              </div>
              {isConnected ? (
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  연결 해제
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleGoogleConnect}
                  disabled={loading}
                  className="bg-[#4285f4] hover:bg-[#3367d6]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      연결
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* API 지원 안내 */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p>실제 Google Calendar API를 사용합니다.</p>
                <p className="text-xs mt-1">HTTPS 환경에서만 정상 작동하며, 구글 계정 로그인이 필요합니다.</p>
              </AlertDescription>
            </Alert>
          </div>

          {/* 동기화 설정 */}
          {isConnected && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                동기화 설정
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-enabled">자동 동기화</Label>
                  <Switch id="sync-enabled" checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>알림 시간</Label>
                  <Select value={reminderTime} onValueChange={setReminderTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">오전 9:00</SelectItem>
                      <SelectItem value="12:00">오후 12:00</SelectItem>
                      <SelectItem value="18:00">오후 6:00</SelectItem>
                      <SelectItem value="21:00">오후 9:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>캘린더 이름</Label>
                  <Select value={calendarName} onValueChange={setCalendarName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="기념일">기념일</SelectItem>
                      <SelectItem value="생일">생일</SelectItem>
                      <SelectItem value="개인">개인</SelectItem>
                      <SelectItem value="가족">가족</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 현재 기념일 정보 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">동기화할 기념일</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">이름:</span> {anniversaryData.name || "미입력"}
              </p>
              <p>
                <span className="font-medium">날짜:</span> {anniversaryData.date || "미입력"}
              </p>
              <p>
                <span className="font-medium">구분:</span> {anniversaryData.category || "생일"}
              </p>
              <p>
                <span className="font-medium">반복:</span>{" "}
                {anniversaryData.repeat_type === "yearly" ? "매년" : "일회성"}
              </p>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button
              className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90"
              onClick={handleSyncToCalendar}
              disabled={loading || !anniversaryData.name || !anniversaryData.date || !isConnected}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {loading ? "동기화 중..." : "캘린더에 추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
