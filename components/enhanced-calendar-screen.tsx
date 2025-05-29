"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, Star, Clock, Repeat, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnniversaries } from "@/hooks/use-anniversaries"
import { AnniversaryService } from "@/lib/anniversary-service"

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"]
const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

const getRepeatIcon = (repeatType: string) => {
  switch (repeatType) {
    case "once":
      return <Clock className="h-3 w-3" />
    case "yearly":
      return <Repeat className="h-3 w-3" />
    case "cumulative":
      return <RotateCcw className="h-3 w-3" />
    default:
      return null
  }
}

const getRepeatColor = (repeatType: string) => {
  switch (repeatType) {
    case "once":
      return "bg-orange-100 text-orange-800"
    case "yearly":
      return "bg-blue-100 text-blue-800"
    case "cumulative":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function EnhancedCalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("calendar")
  const { anniversaries } = useAnniversaries()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 이번 달의 첫 번째 날과 마지막 날
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 달력 시작 날짜 (이전 달의 마지막 주 포함)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  // 달력 끝 날짜 (다음 달의 첫 주 포함)
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

  // 달력에 표시할 모든 날짜들
  const calendarDays = []
  const current = new Date(startDate)

  while (current <= endDate) {
    calendarDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getAnniversariesForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return anniversaries.filter((anniversary) => {
      if (anniversary.repeat_type === "once") {
        return anniversary.date === dateString
      } else if (anniversary.repeat_type === "yearly") {
        const annDate = new Date(anniversary.date)
        return annDate.getMonth() === date.getMonth() && annDate.getDate() === date.getDate()
      }
      return false
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  // 다가오는 기념일 (일회 한정, 매년 반복)
  const upcomingAnniversaries = anniversaries
    .filter((ann) => ann.repeat_type !== "cumulative")
    .map((anniversary) => ({
      ...anniversary,
      daysLeft: AnniversaryService.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
    }))
    .filter((anniversary) => anniversary.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // 누적 기념일
  const cumulativeAnniversaries = anniversaries
    .filter((ann) => ann.repeat_type === "cumulative")
    .map((anniversary) => ({
      ...anniversary,
      daysLeft: AnniversaryService.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
    }))
    .sort((a, b) => Math.abs(a.daysLeft) - Math.abs(b.daysLeft))

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            <h1 className="text-xl font-semibold">캘린더</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">달력</TabsTrigger>
            <TabsTrigger value="upcoming">다가오는 기념일</TabsTrigger>
            <TabsTrigger value="cumulative">누적 기념일</TabsTrigger>
          </TabsList>

          {/* 다가오는 기념일 탭 */}
          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcomingAnniversaries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">다가오는 기념일이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              upcomingAnniversaries.map((anniversary) => (
                <Card key={anniversary.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          {getRepeatIcon(anniversary.repeat_type)}
                          {anniversary.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{anniversary.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {anniversary.contact_name && `${anniversary.contact_name} • `}
                            {anniversary.date}
                            {anniversary.is_lunar && " (음력)"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={anniversary.daysLeft <= 7 ? "destructive" : "secondary"} className="text-xs">
                          D-{anniversary.daysLeft}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getRepeatColor(anniversary.repeat_type)}`}>
                          {anniversary.repeat_type === "once"
                            ? "일회"
                            : anniversary.repeat_type === "yearly"
                              ? "매년"
                              : "누적"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 달력 탭 */}
          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {year}년 {months[month]}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day, index) => (
                    <div
                      key={day}
                      className={`text-center text-sm font-medium py-2 ${
                        index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 달력 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const dayAnniversaries = getAnniversariesForDate(date)
                    const isCurrentMonthDate = isCurrentMonth(date)
                    const isTodayDate = isToday(date)

                    return (
                      <div
                        key={index}
                        className={`relative min-h-[40px] p-1 text-center text-sm border rounded ${
                          !isCurrentMonthDate
                            ? "text-muted-foreground bg-muted/30"
                            : isTodayDate
                              ? "bg-[#3F51B5] text-white font-semibold"
                              : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-medium">{date.getDate()}</div>
                        {dayAnniversaries.length > 0 && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {dayAnniversaries.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1 h-1 bg-[#FF4081] rounded-full"></div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 이번 달 기념일 목록 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">이번 달 기념일</h3>
                <div className="space-y-2">
                  {anniversaries
                    .filter((anniversary) => {
                      if (anniversary.repeat_type === "yearly") {
                        const anniversaryDate = new Date(anniversary.date)
                        return anniversaryDate.getMonth() === month
                      } else if (anniversary.repeat_type === "once") {
                        const anniversaryDate = new Date(anniversary.date)
                        return anniversaryDate.getMonth() === month && anniversaryDate.getFullYear() === year
                      }
                      return false
                    })
                    .map((anniversary, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          {getRepeatIcon(anniversary.repeat_type)}
                          <div>
                            <div className="font-medium">{anniversary.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {anniversary.contact_name && `${anniversary.contact_name} • `}
                              {new Date(anniversary.date).getDate()}일
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {anniversary.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                          <Badge variant="outline" className={`text-xs ${getRepeatColor(anniversary.repeat_type)}`}>
                            {anniversary.repeat_type === "once"
                              ? "일회"
                              : anniversary.repeat_type === "yearly"
                                ? "매년"
                                : "누적"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 누적 기념일 탭 */}
          <TabsContent value="cumulative" className="space-y-3 mt-4">
            {cumulativeAnniversaries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">누적 기념일이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              cumulativeAnniversaries.map((anniversary) => (
                <Card key={anniversary.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <RotateCcw className="h-4 w-4 text-purple-600" />
                          {anniversary.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{anniversary.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {anniversary.contact_name && `${anniversary.contact_name} • `}
                            {anniversary.date}
                            {anniversary.is_lunar && " (음력)"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={anniversary.daysLeft >= 0 ? "default" : "secondary"} className="text-xs">
                          {anniversary.daysLeft >= 0 ? `+${anniversary.daysLeft}` : anniversary.daysLeft}일
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
