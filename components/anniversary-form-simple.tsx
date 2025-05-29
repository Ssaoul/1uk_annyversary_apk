"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Trash2, Calendar, User, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AnniversaryFormSimpleProps {
  onBack?: () => void
  onSave?: () => void
  onDelete?: () => void
  initialData?: any
}

export default function AnniversaryFormSimple({ onBack, onSave, onDelete, initialData }: AnniversaryFormSimpleProps) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: "birthday",
    person: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        date: initialData.date || "",
        type: initialData.type || "birthday",
        person: initialData.person || "",
      })
    }
  }, [initialData])

  const handleSave = () => {
    if (!formData.name || !formData.date || !formData.person) {
      toast.error("모든 필드를 입력해주세요.")
      return
    }

    try {
      const anniversaries = JSON.parse(localStorage.getItem("anniversaries") || "[]")

      if (initialData) {
        // 수정
        const index = anniversaries.findIndex((a: any) => a.id === initialData.id)
        if (index !== -1) {
          anniversaries[index] = { ...initialData, ...formData }
        }
      } else {
        // 새로 추가
        const newAnniversary = {
          id: Date.now().toString(),
          ...formData,
          daysUntil: Math.ceil((new Date(formData.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        }
        anniversaries.push(newAnniversary)
      }

      localStorage.setItem("anniversaries", JSON.stringify(anniversaries))
      toast.success(initialData ? "기념일이 수정되었습니다." : "기념일이 추가되었습니다.")
      onSave?.()
    } catch (error) {
      toast.error("저장 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = () => {
    if (!initialData) return

    try {
      const anniversaries = JSON.parse(localStorage.getItem("anniversaries") || "[]")
      const filtered = anniversaries.filter((a: any) => a.id !== initialData.id)
      localStorage.setItem("anniversaries", JSON.stringify(filtered))
      toast.success("기념일이 삭제되었습니다.")
      onDelete?.()
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{initialData ? "기념일 수정" : "새 기념일"}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              기념일 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 기념일 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">기념일 이름</Label>
              <Input
                id="name"
                placeholder="예: 생일, 결혼기념일"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* 대상자 */}
            <div className="space-y-2">
              <Label htmlFor="person" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                대상자
              </Label>
              <Input
                id="person"
                placeholder="예: 엄마, 아빠, 친구"
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              />
            </div>

            {/* 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                날짜
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* 유형 */}
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">생일</SelectItem>
                  <SelectItem value="anniversary">기념일</SelectItem>
                  <SelectItem value="meeting">만난 날</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
          {initialData && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
