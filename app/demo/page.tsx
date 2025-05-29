"use client"

import { useEffect, useState } from "react"

// 완전히 클라이언트에서만 실행되는 컴포넌트
export default function DemoPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F51B5] mx-auto mb-4"></div>
          <p className="text-muted-foreground">앱을 로딩 중입니다...</p>
        </div>
      </div>
    )
  }

  return <DemoAppWrapper />
}

// 별도 컴포넌트로 분리하여 hydration 후에만 렌더링
function DemoAppWrapper() {
  const [DemoApp, setDemoApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDemoApp = async () => {
      try {
        // 동적으로 데모 앱 로드
        const module = await import("@/components/demo-app-client")
        setDemoApp(() => module.default)
      } catch (err) {
        console.error("Failed to load demo app:", err)
        setError("앱을 로드할 수 없습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadDemoApp()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F51B5] mx-auto mb-4"></div>
          <p className="text-muted-foreground">데모 앱을 로딩 중입니다...</p>
        </div>
      </div>
    )
  }

  if (error || !DemoApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "앱을 로드할 수 없습니다."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#3F51B5] text-white rounded hover:bg-[#3F51B5]/90"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return <DemoApp />
}
