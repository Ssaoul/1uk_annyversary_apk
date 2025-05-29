"use client"

import { useState, useEffect } from "react"
import { AnniversaryService } from "@/lib/anniversary-service"
import type { Anniversary } from "@/types/anniversary"
import { SimpleAuthService } from "@/lib/simple-auth"
import { toast } from "sonner"

// 데모 사용자 ID는 상수로 정의
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

export function useAnniversaries() {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = SimpleAuthService.getCurrentUser()
  const userId = currentUser?.id || null

  const fetchAnniversaries = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Fetching anniversaries for user:", userId)

      // 로그인한 사용자의 ID로 기념일 필터링
      // 데모 계정(demo@example.com)인 경우에만 데모 데이터 표시
      const isDemo = currentUser?.email === "demo@example.com"
      const userIdToUse = isDemo ? DEMO_USER_ID : userId

      console.log("📊 Using user ID:", userIdToUse, "isDemo:", isDemo)

      if (!userIdToUse) {
        console.log("❌ No user ID available")
        setAnniversaries([])
        return
      }

      const data = await AnniversaryService.getAnniversaries(userIdToUse)
      console.log("✅ Fetched anniversaries:", data.length, "items")

      setAnniversaries(data)
    } catch (err) {
      console.error("❌ Error fetching anniversaries:", err)
      const errorMessage = err instanceof Error ? err.message : "기념일을 불러오는데 실패했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const addAnniversary = async (anniversary: Omit<Anniversary, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("🚀 Adding anniversary:", anniversary)

      // 현재 로그인한 사용자의 ID 사용
      const isDemo = currentUser?.email === "demo@example.com"
      const userIdToUse = isDemo ? DEMO_USER_ID : userId

      if (!userIdToUse) {
        const errorMsg = "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요."
        console.error("❌", errorMsg)
        setError(errorMsg)
        toast.error(errorMsg)
        return null
      }

      // 사용자 정보 확인
      console.log("👤 Current user:", {
        id: userIdToUse,
        email: currentUser?.email,
        isDemo,
      })

      const newAnniversary = await AnniversaryService.createAnniversary({
        ...anniversary,
        user_id: userIdToUse,
      })

      if (newAnniversary) {
        console.log("✅ Anniversary added successfully:", newAnniversary)
        setAnniversaries((prev) => [...prev, newAnniversary])
        toast.success("기념일이 성공적으로 추가되었습니다!")
        return newAnniversary
      } else {
        console.error("❌ Failed to add anniversary, no data returned")
        const errorMsg = "기념일 추가에 실패했습니다."
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error("❌ Error adding anniversary:", err)
      const errorMessage = err instanceof Error ? err.message : "기념일 추가에 실패했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    }
    return null
  }

  const updateAnniversary = async (id: string, updates: Partial<Anniversary>) => {
    try {
      console.log("🔄 Updating anniversary:", id, updates)

      const updatedAnniversary = await AnniversaryService.updateAnniversary(id, updates)
      if (updatedAnniversary) {
        setAnniversaries((prev) => prev.map((ann) => (ann.id === id ? updatedAnniversary : ann)))
        toast.success("기념일이 수정되었습니다!")
        return updatedAnniversary
      }
    } catch (err) {
      console.error("❌ Error updating anniversary:", err)
      const errorMessage = err instanceof Error ? err.message : "기념일 수정에 실패했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    }
    return null
  }

  const deleteAnniversary = async (id: string) => {
    try {
      console.log("🗑️ Deleting anniversary:", id)

      const success = await AnniversaryService.deleteAnniversary(id)
      if (success) {
        setAnniversaries((prev) => prev.filter((ann) => ann.id !== id))
        toast.success("기념일이 삭제되었습니다!")
        return true
      }
    } catch (err) {
      console.error("❌ Error deleting anniversary:", err)
      const errorMessage = err instanceof Error ? err.message : "기념일 삭제에 실패했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    }
    return false
  }

  const toggleFavorite = async (id: string) => {
    try {
      console.log("⭐ Toggling favorite:", id)

      const success = await AnniversaryService.toggleFavorite(id)
      if (success) {
        setAnniversaries((prev) => prev.map((ann) => (ann.id === id ? { ...ann, is_favorite: !ann.is_favorite } : ann)))
        toast.success("즐겨찾기가 변경되었습니다!")
        return true
      }
    } catch (err) {
      console.error("❌ Error toggling favorite:", err)
      const errorMessage = err instanceof Error ? err.message : "즐겨찾기 설정에 실패했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
    }
    return false
  }

  const getUpcomingAnniversaries = () => {
    return anniversaries
      .filter((ann) => ann.repeat_type !== "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: AnniversaryService.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .filter((anniversary) => anniversary.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }

  const getCumulativeAnniversaries = () => {
    return anniversaries
      .filter((ann) => ann.repeat_type === "cumulative")
      .map((anniversary) => ({
        ...anniversary,
        daysLeft: AnniversaryService.calculateDaysLeft(anniversary.date, anniversary.repeat_type),
      }))
      .sort((a, b) => Math.abs(a.daysLeft) - Math.abs(b.daysLeft))
  }

  const getAnniversariesByType = (type: string) => {
    return anniversaries.filter((anniversary) => anniversary.category === type)
  }

  useEffect(() => {
    if (userId || currentUser?.email === "demo@example.com") {
      fetchAnniversaries()
    } else {
      console.log("❌ No user logged in, skipping fetch")
      setLoading(false)
    }
  }, [userId, currentUser?.email]) // userId가 변경될 때마다 다시 불러오기

  return {
    anniversaries,
    loading,
    error,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    toggleFavorite,
    getUpcomingAnniversaries,
    getCumulativeAnniversaries,
    getAnniversariesByType,
    refetch: fetchAnniversaries,
  }
}
