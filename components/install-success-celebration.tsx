"use client"

import { useState, useEffect } from "react"
import { Heart, Sparkles, Gift, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InstallSuccessCelebration() {
  const [showCelebration, setShowCelebration] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // 앱이 설치되었는지 확인
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const hasShownCelebration = localStorage.getItem("install-celebration-shown")

    if (isStandalone && !hasShownCelebration) {
      setTimeout(() => {
        setShowCelebration(true)
        localStorage.setItem("install-celebration-shown", "true")
      }, 1000)
    }
  }, [])

  const celebrationSteps = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "설치 완료! 🎉",
      description: "기념일 관리 앱이 성공적으로 설치되었습니다!",
      action: "다음",
    },
    {
      icon: <Bell className="h-8 w-8 text-blue-500" />,
      title: "알림 설정하기",
      description: "중요한 기념일을 놓치지 않도록 알림을 설정해보세요.",
      action: "알림 허용",
    },
    {
      icon: <Gift className="h-8 w-8 text-purple-500" />,
      title: "첫 기념일 추가하기",
      description: "소중한 사람의 기념일을 추가해보세요!",
      action: "시작하기",
    },
  ]

  const handleNext = () => {
    if (step < celebrationSteps.length - 1) {
      setStep(step + 1)
    } else {
      setShowCelebration(false)
    }
  }

  const handleSkip = () => {
    setShowCelebration(false)
  }

  if (!showCelebration) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white relative overflow-hidden">
        {/* 축하 애니메이션 배경 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 opacity-50"></div>

        {/* 반짝이는 효과 */}
        <div className="absolute top-4 right-4">
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        </div>
        <div className="absolute top-8 left-6">
          <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
        <div className="absolute bottom-8 right-8">
          <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="text-center">
            {/* 아이콘 */}
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center">
              {celebrationSteps[step].icon}
            </div>

            {/* 제목 */}
            <h2 className="text-xl font-bold mb-2 text-gray-800">{celebrationSteps[step].title}</h2>

            {/* 설명 */}
            <p className="text-sm text-gray-600 mb-6">{celebrationSteps[step].description}</p>

            {/* 진행 표시 */}
            <div className="flex justify-center gap-2 mb-6">
              {celebrationSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === step ? "bg-[#3F51B5] w-6" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                건너뛰기
              </Button>
              <Button onClick={handleNext} className="flex-1 bg-[#3F51B5] hover:bg-[#3F51B5]/90">
                {celebrationSteps[step].action}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
