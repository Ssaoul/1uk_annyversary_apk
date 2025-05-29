"use client"

import { ArrowLeft, Settings, Info, Shield, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SettingsScreenSimpleProps {
  onBack?: () => void
  onNavigateToOfficialHolidays?: () => void
}

export default function SettingsScreenSimple({ onBack, onNavigateToOfficialHolidays }: SettingsScreenSimpleProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            설정
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>일반</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start" onClick={onNavigateToOfficialHolidays}>
              <FileText className="h-4 w-4 mr-3" />
              공휴일 설정
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-2">
              <Info className="h-4 w-4" />
              <div>
                <div className="font-medium">버전</div>
                <div className="text-sm text-muted-foreground">1.0.0</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <Shield className="h-4 w-4" />
              <div>
                <div className="font-medium">개인정보 보호</div>
                <div className="text-sm text-muted-foreground">로컬 저장소 사용</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
