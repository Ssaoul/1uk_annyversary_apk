"use client"

import { useState } from "react"
import { Heart, Bell, WifiOff, Smartphone, Zap, Shield, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function InstallBenefitsShowcase() {
  const [activeTab, setActiveTab] = useState(0)

  const benefits = [
    {
      category: "편리함",
      icon: <Smartphone className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      items: [
        {
          icon: <Zap className="h-5 w-5 text-yellow-500" />,
          title: "빠른 실행",
          description: "홈 화면에서 바로 실행, 브라우저 없이 즉시 접근",
        },
        {
          icon: <Smartphone className="h-5 w-5 text-blue-500" />,
          title: "네이티브 경험",
          description: "일반 앱과 동일한 사용자 경험 제공",
        },
      ],
    },
    {
      category: "알림",
      icon: <Bell className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
      items: [
        {
          icon: <Bell className="h-5 w-5 text-purple-500" />,
          title: "푸시 알림",
          description: "중요한 기념일을 미리 알림으로 받아보세요",
        },
        {
          icon: <Heart className="h-5 w-5 text-red-500" />,
          title: "맞춤 알림",
          description: "개인별 설정으로 완벽한 타이밍에 알림",
        },
      ],
    },
    {
      category: "안정성",
      icon: <Shield className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      items: [
        {
          icon: <WifiOff className="h-5 w-5 text-green-500" />,
          title: "오프라인 지원",
          description: "인터넷 없어도 기념일 확인 및 관리 가능",
        },
        {
          icon: <Shield className="h-5 w-5 text-gray-600" />,
          title: "데이터 보안",
          description: "로컬 저장으로 개인정보 안전하게 보호",
        },
      ],
    },
  ]

  const stats = [
    { label: "설치 시간", value: "< 10초", icon: <Zap className="h-4 w-4" /> },
    { label: "앱 크기", value: "< 1MB", icon: <Smartphone className="h-4 w-4" /> },
    { label: "사용자 만족도", value: "98%", icon: <Star className="h-4 w-4" /> },
    { label: "오프라인 지원", value: "100%", icon: <WifiOff className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-200">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2 text-[#3F51B5]">{stat.icon}</div>
              <div className="text-lg font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {benefits.map((benefit, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              activeTab === index ? "bg-white text-[#3F51B5] shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <div className="w-4 h-4">{benefit.icon}</div>
              {benefit.category}
            </div>
          </button>
        ))}
      </div>

      {/* 혜택 상세 */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefits[activeTab].color} flex items-center justify-center mb-4 text-white`}
          >
            {benefits[activeTab].icon}
          </div>

          <h3 className="font-bold text-lg mb-3 text-gray-800">{benefits[activeTab].category} 혜택</h3>

          <div className="space-y-3">
            {benefits[activeTab].items.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-800">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 추가 혜택 배지 */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="secondary" className="text-xs">
          🆓 완전 무료
        </Badge>
        <Badge variant="secondary" className="text-xs">
          🔄 자동 업데이트
        </Badge>
        <Badge variant="secondary" className="text-xs">
          📱 크로스 플랫폼
        </Badge>
        <Badge variant="secondary" className="text-xs">
          🔒 개인정보 보호
        </Badge>
      </div>
    </div>
  )
}
