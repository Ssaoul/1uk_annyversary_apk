"use client"

import { Home, Calendar, Plus, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const menuItems = [
    {
      id: "home",
      label: "홈",
      icon: Home,
    },
    {
      id: "calendar",
      label: "캘린더",
      icon: Calendar,
    },
    {
      id: "add",
      label: "추가",
      icon: Plus,
      isCenter: true,
    },
    {
      id: "notifications",
      label: "알림",
      icon: Bell,
    },
    {
      id: "settings",
      label: "설정",
      icon: Settings,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-md mx-auto">
        <nav className="flex items-center justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            if (item.isCenter) {
              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  size="lg"
                  className="h-12 w-12 rounded-full bg-[#FF4081] hover:bg-[#FF4081]/90 shadow-lg -mt-6"
                >
                  <Icon className="h-6 w-6 text-white" />
                </Button>
              )
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive
                    ? "text-[#3F51B5]"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-[#3F51B5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
