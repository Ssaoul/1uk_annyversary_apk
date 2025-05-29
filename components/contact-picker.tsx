"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, User, X, Phone, Mail, Plus, Edit, Trash, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ContactsIntegration } from "@/lib/contacts-integration"

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  avatar?: string
}

interface ContactPickerProps {
  onSelect: (contact: Contact) => void
  onClose: () => void
  initialContacts?: Contact[]
  multiSelect?: boolean
}

export default function ContactPicker({
  onSelect,
  onClose,
  initialContacts = [],
  multiSelect = false,
}: ContactPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialContacts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    email: "",
  })
  const [hasRealContacts, setHasRealContacts] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredContacts(contacts)
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone?.includes(searchQuery) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredContacts(filtered)
    }
  }, [searchQuery, contacts])

  const loadContacts = async () => {
    setLoading(true)

    try {
      // 실제 Contact Picker API 시도
      const realContacts = await ContactsIntegration.getContacts()

      if (realContacts.length > 0) {
        setContacts(realContacts)
        setFilteredContacts(realContacts)
        setHasRealContacts(true)
        toast.success(`${realContacts.length}개의 연락처를 불러왔습니다`)
      } else {
        // 실제 API가 실패하면 빈 배열로 시작
        setContacts([])
        setFilteredContacts([])
        setHasRealContacts(false)
      }
    } catch (error: any) {
      console.error("연락처 로드 실패:", error)
      // 에러 발생 시 빈 배열로 시작
      setContacts([])
      setFilteredContacts([])
      setHasRealContacts(false)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelect = (contact: Contact) => {
    if (multiSelect) {
      // 이미 선택된 연락처인지 확인
      const isAlreadySelected = selectedContacts.some((c) => c.id === contact.id)

      if (isAlreadySelected) {
        // 이미 선택된 경우 제거
        setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id))
      } else {
        // 선택되지 않은 경우 추가
        setSelectedContacts([...selectedContacts, contact])
      }
    } else {
      // 단일 선택 모드
      onSelect(contact)
    }
  }

  const handleAddContact = () => {
    if (!newContact.name?.trim()) {
      toast.error("이름을 입력해주세요")
      return
    }

    const contact: Contact = {
      id: `manual-${Date.now()}`,
      name: newContact.name.trim(),
      phone: newContact.phone?.trim(),
      email: newContact.email?.trim(),
    }

    if (editingContact) {
      // 기존 연락처 수정
      setContacts(contacts.map((c) => (c.id === editingContact.id ? { ...contact, id: editingContact.id } : c)))
      toast.success("연락처가 수정되었습니다")
    } else {
      // 새 연락처 추가
      setContacts([...contacts, contact])
      toast.success("연락처가 추가되었습니다")
    }

    // 폼 초기화
    setNewContact({ name: "", phone: "", email: "" })
    setShowAddForm(false)
    setEditingContact(null)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    })
    setShowAddForm(true)
  }

  const handleDeleteContact = (contactId: string) => {
    if (confirm("정말로 이 연락처를 삭제하시겠습니까?")) {
      setContacts(contacts.filter((c) => c.id !== contactId))
      setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId))
      toast.success("연락처가 삭제되었습니다")
    }
  }

  const handleConfirm = () => {
    if (multiSelect) {
      // 여러 연락처 선택 모드
      if (selectedContacts.length === 0) {
        toast.error("최소 한 명 이상의 연락처를 선택해주세요")
        return
      }

      // 선택된 모든 연락처 반환
      selectedContacts.forEach((contact) => {
        onSelect(contact)
      })
    }

    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddContact()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isSelected = (contactId: string) => {
    return selectedContacts.some((c) => c.id === contactId)
  }

  const loadRealContacts = async () => {
    try {
      setLoading(true)
      const realContacts = await ContactsIntegration.getContacts()

      if (realContacts.length > 0) {
        // 기존 수동 입력 연락처와 병합
        const manualContacts = contacts.filter((c) => c.id.startsWith("manual-"))
        const allContacts = [...realContacts, ...manualContacts]

        setContacts(allContacts)
        setFilteredContacts(allContacts)
        setHasRealContacts(true)
        toast.success(`${realContacts.length}개의 연락처를 동기화했습니다`)
      } else {
        toast.error("연락처를 불러올 수 없습니다")
      }
    } catch (error: any) {
      console.error("연락처 동기화 실패:", error)
      toast.error(`연락처 동기화 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            연락처 관리
            {hasRealContacts && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">실제 연락처</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 연락처 동기화 버튼 */}
          {!hasRealContacts && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">실제 연락처를 불러와서 사용하세요</p>
              <Button variant="outline" size="sm" className="w-full" onClick={loadRealContacts} disabled={loading}>
                {loading ? "동기화 중..." : "연락처 동기화"}
              </Button>
            </div>
          )}

          {/* 검색 및 추가 버튼 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 전화번호, 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowAddForm(true)
                setEditingContact(null)
                setNewContact({ name: "", phone: "", email: "" })
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 연락처 추가/수정 폼 */}
          {showAddForm && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium">{editingContact ? "연락처 수정" : "새 연락처 추가"}</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    placeholder="이름"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    placeholder="전화번호"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    placeholder="이메일"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                    취소
                  </Button>
                  <Button className="flex-1" onClick={handleAddContact}>
                    {editingContact ? "수정" : "추가"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 연락처 목록 */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F51B5]"></div>
                <p className="ml-3 text-sm text-muted-foreground">연락처를 불러오는 중...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다" : "연락처가 없습니다. 위의 + 버튼으로 연락처를 추가하세요."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border ${
                      isSelected(contact.id) ? "border-[#3F51B5] bg-blue-50/50" : "border-transparent"
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#3F51B5] text-white text-sm">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <div className="flex flex-col gap-1">
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 선택 표시 */}
                    {multiSelect && isSelected(contact.id) && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-[#3F51B5] rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* 수정/삭제 버튼 (수동 입력 연락처만) */}
                    {contact.id.startsWith("manual-") && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 선택된 연락처 표시 (다중 선택 모드) */}
          {multiSelect && selectedContacts.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">선택된 연락처 ({selectedContacts.length}명)</p>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    {contact.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 하단 정보 */}
          <div className="text-xs text-muted-foreground text-center">
            {hasRealContacts ? (
              <p>✅ 실제 기기 연락처를 사용 중입니다</p>
            ) : (
              <p>💡 연락처 동기화 버튼을 눌러 실제 연락처를 불러오세요</p>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            {multiSelect && (
              <Button className="flex-1" onClick={handleConfirm} disabled={selectedContacts.length === 0}>
                확인 ({selectedContacts.length}명)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
