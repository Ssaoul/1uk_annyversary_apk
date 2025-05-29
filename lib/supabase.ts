import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-my-custom-header": "anniversary-app",
    },
  },
})

export function getSupabaseClient() {
  console.log("🔗 Getting Supabase client")
  console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.log("Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

  return supabase
}

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    console.log("🧪 Testing Supabase connection...")

    const { data, error } = await supabase.from("anniversaries").select("count(*)").limit(1)

    if (error) {
      console.error("❌ Supabase connection test failed:", error)
      return false
    }

    console.log("✅ Supabase connection test successful")
    return true
  } catch (error) {
    console.error("❌ Supabase connection test error:", error)
    return false
  }
}
