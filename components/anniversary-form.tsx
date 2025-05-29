"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Calendar, Contact, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface AnniversaryFormProps {
  onBack?: () => void
  onSave?: (data: any) => void
  initialData?: any
}

export default function AnniversaryForm({ onBack, onSave, initialData }: AnniversaryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    date: initialData?.date || "",
    isLunar: initialData?.isLunar || false,
    contact: initialData?.contact || "",
    type: initialData?.type || "birthday",
    memo: initialData?.memo || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.(formData)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{initialData ? "기념일 수정" : "새 기념일 추가"}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기념일명 입력 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">기념일명</Label>
                <Input
                  id="name"
                  placeholder="예: 어머니 생신, 결혼기념일"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">날짜</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lunar">음력 날짜</Label>
                <Switch
                  id="lunar"
                  checked={formData.isLunar}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLunar: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 연락처 연결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연락처</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact">연락처 이름</Label>
                <div className="flex gap-2">
                  <Input
                    id="contact"
                    placeholder="예: 어머니, 김철수"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Contact className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 구분 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">구분</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="birthday" id="birthday" />
                  <Label htmlFor="birthday">생일</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anniversary" id="anniversary" />
                  <Label htmlFor="anniversary">기념일</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company">회사</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">기타</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 메모 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="추가 메모사항을 입력하세요"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90">
              <Save className="h-4 w-4 mr-2" />
              저장
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
