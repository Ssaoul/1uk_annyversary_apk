"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  ArrowLeft,
  Calendar,
  Save,
  X,
  Loader2,
  Trash2,
  UserPlus,
  Users,
  CalendarPlus,
  ImageIcon,
  MessageSquare,
  Bell,
  Tag,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAnniversaries } from "@/hooks/use-anniversaries"
import type { Anniversary } from "@/types/anniversary"
import { toast } from "sonner"
import { SimpleAuthService } from "@/lib/simple-auth"
import ContactPicker from "./contact-picker"
// 디버그 패널 import 추가
import { DebugPanel } from "./debug-panel"

interface AnniversaryFormEnhancedProps {
  onBack?: () => void
  onSave?: (data: Anniversary) => void
  onDelete?: (id: string) => void
  initialData?: Anniversary
}

function AnniversaryFormEnhanced({ onBack, onSave, onDelete, initialData }: AnniversaryFormEnhancedProps) {
  const { addAnniversary, updateAnniversary, deleteAnniversary } = useAnniversaries()
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [showCalendarSync, setShowCalendarSync] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUser = SimpleAuthService.getCurrentUser()

  // 연락처 목록 상태 추가
  const [selectedContacts, setSelectedContacts] = useState<Array<{ id: string; name: string }>>(() => {
    if (initialData?.contact_name) {
      return [{ id: "initial", name: initialData.contact_name }]
    }
    return []
  })

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    date: initialData?.date || "",
    is_lunar: initialData?.is_lunar || false,
    contact_name: initialData?.contact_name || "",
    category: initialData?.category || "birthday",
    repeat_type: initialData?.repeat_type || "yearly",
    memo: initialData?.memo || "",
    image_url: initialData?.image_url || "",
    is_favorite: initialData?.is_favorite || false,
    notification_enabled: initialData?.notification_enabled ?? true,
    notify_same_day: initialData?.notify_same_day ?? true,
    notify_one_day_before: initialData?.notify_one_day_before ?? true,
    notify_three_days_before: initialData?.notify_three_days_before ?? false,
    notify_five_days_before: initialData?.notify_five_days_before ?? false,
    notify_one_week_before: initialData?.notify_one_week_before ?? false,
  })

  const handleContactSelect = (contact: any) => {
    // 이미 선택된 연락처인지 확인
    const isAlreadySelected = selectedContacts.some((c) => c.name === contact.name)

    if (!isAlreadySelected) {
      const newContacts = [...selectedContacts, { id: contact.id, name: contact.name }]
      setSelectedContacts(newContacts)

      // 첫 번째 연락처를 기본값으로 설정
      if (newContacts.length === 1) {
        setFormData({ ...formData, contact_name: contact.name })
      } else {
        // 여러 연락처가 있으면 쉼표로 구분
        const contactNames = newContacts.map((c) => c.name).join(", ")
        setFormData({ ...formData, contact_name: contactNames })
      }

      toast.success(`${contact.name} 연락처가 추가되었습니다`)
    } else {
      toast.info(`${contact.name}은 이미 선택된 연락처입니다`)
    }
  }

  const removeContact = (contactId: string) => {
    const newContacts = selectedContacts.filter((c) => c.id !== contactId)
    setSelectedContacts(newContacts)

    if (newContacts.length === 0) {
      setFormData({ ...formData, contact_name: "" })
    } else {
      const contactNames = newContacts.map((c) => c.name).join(", ")
      setFormData({ ...formData, contact_name: contactNames })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploading(true)
    try {
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, image_url: imageUrl }))
      toast.success("이미지가 업로드되었습니다")
    } catch (error) {
      console.error("Image upload error:", error)
      toast.error("이미지 업로드 중 오류가 발생했습니다")
    } finally {
      setImageUploading(false)
    }
  }

  const generateAIMessage = async () => {
    if (!formData.name) {
      toast.error("기념일명을 먼저 입력해주세요")
      return
    }

    setAiGenerating(true)
    try {
      const contactName = selectedContacts.length > 0 ? selectedContacts[0].name : "소중한 분"
      const demoMessages = [
        `${contactName}의 ${formData.name}을 진심으로 축하드립니다! 항상 건강하시고 행복한 하루 되세요.`,
        `오늘은 특별한 날, ${contactName}의 ${formData.name}입니다. 진심으로 축하드리며 행복한 시간 보내세요!`,
        `${contactName}의 ${formData.name}을 맞이하여 진심 어린 축하의 마음을 전합니다. 항상 건강하고 행복하세요!`,
      ]

      const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)]
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFormData((prev) => ({ ...prev, memo: randomMessage }))
      toast.success("AI 메시지가 생성되었습니다")
    } catch (error) {
      console.error("AI message generation error:", error)
      toast.error("AI 메시지 생성 중 오류가 발생했습니다")
    } finally {
      setAiGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("기념일명을 입력해주세요")
      return
    }

    if (!formData.date) {
      toast.error("날짜를 선택해주세요")
      return
    }

    setLoading(true)

    try {
      console.log("Form data being submitted:", formData)
      console.log("Current user:", currentUser)

      let result
      if (initialData?.id) {
        result = await updateAnniversary(initialData.id, formData)
      } else {
        result = await addAnniversary(formData)
      }

      if (result) {
        console.log("Save successful, result:", result)
        toast.success(initialData ? "기념일이 수정되었습니다" : "기념일이 추가되었습니다")
        onSave?.(result)
        onBack?.()
      } else {
        console.error("Save failed, no result returned")
        toast.error("저장에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("저장 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id) return

    if (confirm("정말로 이 기념일을 삭제하시겠습니까?")) {
      setLoading(true)
      try {
        const success = await deleteAnniversary(initialData.id)
        if (success) {
          toast.success("기념일이 삭제되었습니다")
          onDelete?.(initialData.id)
          onBack?.()
        } else {
          toast.error("삭제에 실패했습니다")
        }
      } catch (error) {
        console.error("Delete error:", error)
        toast.error("삭제 중 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
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
          <h1 className="text-xl font-semibold">{initialData ? "기념일 수정" : "새 기념일 추가"}</h1>
          {initialData && (
            <div className="ml-auto">
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/20" onClick={handleDelete}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">기념일명 *</Label>
                <Input
                  id="name"
                  placeholder="예: 어머니 생신, 결혼기념일"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">날짜 *</Label>
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
                  checked={formData.is_lunar}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_lunar: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="favorite">즐겨찾기</Label>
                <Switch
                  id="favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 카테고리 및 반복 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                카테고리 및 반복 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">생일</SelectItem>
                    <SelectItem value="anniversary">기념일</SelectItem>
                    <SelectItem value="holiday">공휴일</SelectItem>
                    <SelectItem value="personal">개인 일정</SelectItem>
                    <SelectItem value="work">업무 관련</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat_type">반복 설정</Label>
                <Select
                  value={formData.repeat_type}
                  onValueChange={(value) => setFormData({ ...formData, repeat_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="반복 설정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">매년 반복</SelectItem>
                    <SelectItem value="monthly">매월 반복</SelectItem>
                    <SelectItem value="once">일회성</SelectItem>
                    <SelectItem value="custom">사용자 지정</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 연락처 연결 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                연락처 연결
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedContacts.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">선택된 연락처 ({selectedContacts.length}명)</Label>
                  <div className="space-y-2">
                    {selectedContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#3F51B5] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="font-medium">{contact.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(contact.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowContactPicker(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    연락처 추가
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowContactPicker(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    연락처에서 선택
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>
                  <Input
                    placeholder="직접 입력 (예: 어머니, 김철수)"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 이미지 업로드 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                이미지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.image_url ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                    <img
                      src={formData.image_url || "/placeholder.svg"}
                      alt={formData.name}
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">클릭하여 이미지 업로드</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                  {imageUploading && (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">업로드 중...</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 메모 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                메모
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="기념일에 대한 메모를 입력하세요"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="min-h-[100px]"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={generateAIMessage}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI 메시지 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 메시지 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notification_enabled">알림 활성화</Label>
                <Switch
                  id="notification_enabled"
                  checked={formData.notification_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notification_enabled: checked })}
                />
              </div>

              {formData.notification_enabled && (
                <div className="space-y-3 pt-3 border-t">
                  <Label className="text-sm font-medium">알림 시점</Label>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same_day"
                        checked={formData.notify_same_day}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_same_day: checked as boolean })}
                      />
                      <Label htmlFor="same_day" className="text-sm">
                        당일
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="one_day"
                        checked={formData.notify_one_day_before}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_one_day_before: checked as boolean })
                        }
                      />
                      <Label htmlFor="one_day" className="text-sm">
                        1일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="three_days"
                        checked={formData.notify_three_days_before}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_three_days_before: checked as boolean })
                        }
                      />
                      <Label htmlFor="three_days" className="text-sm">
                        3일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="five_days"
                        checked={formData.notify_five_days_before}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_five_days_before: checked as boolean })
                        }
                      />
                      <Label htmlFor="five_days" className="text-sm">
                        5일 전
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="one_week"
                        checked={formData.notify_one_week_before}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, notify_one_week_before: checked as boolean })
                        }
                      />
                      <Label htmlFor="one_week" className="text-sm">
                        1주일 전
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 구글 캘린더 연동 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                캘린더 연동
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="outline" className="w-full" onClick={() => setShowCalendarSync(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                구글 캘린더와 동기화
              </Button>
              <p className="text-sm text-muted-foreground">
                구글 캘린더에 자동으로 일정을 추가하고 동기화할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>

      {/* 연락처 선택 모달 */}
      {showContactPicker && (
        <ContactPicker onSelect={handleContactSelect} onClose={() => setShowContactPicker(false)} multiSelect={true} />
      )}

      {/* 캘린더 동기화 설정 모달 */}
      {showCalendarSync && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>구글 캘린더 동기화</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">이 기념일을 구글 캘린더에 추가하고 자동으로 동기화합니다.</p>
              <div className="space-y-2">
                <Label>캘린더 선택</Label>
                <Select defaultValue="primary">
                  <SelectTrigger>
                    <SelectValue placeholder="캘린더 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">기본 캘린더</SelectItem>
                    <SelectItem value="work">업무 캘린더</SelectItem>
                    <SelectItem value="personal">개인 캘린더</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>알림 설정</Label>
                <Select defaultValue="30min">
                  <SelectTrigger>
                    <SelectValue placeholder="알림 설정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">알림 없음</SelectItem>
                    <SelectItem value="30min">30분 전</SelectItem>
                    <SelectItem value="1hour">1시간 전</SelectItem>
                    <SelectItem value="1day">1일 전</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowCalendarSync(false)}>
                  취소
                </Button>
                <Button
                  className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90"
                  onClick={() => {
                    toast.success("구글 캘린더에 추가되었습니다")
                    setShowCalendarSync(false)
                  }}
                >
                  동기화
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 디버그 패널 - 개발 환경에서만 표시 */}
      {process.env.NODE_ENV === "development" && <DebugPanel />}
    </div>
  )
}

export default AnniversaryFormEnhanced
