"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsOfServiceProps {
  onBack?: () => void
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">서비스 이용약관</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>서비스 이용약관</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold mb-2">제1조 (목적)</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    이 약관은 기념일 관리 앱(이하 "회사")이 제공하는 기념일 관리 서비스(이하 "서비스")의 이용조건 및
                    절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제2조 (정의)</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>"서비스"라 함은 회사가 제공하는 기념일 관리 및 알림 서비스를 의미합니다.</li>
                    <li>"이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 자를 의미합니다.</li>
                    <li>"기념일"이라 함은 이용자가 등록한 개인적 또는 공식적인 기념할 만한 날을 의미합니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제3조 (약관의 효력 및 변경)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>① 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</p>
                    <p>
                      ② 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을
                      통해 공지합니다.
                    </p>
                    <p>③ 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제4조 (서비스의 제공)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>① 회사는 다음과 같은 서비스를 제공합니다:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>기념일 등록, 수정, 삭제 기능</li>
                      <li>기념일 알림 서비스</li>
                      <li>달력 뷰 및 목록 뷰 제공</li>
                      <li>기념일 데이터 백업 및 복원</li>
                      <li>기타 회사가 정하는 서비스</li>
                    </ul>
                    <p>② 회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있습니다.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제5조 (서비스 이용)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>① 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</p>
                    <p>
                      ② 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는
                      서비스의 제공을 일시적으로 중단할 수 있습니다.
                    </p>
                    <p>
                      ③ 회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스제공화면에
                      공지한 바에 따릅니다.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제6조 (이용자의 의무)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>① 이용자는 다음 행위를 하여서는 안 됩니다:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>신청 또는 변경시 허위내용의 등록</li>
                      <li>타인의 정보 도용</li>
                      <li>회사가 게시한 정보의 변경</li>
                      <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                      <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                      <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                      <li>
                        외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는
                        행위
                      </li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제7조 (개인정보보호)</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    회사는 이용자의 개인정보를 보호하기 위해 개인정보보호법 등 관련 법령이 정하는 바를 준수하며,
                    개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제8조 (회사의 의무)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      ① 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에
                      따라 지속적이고, 안정적으로 서비스를 제공하기 위해서 노력합니다.
                    </p>
                    <p>
                      ② 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를
                      위한 보안 시스템을 구축합니다.
                    </p>
                    <p>③ 회사는 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제9조 (저작권의 귀속 및 이용제한)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>① 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</p>
                    <p>
                      ② 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙
                      없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게
                      하여서는 안됩니다.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">제10조 (분쟁해결)</h3>
                  <div className="text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      ① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여
                      피해보상처리기구를 설치·운영합니다.
                    </p>
                    <p>
                      ② 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고,
                      주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소
                      또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">부칙</h3>
                  <p className="text-muted-foreground leading-relaxed">이 약관은 2024년 1월 1일부터 적용됩니다.</p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
