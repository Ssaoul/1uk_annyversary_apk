import { getSupabaseClient } from "./supabase"
import type { Anniversary, OfficialHoliday, UserOfficialHoliday } from "@/types/anniversary"

const supabase = getSupabaseClient()

export class AnniversaryService {
  // UUID 생성 함수
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // D-day 계산 (구분별 처리)
  static calculateDaysLeft(date: string, repeatType: string): number {
    const today = new Date()
    const anniversaryDate = new Date(date)

    if (repeatType === "once") {
      // 일회 한정: 단순 날짜 차이
      const diffTime = anniversaryDate.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else if (repeatType === "yearly") {
      // 매년 반복: 올해 또는 내년 기념일
      const currentYear = today.getFullYear()
      const thisYearAnniversary = new Date(currentYear, anniversaryDate.getMonth(), anniversaryDate.getDate())

      if (thisYearAnniversary < today) {
        thisYearAnniversary.setFullYear(currentYear + 1)
      }

      const diffTime = thisYearAnniversary.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else if (repeatType === "cumulative") {
      // 누적: 기념일 기준으로 +/- 계산
      const diffTime = today.getTime() - anniversaryDate.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    return 0
  }

  // 모든 기념일 조회 (userId 파라미터를 선택적으로 만듦)
  static async getAnniversaries(userId?: string): Promise<Anniversary[]> {
    try {
      console.log("🔍 Getting anniversaries for user:", userId)

      let query = supabase.from("anniversaries").select("*")

      // userId가 제공되면 해당 사용자의 기념일만 필터링
      if (userId) {
        // UUID 형식 검증
        if (!this.isValidUUID(userId)) {
          console.error("❌ Invalid UUID format:", userId)
          return []
        }
        query = query.eq("user_id", userId)
      } else {
        // userId가 없으면 빈 배열 반환 (모든 사용자의 데이터를 보여주지 않음)
        console.log("❌ No user ID provided, returning empty array")
        return []
      }

      const { data, error } = await query.order("date", { ascending: true })

      if (error) {
        console.error("❌ Supabase error fetching anniversaries:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("✅ Successfully fetched anniversaries:", data?.length || 0, "items")
      return data || []
    } catch (error) {
      console.error("❌ Error in getAnniversaries:", error)
      throw error
    }
  }

  // UUID 유효성 검사
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // 사용자 ID를 UUID로 변환하는 함수
  static convertToUUID(oldId: string): string {
    // 이미 UUID 형식이면 그대로 반환
    if (this.isValidUUID(oldId)) {
      return oldId
    }

    // UUID가 아니면 새로 생성
    console.log("🔄 Converting non-UUID to UUID:", oldId)
    return this.generateUUID()
  }

  // 기념일 추가 - 강화된 오류 처리
  static async createAnniversary(
    anniversary: Omit<Anniversary, "id" | "created_at" | "updated_at">,
  ): Promise<Anniversary | null> {
    try {
      console.log("🚀 Creating anniversary with data:", anniversary)

      // 1. 필수 필드 확인
      if (!anniversary.name || !anniversary.name.trim()) {
        console.error("❌ Missing or empty anniversary name")
        throw new Error("기념일명을 입력해주세요")
      }

      if (!anniversary.date) {
        console.error("❌ Missing anniversary date")
        throw new Error("날짜를 선택해주세요")
      }

      if (!anniversary.user_id) {
        console.error("❌ Missing user_id")
        throw new Error("사용자 정보를 찾을 수 없습니다")
      }

      // 2. 날짜 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(anniversary.date)) {
        console.error("❌ Invalid date format:", anniversary.date)
        throw new Error("올바른 날짜 형식이 아닙니다")
      }

      // 3. 사용자 ID를 UUID 형식으로 변환
      let validUserId = anniversary.user_id
      if (!this.isValidUUID(anniversary.user_id)) {
        console.log("🔄 Converting user_id to UUID format")
        validUserId = this.convertToUUID(anniversary.user_id)
      }

      // 4. 데이터 정제
      const cleanedData = {
        name: anniversary.name.trim(),
        date: anniversary.date,
        user_id: validUserId, // UUID 형식으로 변환된 ID 사용
        is_lunar: anniversary.is_lunar || false,
        contact_name: anniversary.contact_name?.trim() || "",
        category: anniversary.category || "other",
        repeat_type: anniversary.repeat_type || "yearly",
        memo: anniversary.memo?.trim() || "",
        image_url: anniversary.image_url || "",
        is_favorite: anniversary.is_favorite || false,
        is_official: false, // 기본값 추가
        notification_enabled: anniversary.notification_enabled ?? true,
        notify_same_day: anniversary.notify_same_day ?? true,
        notify_one_day_before: anniversary.notify_one_day_before ?? true,
        notify_three_days_before: anniversary.notify_three_days_before ?? false,
        notify_five_days_before: anniversary.notify_five_days_before ?? false,
        notify_one_week_before: anniversary.notify_one_week_before ?? false,
      }

      console.log("🧹 Cleaned data:", cleanedData)

      // 5. Supabase에 저장
      const { data, error } = await supabase.from("anniversaries").insert([cleanedData]).select().single()

      if (error) {
        console.error("❌ Supabase insert error:", error)

        // 구체적인 오류 메시지 제공
        if (error.code === "23505") {
          throw new Error("이미 동일한 기념일이 존재합니다")
        } else if (error.code === "23503") {
          throw new Error("사용자 정보가 올바르지 않습니다")
        } else if (error.code === "42501") {
          throw new Error("데이터베이스 접근 권한이 없습니다")
        } else if (error.message.includes("uuid")) {
          throw new Error("사용자 ID 형식이 올바르지 않습니다")
        } else {
          throw new Error(`저장 실패: ${error.message}`)
        }
      }

      if (!data) {
        console.error("❌ No data returned from insert")
        throw new Error("저장은 성공했지만 데이터를 가져올 수 없습니다")
      }

      console.log("✅ Anniversary created successfully:", data)
      return data
    } catch (error) {
      console.error("❌ Error in createAnniversary:", error)
      throw error
    }
  }

  // 기념일 수정
  static async updateAnniversary(id: string, updates: Partial<Anniversary>): Promise<Anniversary | null> {
    try {
      console.log("🔄 Updating anniversary:", id, updates)

      if (!id || !this.isValidUUID(id)) {
        throw new Error("잘못된 기념일 ID입니다")
      }

      const { data, error } = await supabase
        .from("anniversaries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("❌ Supabase update error:", error)
        throw new Error(`수정 실패: ${error.message}`)
      }

      console.log("✅ Anniversary updated successfully:", data)
      return data
    } catch (error) {
      console.error("❌ Error in updateAnniversary:", error)
      throw error
    }
  }

  // 기념일 삭제
  static async deleteAnniversary(id: string): Promise<boolean> {
    try {
      console.log("🗑️ Deleting anniversary:", id)

      if (!id || !this.isValidUUID(id)) {
        throw new Error("잘못된 기념일 ID입니다")
      }

      const { error } = await supabase.from("anniversaries").delete().eq("id", id)

      if (error) {
        console.error("❌ Supabase delete error:", error)
        throw new Error(`삭제 실패: ${error.message}`)
      }

      console.log("✅ Anniversary deleted successfully")
      return true
    } catch (error) {
      console.error("❌ Error in deleteAnniversary:", error)
      return false
    }
  }

  // 다가오는 기념일 조회 (일회 한정, 매년 반복만)
  static async getUpcomingAnniversaries(userId?: string, limit = 5): Promise<Anniversary[]> {
    const anniversaries = await this.getAnniversaries(userId)

    return anniversaries
      .filter((ann) => ann.repeat_type !== "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: this.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .filter((anniversary) => anniversary.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, limit)
  }

  // 누적 기념일 조회
  static async getCumulativeAnniversaries(userId?: string): Promise<Anniversary[]> {
    const anniversaries = await this.getAnniversaries(userId)

    return anniversaries
      .filter((ann) => ann.repeat_type === "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: this.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .sort((a, b) => Math.abs(a.daysLeft) - Math.abs(b.daysLeft))
  }

  // 즐겨찾기 토글
  static async toggleFavorite(id: string): Promise<boolean> {
    try {
      console.log("⭐ Toggling favorite for:", id)

      const { data: current } = await supabase.from("anniversaries").select("is_favorite").eq("id", id).single()

      if (!current) {
        throw new Error("기념일을 찾을 수 없습니다")
      }

      const { error } = await supabase.from("anniversaries").update({ is_favorite: !current.is_favorite }).eq("id", id)

      if (error) {
        console.error("❌ Toggle favorite error:", error)
        throw new Error(`즐겨찾기 설정 실패: ${error.message}`)
      }

      console.log("✅ Favorite toggled successfully")
      return true
    } catch (error) {
      console.error("❌ Error in toggleFavorite:", error)
      return false
    }
  }

  // 공식 기념일 조회
  static async getOfficialHolidays(): Promise<OfficialHoliday[]> {
    const { data, error } = await supabase.from("official_holidays").select("*").order("month", { ascending: true })

    if (error) {
      console.error("Error fetching official holidays:", error)
      return []
    }

    return data || []
  }

  // 사용자별 공식 기념일 설정 조회
  static async getUserOfficialHolidays(userId: string): Promise<UserOfficialHoliday[]> {
    // UUID 유효성 검사
    if (!this.isValidUUID(userId)) {
      console.warn("Invalid UUID provided for getUserOfficialHolidays:", userId)
      return []
    }

    const { data, error } = await supabase
      .from("user_official_holidays")
      .select(`
        *,
        holiday:official_holidays(*)
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user official holidays:", error)
      return []
    }

    return data || []
  }

  // 공식 기념일 설정 추가/수정
  static async setUserOfficialHoliday(
    userId: string,
    holidayId: string,
    contactName?: string,
    isEnabled = true,
  ): Promise<boolean> {
    // UUID 유효성 검사
    if (!this.isValidUUID(userId)) {
      console.warn("Invalid UUID provided for setUserOfficialHoliday:", userId)
      return false
    }

    const { error } = await supabase.from("user_official_holidays").upsert({
      user_id: userId,
      holiday_id: holidayId,
      contact_name: contactName,
      is_enabled: isEnabled,
    })

    return !error
  }
}
