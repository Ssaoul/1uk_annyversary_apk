"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"]
const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

// 샘플 기념일 데이터
const anniversaries = [
  { date: "2024-02-15", name: "어머니 생신", type: "birthday" },
  { date: "2024-02-20", name: "결혼기념일", type: "anniversary" },
  { date: "2024-02-25", name: "친구 생일", type: "birthday" },
  { date: "2024-03-10", name: "아버지 생신", type: "birthday" },
]

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())

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
    return anniversaries.filter((anniversary) => anniversary.date === dateString)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

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
        {/* 월 네비게이션 */}
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
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-[#FF4081] rounded-full"></div>
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
                  const anniversaryDate = new Date(anniversary.date)
                  return anniversaryDate.getMonth() === month && anniversaryDate.getFullYear() === year
                })
                .map((anniversary, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <div className="font-medium">{anniversary.name}</div>
                      <div className="text-sm text-muted-foreground">{new Date(anniversary.date).getDate()}일</div>
                    </div>
                    <Badge variant={anniversary.type === "birthday" ? "secondary" : "outline"}>
                      {anniversary.type === "birthday" ? "생일" : "기념일"}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
