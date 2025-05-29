import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json()

    // 푸시 구독 정보를 데이터베이스에서 제거
    const { error } = await supabaseServer.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)

    if (error) {
      console.error("Error removing push subscription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in push unsubscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
