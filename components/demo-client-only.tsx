"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"

// 클라이언트에서만 로드되는 컴포넌트들
let OnboardingScreen: any = null
let MainScreen: any = null
let AnniversaryFormEnhanced: any = null
let SettingsScreen: any = null
let BottomNavigation: any = null
let EnhancedCalendarScreen: any = null
let NotificationsScreen: any = null
let OfficialHolidaysScreen: any = null

export default function DemoClientOnly() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "calendar" | "add" | "notifications" | "settings" | "official-holidays"
  >("home")
  const [editingAnniversary, setEditingAnniversary] = useState<any>(null)
  const [componentsLoaded, setComponentsLoaded] = useState(false)

  useEffect(() => {
    // 컴포넌트들을 동적으로 로드
    const loadComponents = async () => {
      try {
        const [onboarding, main, form, settings, navigation, calendar, notifications, holidays] = await Promise.all([
          import("@/components/onboarding-screen"),
          import("../app/page"),
          import("@/components/anniversary-form-enhanced"),
          import("@/components/settings-screen"),
          import("@/components/bottom-navigation"),
          import("@/components/enhanced-calendar-screen"),
          import("@/components/notifications-screen"),
          import("@/components/official-holidays-screen"),
        ])

        OnboardingScreen = onboarding.default
        MainScreen = main.default
        AnniversaryFormEnhanced = form.default
        SettingsScreen = settings.default
        BottomNavigation = navigation.default
        EnhancedCalendarScreen = calendar.default
        NotificationsScreen = notifications.default
        OfficialHolidaysScreen = holidays.default

        setComponentsLoaded(true)

        // 온보딩 상태 확인
        const onboardingCompleted = localStorage.getItem("onboarding_completed")
        setHasCompletedOnboarding(!!onboardingCompleted)
      } catch (error) {
        console.error("Failed to load components:", error)
      }
    }

    loadComponents()
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_completed", "true")
    setHasCompletedOnboarding(true)
  }

  const handleEditAnniversary = (anniversary: any) => {
    setEditingAnniversary(anniversary)
    setCurrentScreen("add")
  }

  const handleBackFromForm = () => {
    setEditingAnniversary(null)
    setCurrentScreen("home")
  }

  if (!componentsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F51B5] mx-auto mb-4"></div>
          <p className="text-muted-foreground">컴포넌트를 로딩 중입니다...</p>
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    if (!hasCompletedOnboarding && OnboardingScreen) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />
    }

    switch (currentScreen) {
      case "add":
        return AnniversaryFormEnhanced ? (
          <AnniversaryFormEnhanced
            onBack={handleBackFromForm}
            onSave={handleBackFromForm}
            onDelete={handleBackFromForm}
            initialData={editingAnniversary}
          />
        ) : null
      case "calendar":
        return EnhancedCalendarScreen ? <EnhancedCalendarScreen /> : null
      case "notifications":
        return NotificationsScreen ? <NotificationsScreen /> : null
      case "settings":
        return SettingsScreen ? (
          <SettingsScreen
            onBack={() => setCurrentScreen("home")}
            onNavigateToOfficialHolidays={() => setCurrentScreen("official-holidays")}
          />
        ) : null
      case "official-holidays":
        return OfficialHolidaysScreen ? <OfficialHolidaysScreen onBack={() => setCurrentScreen("settings")} /> : null
      default:
        return MainScreen ? <MainScreen onEditAnniversary={handleEditAnniversary} /> : null
    }
  }

  return (
    <div className="min-h-screen">
      {renderScreen()}
      {hasCompletedOnboarding && BottomNavigation && (
        <BottomNavigation activeTab={currentScreen} onTabChange={(tab) => setCurrentScreen(tab as any)} />
      )}
      <Toaster position="top-center" />
    </div>
  )
}
