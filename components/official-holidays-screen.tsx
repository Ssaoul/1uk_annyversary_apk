"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AnniversaryService } from "@/lib/anniversary-service"
import type { OfficialHoliday, UserOfficialHoliday } from "@/types/anniversary"
import { toast } from "sonner"

interface OfficialHolidaysScreenProps {
  onBack?: () => void
}

// Use the same demo UUID that we created in the database
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

export default function OfficialHolidaysScreen({ onBack }: OfficialHolidaysScreenProps) {
  const [holidays, setHolidays] = useState<OfficialHoliday[]>([])
  const [userHolidays, setUserHolidays] = useState<UserOfficialHoliday[]>([])
  const [loading, setLoading] = useState(true)
  const [contactInputs, setContactInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [officialHolidays, userOfficialHolidays] = await Promise.all([
        AnniversaryService.getOfficialHolidays(),
        AnniversaryService.getUserOfficialHolidays(DEMO_USER_ID),
      ])

      setHolidays(officialHolidays)
      setUserHolidays(userOfficialHolidays)

      // 연락처 입력 필드 초기화
      const contacts: Record<string, string> = {}
      userOfficialHolidays.forEach((uh) => {
        if (uh.contact_name) {
          contacts[uh.holiday_id] = uh.contact_name
        }
      })
      setContactInputs(contacts)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("데이터를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const isHolidayEnabled = (holidayId: string): boolean => {
    return userHolidays.some((uh) => uh.holiday_id === holidayId && uh.is_enabled)
  }

  const getContactName = (holidayId: string): string => {
    const userHoliday = userHolidays.find((uh) => uh.holiday_id === holidayId)
    return userHoliday?.contact_name || ""
  }

  const handleHolidayToggle = async (holidayId: string, enabled: boolean) => {
    try {
      const contactName = contactInputs[holidayId] || ""
      const success = await AnniversaryService.setUserOfficialHoliday(DEMO_USER_ID, holidayId, contactName, enabled)

      if (success) {
        await loadData() // 데이터 새로고침
        toast.success(enabled ? "공식 기념일이 추가되었습니다" : "공식 기념일이 제거되었습니다")
      } else {
        toast.error("설정 변경에 실패했습니다")
      }
    } catch (error) {
      console.error("Error toggling holiday:", error)
      toast.error("설정 변경 중 오류가 발생했습니다")
    }
  }

  const handleContactChange = (holidayId: string, contactName: string) => {
    setContactInputs((prev) => ({
      ...prev,
      [holidayId]: contactName,
    }))
  }

  const saveContact = async (holidayId: string) => {
    try {
      const contactName = contactInputs[holidayId] || ""
      const isEnabled = isHolidayEnabled(holidayId)

      const success = await AnniversaryService.setUserOfficialHoliday(DEMO_USER_ID, holidayId, contactName, isEnabled)

      if (success) {
        await loadData()
        toast.success("연락처가 저장되었습니다")
      } else {
        toast.error("연락처 저장에 실패했습니다")
      }
    } catch (error) {
      console.error("Error saving contact:", error)
      toast.error("연락처 저장 중 오류가 발생했습니다")
    }
  }

  const formatHolidayDate = (holiday: OfficialHoliday): string => {
    if (holiday.day) {
      return `${holiday.month}월 ${holiday.day}일 (${holiday.date_type === "solar" ? "양력" : "음력"})`
    } else if (holiday.week_of_month && holiday.day_of_week) {
      const weekNames = ["", "첫째", "둘째", "셋째", "넷째", "다섯째"]
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
      return `${holiday.month}월 ${weekNames[holiday.week_of_month]} ${dayNames[holiday.day_of_week]}요일`
    }
    return `${holiday.month}월`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>공식 기념일을 불러오는 중...</span>
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
          <h1 className="text-xl font-semibold">공식 기념일 관리</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              대한민국 공식 기념일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              원하는 공식 기념일을 선택하고 연락처를 설정할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {holidays.map((holiday) => {
            const enabled = isHolidayEnabled(holiday.id)
            const contactName = contactInputs[holiday.id] || getContactName(holiday.id)

            return (
              <Card key={holiday.id} className={`transition-all ${enabled ? "border-[#3F51B5]" : ""}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* 기념일 정보 및 토글 */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{holiday.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatHolidayDate(holiday)}</p>
                        {holiday.description && (
                          <p className="text-xs text-muted-foreground mt-1">{holiday.description}</p>
                        )}
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handleHolidayToggle(holiday.id, checked)}
                      />
                    </div>

                    {/* 연락처 설정 (활성화된 경우만) */}
                    {enabled && (
                      <div className="border-t pt-3 space-y-2">
                        <Label htmlFor={`contact-${holiday.id}`} className="text-sm">
                          연결할 연락처 (선택사항)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`contact-${holiday.id}`}
                            placeholder="예: 어머니, 아버지"
                            value={contactName}
                            onChange={(e) => handleContactChange(holiday.id, e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" variant="outline" onClick={() => saveContact(holiday.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 활성화된 기념일 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">활성화된 기념일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userHolidays.filter((uh) => uh.is_enabled).length === 0 ? (
                <p className="text-sm text-muted-foreground">활성화된 공식 기념일이 없습니다.</p>
              ) : (
                userHolidays
                  .filter((uh) => uh.is_enabled)
                  .map((userHoliday) => (
                    <div key={userHoliday.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-sm font-medium">{userHoliday.holiday.name}</span>
                      {userHoliday.contact_name && (
                        <Badge variant="outline" className="text-xs">
                          {userHoliday.contact_name}
                        </Badge>
                      )}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
