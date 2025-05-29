"use client"

import { useState } from "react"
import { ChevronRight, Calendar, Bell, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import PrivacyPolicy from "./privacy-policy"
import TermsOfService from "./terms-of-service"

interface OnboardingScreenProps {
  onComplete: () => void
}

const onboardingSteps = [
  {
    title: "기념일을 잊지 마세요",
    description: "소중한 사람들의 기념일을 체계적으로 관리하고 미리 알림을 받아보세요.",
    icon: Calendar,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "스마트한 알림 시스템",
    description: "5일전, 3일전, 1일전, 당일까지 원하는 시점에 알림을 받을 수 있습니다.",
    icon: Bell,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "연락처 연동",
    description: "핸드폰 연락처와 연동하여 누구의 기념일인지 쉽게 관리할 수 있습니다.",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "AI 메시지 추천",
    description: "AI가 상황에 맞는 축하 메시지를 자동으로 생성해드립니다.",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-600",
  },
]

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)

  const isLastStep = currentStep === onboardingSteps.length - 1
  const canProceed = isLastStep ? agreedToTerms && agreedToPrivacy : true

  const handleNext = () => {
    if (isLastStep && canProceed) {
      onComplete()
    } else if (canProceed) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const currentStepData = onboardingSteps[currentStep]
  const Icon = currentStepData.icon

  // 약관 화면이 표시되는 경우
  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
  }

  if (showTermsOfService) {
    return <TermsOfService onBack={() => setShowTermsOfService(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3F51B5] to-[#FF4081] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            {/* 진행 표시기 */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? "bg-[#3F51B5]" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 아이콘 */}
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full ${currentStepData.color} flex items-center justify-center`}>
                <Icon className="w-10 h-10" />
              </div>
            </div>

            {/* 제목과 설명 */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStepData.title}</h2>
              <p className="text-gray-600 leading-relaxed">{currentStepData.description}</p>
            </div>

            {/* 마지막 단계에서 약관 동의 */}
            {isLastStep && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 flex items-center">
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-[#3F51B5] underline"
                      onClick={() => setShowTermsOfService(true)}
                    >
                      서비스 이용약관
                    </Button>
                    <span className="ml-1">에 동의합니다</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={agreedToPrivacy}
                    onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-700 flex items-center">
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-[#3F51B5] underline"
                      onClick={() => setShowPrivacyPolicy(true)}
                    >
                      개인정보 처리방침
                    </Button>
                    <span className="ml-1">에 동의합니다</span>
                  </label>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="text-gray-500"
              >
                이전
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-[#3F51B5] hover:bg-[#3F51B5]/90 text-white"
              >
                {isLastStep ? "시작하기" : "다음"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
