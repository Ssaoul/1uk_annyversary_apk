"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import dynamic from "next/dynamic"

// 모든 컴포넌트를 동적으로 로드
const OnboardingScreen = dynamic(() => import("@/components/onboarding-screen"), { ssr: false })
const MainScreen = dynamic(() => import("../app/page"), { ssr: false })
const AnniversaryFormEnhanced = dynamic(() => import("@/components/anniversary-form-enhanced"), { ssr: false })
const SettingsScreen = dynamic(() => import("@/components/settings-screen"), { ssr: false })
const BottomNavigation = dynamic(() => import("@/components/bottom-navigation"), { ssr: false })
const EnhancedCalendarScreen = dynamic(() => import("@/components/enhanced-calendar-screen"), { ssr: false })
const NotificationsScreen = dynamic(() => import("@/components/notifications-screen"), { ssr: false })
const OfficialHolidaysScreen = dynamic(() => import("@/components/official-holidays-screen"), { ssr: false })

export default function DemoApp() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "calendar" | "add" | "notifications" | "settings" | "official-holidays"
  >("home")
  const [editingAnniversary, setEditingAnniversary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      const onboardingCompleted = localStorage.getItem("onboarding_completed")
      setHasCompletedOnboarding(!!onboardingCompleted)
      setIsLoading(false)
    }
  }, [])

  const handleOnboardingComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_completed", "true")
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

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F51B5] mx-auto mb-4"></div>
          <p className="text-muted-foreground">앱을 로딩 중입니다...</p>
        </div>
      </div>
    )
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
        return <NotificationsScreen />
      case "settings":
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen("home")}
            onNavigateToOfficialHolidays={() => setCurrentScreen("official-holidays")}
          />
        )
      case "official-holidays":
        return <OfficialHolidaysScreen onBack={() => setCurrentScreen("settings")} />
      default:
        return <MainScreen onEditAnniversary={handleEditAnniversary} />
    }
  }

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {hasCompletedOnboarding && (
        <BottomNavigation activeTab={currentScreen} onTabChange={(tab) => setCurrentScreen(tab as any)} />
      )}
      <Toaster position="top-center" />
    </div>
  )
}
