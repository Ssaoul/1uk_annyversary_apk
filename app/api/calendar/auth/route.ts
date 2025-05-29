import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === "getConfig") {
      // 클라이언트에 필요한 설정만 반환 (API 키는 제외)
      return NextResponse.json({
        success: true,
        config: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          scopes: "https://www.googleapis.com/auth/calendar.events",
        },
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" })
  } catch (error) {
    console.error("Calendar auth API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" })
  }
}
