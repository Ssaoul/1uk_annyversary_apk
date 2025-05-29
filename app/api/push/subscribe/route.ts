import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()

    // 푸시 구독 정보를 데이터베이스에 저장
    const { data, error } = await supabaseServer
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error saving push subscription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in push subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
