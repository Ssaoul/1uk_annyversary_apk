"use client"

import { useState, useEffect } from "react"
import { Toaster } from "sonner"

export default function DemoAppClient() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "calendar" | "add" | "notifications" | "settings" | "official-holidays"
  >("home")
  const [editingAnniversary, setEditingAnniversary] = useState<any>(null)
  const [components, setComponents] = useState<any>({})
  const [componentsLoaded, setComponentsLoaded] = useState(false)

  useEffect(() => {
    // 온보딩 상태 확인
    const onboardingCompleted = localStorage.getItem("onboarding_completed")
    setHasCompletedOnboarding(!!onboardingCompleted)

    // 완전한 기능을 가진 컴포넌트들을 동적으로 로드
    const loadComponents = async () => {
      try {
        const [
          onboardingModule,
          mainModule,
          formModule,
          settingsModule,
          navigationModule,
          calendarModule,
          notificationsModule,
          holidaysModule,
        ] = await Promise.all([
          import("@/components/onboarding-screen"),
          import("@/components/main-screen"),
          import("@/components/anniversary-form-enhanced"), // Enhanced 버전 사용
          import("@/components/settings-screen"),
          import("@/components/bottom-navigation"),
          import("@/components/enhanced-calendar-screen"),
          import("@/components/enhanced-notifications-screen"),
          import("@/components/official-holidays-screen"),
        ])

        setComponents({
          OnboardingScreen: onboardingModule.default,
          MainScreen: mainModule.default,
          AnniversaryForm: formModule.default,
          SettingsScreen: settingsModule.default,
          BottomNavigation: navigationModule.default,
          CalendarScreen: calendarModule.default,
          NotificationsScreen: notificationsModule.default,
          OfficialHolidaysScreen: holidaysModule.default,
        })

        setComponentsLoaded(true)
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
          <p className="text-muted-foreground">완전한 기능을 로딩 중입니다...</p>
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    const {
      OnboardingScreen,
      MainScreen,
      AnniversaryForm,
      SettingsScreen,
      CalendarScreen,
      NotificationsScreen,
      OfficialHolidaysScreen,
    } = components

    if (!hasCompletedOnboarding && OnboardingScreen) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />
    }

    switch (currentScreen) {
      case "add":
        return AnniversaryForm ? (
          <AnniversaryForm
            onBack={handleBackFromForm}
            onSave={handleBackFromForm}
            onDelete={handleBackFromForm}
            initialData={editingAnniversary}
          />
        ) : null
      case "calendar":
        return CalendarScreen ? <CalendarScreen /> : null
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
      {hasCompletedOnboarding && components.BottomNavigation && (
        <components.BottomNavigation activeTab={currentScreen} onTabChange={(tab: any) => setCurrentScreen(tab)} />
      )}
      <Toaster position="top-center" />
    </div>
  )
}
