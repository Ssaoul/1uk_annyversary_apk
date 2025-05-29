"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone, Heart, Bell, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function EnhancedInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showBenefits, setShowBenefits] = useState(false)

  useEffect(() => {
    // 기기 및 상태 감지
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)

    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // 이전에 설치를 거부했는지 확인
      const installDismissed = localStorage.getItem("pwa-install-dismissed")
      const lastShown = localStorage.getItem("pwa-install-last-shown")
      const now = Date.now()

      // 24시간마다 다시 표시
      if (!installDismissed || (lastShown && now - Number.parseInt(lastShown) > 24 * 60 * 60 * 1000)) {
        setTimeout(() => setShowInstallPrompt(true), 3000) // 3초 후 표시
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // 앱이 설치되었을 때
    const handleAppInstalled = () => {
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      localStorage.setItem("pwa-install-dismissed", "true")
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
        localStorage.setItem("pwa-install-dismissed", "true")
        localStorage.setItem("pwa-install-last-shown", Date.now().toString())
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem("pwa-install-dismissed", "true")
    localStorage.setItem("pwa-install-last-shown", Date.now().toString())
  }

  const handleShowBenefits = () => {
    setShowBenefits(true)
  }

  const benefits = [
    {
      icon: <Heart className="h-5 w-5 text-red-500" />,
      title: "소중한 기념일 놓치지 마세요",
      description: "중요한 날들을 미리 알림으로 받아보세요",
    },
    {
      icon: <Bell className="h-5 w-5 text-blue-500" />,
      title: "스마트 알림",
      description: "맞춤형 알림으로 완벽한 준비를 도와드려요",
    },
    {
      icon: <WifiOff className="h-5 w-5 text-green-500" />,
      title: "오프라인에서도 사용",
      description: "인터넷 없어도 기념일을 확인하고 관리하세요",
    },
    {
      icon: <Smartphone className="h-5 w-5 text-purple-500" />,
      title: "네이티브 앱 경험",
      description: "홈 화면에서 바로 실행하는 빠른 접근",
    },
  ]

  const iosSteps = [
    {
      step: 1,
      text: "Safari 하단의 공유 버튼을 탭하세요",
      icon: "📤",
    },
    {
      step: 2,
      text: "'홈 화면에 추가'를 선택하세요",
      icon: "➕",
    },
    {
      step: 3,
      text: "'추가' 버튼을 탭하여 완료하세요",
      icon: "✅",
    },
  ]

  // 이미 설치된 상태이거나 설치 프롬프트가 없으면 표시하지 않음
  if (isStandalone || (!showInstallPrompt && !isIOS)) {
    return null
  }

  // 혜택 소개 모달
  if (showBenefits) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#3F51B5] to-[#5C6BC0] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">기념일 관리 앱의 특별한 기능들</h2>
              <p className="text-sm text-muted-foreground">앱으로 설치하면 더 많은 혜택을 누릴 수 있어요!</p>
            </div>

            <div className="space-y-4 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 mt-0.5">{benefit.icon}</div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBenefits(false)} className="flex-1">
                나중에
              </Button>
              <Button
                onClick={() => {
                  setShowBenefits(false)
                  if (isIOS) {
                    // iOS는 바로 설치 안내로
                  } else {
                    handleInstallClick()
                  }
                }}
                className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90"
              >
                <Download className="h-4 w-4 mr-2" />
                설치하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // iOS용 단계별 설치 안내
  if (isIOS && !isStandalone) {
    const iosInstallDismissed = localStorage.getItem("ios-install-dismissed")
    if (iosInstallDismissed) return null

    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
        <Card className="border-[#3F51B5] shadow-xl bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#3F51B5] rounded-lg flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">앱으로 설치하기</h3>
                  <Badge variant="secondary" className="text-xs">
                    무료 • 빠른 설치
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.setItem("ios-install-dismissed", "true")
                  setShowInstallPrompt(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <Button variant="outline" size="sm" onClick={handleShowBenefits} className="w-full text-xs mb-3">
                🎁 앱 설치 혜택 보기
              </Button>
            </div>

            <div className="space-y-3">
              {iosSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    currentStep === index ? "bg-[#3F51B5]/10 border border-[#3F51B5]/20" : "bg-gray-50"
                  }`}
                >
                  <div className="text-lg">{step.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#3F51B5]">STEP {step.step}</span>
                    </div>
                    <p className="text-xs text-gray-700">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">💡 Safari 브라우저에서만 설치 가능합니다</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Android/Desktop용 매력적인 설치 프롬프트
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
        <Card className="border-[#3F51B5] shadow-xl bg-gradient-to-br from-white to-purple-50 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3F51B5] to-[#5C6BC0]"></div>

          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3F51B5] to-[#5C6BC0] rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-sm">기념일 관리</h3>
                  <Badge className="bg-green-100 text-green-700 text-xs">무료</Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-3">홈 화면에 추가하여 더 빠르고 편리하게 이용하세요!</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    <span>오프라인 지원</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    <span>푸시 알림</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleShowBenefits} className="text-xs">
                    혜택 보기
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-xs flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    무료 설치
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="px-2">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
