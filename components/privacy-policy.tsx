"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PrivacyPolicyProps {
  onBack?: () => void
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">개인정보 처리방침</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>개인정보 처리방침</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold mb-2">1. 개인정보의 처리목적</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적
                    이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의
                    동의를 받는 등 필요한 조치를 이행할 예정입니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>기념일 정보 저장 및 관리</li>
                    <li>알림 서비스 제공</li>
                    <li>서비스 개선 및 맞춤형 서비스 제공</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">2. 개인정보의 처리 및 보유기간</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
                    동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>기념일 정보: 회원 탈퇴 시까지</li>
                    <li>알림 설정 정보: 회원 탈퇴 시까지</li>
                    <li>서비스 이용 기록: 3년</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">3. 처리하는 개인정보의 항목</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 다음의 개인정보 항목을 처리하고 있습니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>필수항목: 기념일명, 날짜, 연락처 정보</li>
                    <li>선택항목: 메모, 이미지, 알림 설정</li>
                    <li>자동 수집 항목: 서비스 이용 기록, 접속 로그</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">4. 개인정보의 제3자 제공</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 정보주체의 개인정보를 개인정보의 처리목적에서 명시한 범위 내에서만 처리하며,
                    정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를
                    제3자에게 제공합니다.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">5. 개인정보 처리의 위탁</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고
                    있습니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>클라우드 서비스 제공업체: 데이터 저장 및 백업</li>
                    <li>푸시 알림 서비스 제공업체: 알림 발송</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">6. 정보주체의 권리·의무 및 행사방법</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    정보주체는 기념일 관리 앱에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>개인정보 처리정지 요구권</li>
                    <li>개인정보 열람요구권</li>
                    <li>개인정보 정정·삭제요구권</li>
                    <li>개인정보 처리정지 요구권</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">7. 개인정보의 안전성 확보조치</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    기념일 관리 앱은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                    <li>
                      기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화,
                      보안프로그램 설치
                    </li>
                    <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">8. 개인정보 보호책임자</h3>
                  <div className="text-muted-foreground leading-relaxed">
                    <p>
                      기념일 관리 앱은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
                      불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div className="mt-2 p-3 bg-muted/30 rounded">
                      <p>
                        <strong>개인정보 보호책임자</strong>
                      </p>
                      <p>성명: 기념일앱 관리자</p>
                      <p>연락처: privacy@anniversaryapp.com</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">9. 개인정보 처리방침 변경</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다. 이전의 개인정보 처리방침은 아래에서 확인하실
                    수 있습니다.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
