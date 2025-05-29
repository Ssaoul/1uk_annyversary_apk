import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { anniversaryName, contactName, type } = await request.json()

    const prompt = `
다음 기념일에 대한 따뜻하고 진심어린 축하 메시지를 한국어로 작성해주세요:

기념일: ${anniversaryName}
대상: ${contactName}
종류: ${type === "birthday" ? "생일" : type === "anniversary" ? "기념일" : "특별한 날"}

요구사항:
- 50자 이내의 간결한 메시지
- 따뜻하고 진심어린 톤
- 한국어 존댓말 사용
- 이모지 1-2개 포함

예시: "어머니, 생신을 진심으로 축하드립니다! 항상 건강하시길 바라요 🎂❤️"
`

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
    })

    return NextResponse.json({ message: text.trim() })
  } catch (error) {
    console.error("Error generating message:", error)
    return NextResponse.json({ error: "Failed to generate message" }, { status: 500 })
  }
}
