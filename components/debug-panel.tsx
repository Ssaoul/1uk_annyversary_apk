"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleAuthService } from "@/lib/simple-auth"
import { AnniversaryService } from "@/lib/anniversary-service"
import { getSupabaseClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Bug, TestTube, User, Database, Wifi, CheckCircle, XCircle } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")

  const currentUser = SimpleAuthService.getCurrentUser()
  const supabase = getSupabaseClient()

  // Supabase 연결 테스트
  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus("checking")
      const { data, error } = await supabase.from("anniversaries").select("count").limit(1)

      if (error) {
        console.error("Supabase connection error:", error)
        setConnectionStatus("error")
        toast.error(`데이터베이스 연결 실패: ${error.message}`)
      } else {
        setConnectionStatus("connected")
        toast.success("데이터베이스 연결 성공!")
      }
    } catch (error) {
      console.error("Connection test error:", error)
      setConnectionStatus("error")
      toast.error("연결 테스트 실패")
    }
  }

  // 테스트 기념일 생성
  const createTestAnniversary = async () => {
    if (!currentUser) {
      toast.error("로그인이 필요합니다")
      return
    }

    setTesting(true)
    try {
      console.log("🧪 Creating test anniversary...")
      console.log("Current user:", currentUser)

      const testData = {
        name: "테스트 기념일",
        date: "2024-12-25",
        is_lunar: false,
        contact_name: "테스트 연락처",
        category: "personal" as const,
        repeat_type: "yearly" as const,
        memo: "디버그 패널에서 생성된 테스트 기념일입니다.",
        image_url: "",
        is_favorite: false,
        notification_enabled: true,
        notify_same_day: true,
        notify_one_day_before: true,
        notify_three_days_before: false,
        notify_five_days_before: false,
        notify_one_week_before: false,
      }

      console.log("Test data:", testData)

      const result = await AnniversaryService.createAnniversary({
        ...testData,
        user_id: currentUser.id,
      })

      if (result) {
        console.log("✅ Test anniversary created:", result)
        toast.success("테스트 기념일이 성공적으로 생성되었습니다!")
      } else {
        console.error("❌ Test anniversary creation failed")
        toast.error("테스트 기념일 생성에 실패했습니다")
      }
    } catch (error) {
      console.error("❌ Test creation error:", error)
      toast.error(`테스트 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
    } finally {
      setTesting(false)
    }
  }

  // UUID 유효성 검사
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600"
        size="sm"
      >
        <Bug className="h-4 w-4 mr-1" />
        Debug
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            디버그 패널
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 사용자 정보 */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              사용자 정보
            </h3>
            {currentUser ? (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">ID:</span>
                  <code className="text-sm bg-background px-2 py-1 rounded">{currentUser.id}</code>
                  {isValidUUID(currentUser.id) ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid UUID
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Invalid UUID
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{currentUser.name || "없음"}</span>
                </div>
              </div>
            ) : (
              <Badge variant="destructive">로그인되지 않음</Badge>
            )}
          </div>

          {/* 데이터베이스 연결 상태 */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              데이터베이스 연결
            </h3>
            <div className="flex items-center gap-3">
              <Button onClick={testSupabaseConnection} size="sm" variant="outline">
                <Wifi className="h-4 w-4 mr-2" />
                연결 테스트
              </Button>
              {connectionStatus === "checking" && <Badge variant="secondary">확인 중...</Badge>}
              {connectionStatus === "connected" && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  연결됨
                </Badge>
              )}
              {connectionStatus === "error" && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  연결 실패
                </Badge>
              )}
            </div>
          </div>

          {/* 환경 변수 확인 */}
          <div className="space-y-3">
            <h3 className="font-semibold">환경 변수</h3>
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">SUPABASE_URL:</span>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                  <Badge variant="default" className="bg-green-500">
                    설정됨
                  </Badge>
                ) : (
                  <Badge variant="destructive">미설정</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">SUPABASE_ANON_KEY:</span>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                  <Badge variant="default" className="bg-green-500">
                    설정됨
                  </Badge>
                ) : (
                  <Badge variant="destructive">미설정</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 테스트 기능 */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              테스트 기능
            </h3>
            <div className="space-y-2">
              <Button
                onClick={createTestAnniversary}
                disabled={!currentUser || testing}
                className="w-full"
                variant="outline"
              >
                {testing ? "테스트 중..." : "🧪 기념일 생성 테스트"}
              </Button>
              {!currentUser && <p className="text-sm text-muted-foreground">테스트를 위해 먼저 로그인해주세요.</p>}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <Button onClick={() => setIsOpen(false)} className="w-full" variant="outline">
            닫기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
