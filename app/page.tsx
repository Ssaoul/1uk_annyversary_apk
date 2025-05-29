"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import dynamic from "next/dynamic"
import { SimpleAuthService, type User } from "@/lib/simple-auth"

// 모든 컴포넌트를 동적으로 로드 (SSR 비활성화)
const AuthScreen = dynamic(() => import("@/components/auth-screen"), { ssr: false })
const OnboardingScreen = dynamic(() => import("@/components/onboarding-screen"), { ssr: false })
const MainScreen = dynamic(() => import("@/components/main-screen"), { ssr: false })
const AnniversaryFormEnhanced = dynamic(() => import("@/components/anniversary-form-enhanced"), { ssr: false })
const SettingsScreen = dynamic(() => import("@/components/settings-screen"), { ssr: false })
const BottomNavigation = dynamic(() => import("@/components/bottom-navigation"), { ssr: false })
const EnhancedCalendarScreen = dynamic(() => import("@/components/enhanced-calendar-screen"), { ssr: false })
const EnhancedNotificationsScreen = dynamic(() => import("@/components/enhanced-notifications-screen"), { ssr: false })
const OfficialHolidaysScreen = dynamic(() => import("@/components/official-holidays-screen"), { ssr: false })
const EnhancedInstallPrompt = dynamic(() => import("@/components/enhanced-install-prompt"), { ssr: false })
const OfflineStatusIndicator = dynamic(() => import("@/components/offline-status-indicator"), { ssr: false })

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "calendar" | "add" | "notifications" | "settings" | "official-holidays"
  >("home")
  const [editingAnniversary, setEditingAnniversary] = useState<any>(null)

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setMounted(true)
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // 저장된 사용자 정보 확인
      const savedUser = SimpleAuthService.getCurrentUser()

      if (savedUser) {
        setUser(savedUser)
        // 온보딩 완료 상태 확인
        const onboardingCompleted = localStorage.getItem(`onboarding_completed_${savedUser.id}`)
        setHasCompletedOnboarding(!!onboardingCompleted)
      }
    } catch (error) {
      console.error("App initialization error:", error)
    } finally {
      setLoading(false)
    }

    // URL 파라미터로 액션 처리
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get("action")

      if (action === "add") {
        setCurrentScreen("add")
      } else if (action === "upcoming") {
        setCurrentScreen("home")
      }

      // 서비스 워커 등록
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered:", registration)
          })
          .catch((error) => {
            console.log("Service Worker registration failed:", error)
          })
      }
    }
  }

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser)
    // 온보딩 완료 상태 확인
    const onboardingCompleted = localStorage.getItem(`onboarding_completed_${authenticatedUser.id}`)
    setHasCompletedOnboarding(!!onboardingCompleted)
  }

  const handleLogout = async () => {
    SimpleAuthService.signOut()
    setUser(null)
    setHasCompletedOnboarding(false)
    setCurrentScreen("home")
  }

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true")
      setHasCompletedOnboarding(true)
    }
  }

  const handleEditAnniversary = (anniversary: any) => {
    setEditingAnniversary(anniversary)
    setCurrentScreen("add")
  }

  const handleBackFromForm = () => {
    setEditingAnniversary(null)
    setCurrentScreen("home")
  }

  // 서버사이드에서는 아무것도 렌더링하지 않음
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3F51B5] to-[#5C6BC0]">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>앱을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3F51B5] to-[#5C6BC0]">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>앱을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 사용자
  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  const renderScreen = () => {
    if (!hasCompletedOnboarding) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />
    }

    switch (currentScreen) {
      case "add":
        return (
          <AnniversaryFormEnhanced
            onBack={handleBackFromForm}
            onSave={handleBackFromForm}
            onDelete={handleBackFromForm}
            initialData={editingAnniversary}
          />
        )
      case "calendar":
        return <EnhancedCalendarScreen />
      case "notifications":
        return <EnhancedNotificationsScreen />
      case "settings":
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen("home")}
            onNavigateToOfficialHolidays={() => setCurrentScreen("official-holidays")}
            onLogout={handleLogout}
            user={user}
          />
        )
      case "official-holidays":
        return <OfficialHolidaysScreen onBack={() => setCurrentScreen("settings")} />
      default:
        return <MainScreen onEditAnniversary={handleEditAnniversary} user={user} />
    }
  }

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {hasCompletedOnboarding && (
        <BottomNavigation activeTab={currentScreen} onTabChange={(tab) => setCurrentScreen(tab as any)} />
      )}
      <EnhancedInstallPrompt />
      <OfflineStatusIndicator />
      <Toaster position="top-center" />
    </div>
  )
}
