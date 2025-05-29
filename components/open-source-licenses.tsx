"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OpenSourceLicensesProps {
  onBack?: () => void
}

export default function OpenSourceLicenses({ onBack }: OpenSourceLicensesProps) {
  const licenses = [
    {
      name: "React",
      version: "18.2.0",
      license: "MIT",
      description: "A JavaScript library for building user interfaces",
      url: "https://reactjs.org/",
    },
    {
      name: "Next.js",
      version: "14.0.0",
      license: "MIT",
      description: "The React Framework for Production",
      url: "https://nextjs.org/",
    },
    {
      name: "Tailwind CSS",
      version: "3.3.0",
      license: "MIT",
      description: "A utility-first CSS framework",
      url: "https://tailwindcss.com/",
    },
    {
      name: "Lucide React",
      version: "0.294.0",
      license: "ISC",
      description: "Beautiful & consistent icon toolkit made by the community",
      url: "https://lucide.dev/",
    },
    {
      name: "Radix UI",
      version: "1.0.0",
      license: "MIT",
      description: "Low-level UI primitives with a focus on accessibility",
      url: "https://www.radix-ui.com/",
    },
    {
      name: "Supabase",
      version: "2.38.0",
      license: "MIT",
      description: "The open source Firebase alternative",
      url: "https://supabase.com/",
    },
    {
      name: "TypeScript",
      version: "5.0.0",
      license: "Apache-2.0",
      description: "TypeScript is a language for application-scale JavaScript",
      url: "https://www.typescriptlang.org/",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#3F51B5] text-white p-4 shadow-md">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">오픈소스 라이선스</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>오픈소스 라이선스</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  이 앱은 다음과 같은 오픈소스 라이브러리들을 사용하여 개발되었습니다. 각 라이브러리의 라이선스를
                  준수합니다.
                </p>

                {licenses.map((license, index) => (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">{license.name}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded">{license.license}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">버전: {license.version}</p>
                        <p className="text-sm text-muted-foreground">{license.description}</p>
                        <a
                          href={license.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#3F51B5] hover:underline"
                        >
                          {license.url}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-2">MIT License</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
                    associated documentation files (the "Software"), to deal in the Software without restriction,
                    including without limitation the rights to use, copy, modify, merge, publish, distribute,
                    sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    The above copyright notice and this permission notice shall be included in all copies or substantial
                    portions of the Software.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
                    NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
                    OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
                    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
