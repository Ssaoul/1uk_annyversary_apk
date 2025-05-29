"use client"

interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export class SimpleAuthService {
  private static readonly STORAGE_KEY = "anniversary_user"

  // UUID 생성 함수
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // 사용자 등록
  static async register(email: string, password: string, name?: string): Promise<User | null> {
    try {
      console.log("🔐 Registering user:", email)

      // 이미 존재하는 사용자인지 확인
      const existingUsers = this.getAllUsers()
      const existingUser = existingUsers.find((user) => user.email === email)

      if (existingUser) {
        throw new Error("이미 등록된 이메일입니다")
      }

      // UUID 형식의 새 사용자 생성
      const newUser: User = {
        id: this.generateUUID(), // UUID 형식으로 생성
        email,
        name: name || email.split("@")[0],
        created_at: new Date().toISOString(),
      }

      // 사용자 목록에 추가
      const updatedUsers = [...existingUsers, newUser]
      localStorage.setItem("anniversary_all_users", JSON.stringify(updatedUsers))

      // 현재 사용자로 설정
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUser))

      console.log("✅ User registered successfully:", newUser)
      return newUser
    } catch (error) {
      console.error("❌ Registration error:", error)
      throw error
    }
  }

  // 사용자 로그인
  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log("🔐 Logging in user:", email)

      // 데모 계정 처리
      if (email === "demo@example.com") {
        const demoUser: User = {
          id: "550e8400-e29b-41d4-a716-446655440000", // 고정된 UUID
          email: "demo@example.com",
          name: "데모 사용자",
          created_at: new Date().toISOString(),
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(demoUser))
        console.log("✅ Demo user logged in:", demoUser)
        return demoUser
      }

      // 일반 사용자 로그인
      const allUsers = this.getAllUsers()
      const user = allUsers.find((u) => u.email === email)

      if (!user) {
        throw new Error("등록되지 않은 이메일입니다")
      }

      // UUID 형식이 아닌 기존 사용자 ID를 UUID로 변환
      if (!this.isValidUUID(user.id)) {
        console.log("🔄 Converting old user ID to UUID format")
        user.id = this.generateUUID()

        // 업데이트된 사용자 정보 저장
        const updatedUsers = allUsers.map((u) => (u.email === email ? user : u))
        localStorage.setItem("anniversary_all_users", JSON.stringify(updatedUsers))
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
      console.log("✅ User logged in successfully:", user)
      return user
    } catch (error) {
      console.error("❌ Login error:", error)
      throw error
    }
  }

  // UUID 유효성 검사
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // 현재 로그인한 사용자 가져오기
  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY)
      if (!userStr) return null

      const user = JSON.parse(userStr)

      // UUID 형식이 아닌 경우 변환
      if (!this.isValidUUID(user.id)) {
        console.log("🔄 Converting current user ID to UUID format")
        user.id = this.generateUUID()
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error("❌ Error getting current user:", error)
      return null
    }
  }

  // 모든 사용자 가져오기
  private static getAllUsers(): User[] {
    try {
      const usersStr = localStorage.getItem("anniversary_all_users")
      return usersStr ? JSON.parse(usersStr) : []
    } catch (error) {
      console.error("❌ Error getting all users:", error)
      return []
    }
  }

  // 로그아웃
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    console.log("✅ User logged out")
  }

  // 로그인 상태 확인
  static isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  }

  // 사용자 정보 업데이트
  static async updateUser(updates: Partial<User>): Promise<User | null> {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        throw new Error("로그인된 사용자가 없습니다")
      }

      const updatedUser = { ...currentUser, ...updates }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser))

      // 전체 사용자 목록도 업데이트
      const allUsers = this.getAllUsers()
      const updatedUsers = allUsers.map((user) => (user.email === currentUser.email ? updatedUser : user))
      localStorage.setItem("anniversary_all_users", JSON.stringify(updatedUsers))

      console.log("✅ User updated successfully:", updatedUser)
      return updatedUser
    } catch (error) {
      console.error("❌ Error updating user:", error)
      throw error
    }
  }

  // 계정 삭제
  static async deleteAccount(): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        throw new Error("로그인된 사용자가 없습니다")
      }

      // 현재 사용자 정보 삭제
      localStorage.removeItem(this.STORAGE_KEY)

      // 전체 사용자 목록에서도 삭제
      const allUsers = this.getAllUsers()
      const updatedUsers = allUsers.filter((user) => user.email !== currentUser.email)
      localStorage.setItem("anniversary_all_users", JSON.stringify(updatedUsers))

      console.log("✅ Account deleted successfully")
      return true
    } catch (error) {
      console.error("❌ Error deleting account:", error)
      return false
    }
  }
}
