"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CalendarScreenSimple() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [anniversaries, setAnniversaries] = useState<any[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("anniversaries")
      if (saved) {
        setAnniversaries(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load anniversaries:", error)
    }
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // 빈 칸들
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }

    // 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const hasAnniversary = anniversaries.some((a) => a.date === dateStr)

      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center text-sm relative ${
            hasAnniversary ? "bg-[#3F51B5] text-white rounded-full" : "hover:bg-gray-100 rounded"
          }`}
        >
          {day}
          {hasAnniversary && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
        </div>,
      )
    }

    return days
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            달력
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-4">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </CardContent>
        </Card>

        {/* 이번 달 기념일 목록 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">이번 달 기념일</h3>
          {anniversaries
            .filter((a) => {
              const anniversaryDate = new Date(a.date)
              return (
                anniversaryDate.getMonth() === currentDate.getMonth() &&
                anniversaryDate.getFullYear() === currentDate.getFullYear()
              )
            })
            .map((anniversary) => (
              <Card key={anniversary.id} className="mb-2">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{anniversary.name}</h4>
                      <p className="text-sm text-muted-foreground">{anniversary.person}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(anniversary.date).getDate()}일</div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
