"use client"

import { useState, useEffect } from "react"
import { Plus, Heart, Calendar, Gift, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Anniversary {
  id: string
  name: string
  date: string
  type: string
  person: string
  daysUntil: number
}

interface MainScreenSimpleProps {
  onEditAnniversary?: (anniversary: Anniversary) => void
}

export default function MainScreenSimple({ onEditAnniversary }: MainScreenSimpleProps) {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // 로컬 스토리지에서 기념일 데이터 로드
    const loadAnniversaries = () => {
      try {
        const saved = localStorage.getItem("anniversaries")
        if (saved) {
          const data = JSON.parse(saved)
          setAnniversaries(data)
        } else {
          // 샘플 데이터
          const sampleData = [
            {
              id: "1",
              name: "결혼기념일",
              date: "2024-06-15",
              type: "anniversary",
              person: "배우자",
              daysUntil: 45,
            },
            {
              id: "2",
              name: "생일",
              date: "2024-05-20",
              type: "birthday",
              person: "엄마",
              daysUntil: 20,
            },
          ]
          setAnniversaries(sampleData)
          localStorage.setItem("anniversaries", JSON.stringify(sampleData))
        }
      } catch (error) {
        console.error("Failed to load anniversaries:", error)
      }
    }

    loadAnniversaries()
  }, [])

  const filteredAnniversaries = anniversaries.filter(
    (anniversary) =>
      anniversary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anniversary.person.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "birthday":
        return <Gift className="h-4 w-4" />
      case "anniversary":
        return <Heart className="h-4 w-4" />
      case "meeting":
        return <Users className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "birthday":
        return "text-pink-600"
      case "anniversary":
        return "text-red-600"
      case "meeting":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4">기념일 관리</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              placeholder="기념일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
            />
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#3F51B5]">{anniversaries.length}</div>
              <div className="text-sm text-muted-foreground">총 기념일</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {anniversaries.filter((a) => a.daysUntil <= 7).length}
              </div>
              <div className="text-sm text-muted-foreground">이번 주</div>
            </CardContent>
          </Card>
        </div>

        {/* Anniversaries List */}
        <div className="space-y-3">
          {filteredAnniversaries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "검색 결과가 없습니다." : "등록된 기념일이 없습니다."}
                </p>
                <Button className="mt-4" onClick={() => onEditAnniversary?.(null)}>
                  <Plus className="h-4 w-4 mr-2" />첫 기념일 추가하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAnniversaries.map((anniversary) => (
              <Card
                key={anniversary.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onEditAnniversary?.(anniversary)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-gray-100 ${getTypeColor(anniversary.type)}`}>
                        {getTypeIcon(anniversary.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{anniversary.name}</h3>
                        <p className="text-sm text-muted-foreground">{anniversary.person}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {anniversary.daysUntil === 0 ? "오늘!" : `${anniversary.daysUntil}일 후`}
                      </div>
                      <div className="text-xs text-muted-foreground">{anniversary.date}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => onEditAnniversary?.(null)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
