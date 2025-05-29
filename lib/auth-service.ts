import { SimpleAuthService } from "./simple-auth"

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  email_verified: boolean
  subscription_tier: "free" | "premium" | "family"
  subscription_expires_at?: string
  created_at: string
  auth_provider: "email" | "google"
  google_id?: string
}

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: any
  sessionToken?: string
  error?: string
}

// 로컬 사용자 데이터베이스 (메모리 + 로컬스토리지)
class LocalUserDatabase {
  private static STORAGE_KEY = "anniversary_users_db"
  private static SESSION_KEY = "anniversary_current_session"

  static getUsers(): User[] {
    if (typeof window === "undefined") return []

    try {
      const usersStr = localStorage.getItem(this.STORAGE_KEY)
      return usersStr ? JSON.parse(usersStr) : []
    } catch {
      return []
    }
  }

  static saveUsers(users: User[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
    } catch (error) {
      console.error("Failed to save users:", error)
    }
  }

  static addUser(user: User): void {
    const users = this.getUsers()
    users.push(user)
    this.saveUsers(users)
  }

  static findUserByEmail(email: string, authProvider?: string): User | null {
    const users = this.getUsers()
    return users.find((user) => user.email === email && (!authProvider || user.auth_provider === authProvider)) || null
  }

  static findUserByGoogleId(googleId: string): User | null {
    const users = this.getUsers()
    return users.find((user) => user.google_id === googleId) || null
  }

  static updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      this.saveUsers(users)
    }
  }

  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export class AuthService {
  /**
   * 회원가입
   */
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      const result = await SimpleAuthService.signUp(data.email, data.password, data.name)

      if (result.success && result.user) {
        return {
          success: true,
          user: result.user,
        }
      } else {
        return {
          success: false,
          error: result.error || "회원가입에 실패했습니다.",
        }
      }
    } catch (error) {
      console.error("Auth service sign up error:", error)
      return {
        success: false,
        error: "회원가입 중 오류가 발생했습니다.",
      }
    }
  }

  /**
   * 로그인
   */
  static async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const result = await SimpleAuthService.signIn(data.email, data.password)

      if (result.success && result.user) {
        return {
          success: true,
          user: result.user,
          sessionToken: result.sessionToken,
        }
      } else {
        return {
          success: false,
          error: result.error || "로그인에 실패했습니다.",
        }
      }
    } catch (error) {
      console.error("Auth service sign in error:", error)
      return {
        success: false,
        error: "로그인 중 오류가 발생했습니다.",
      }
    }
  }

  /**
   * 로그아웃
   */
  static async signOut(): Promise<void> {
    try {
      await SimpleAuthService.signOut()
    } catch (error) {
      console.error("Auth service sign out error:", error)
    }
  }

  /**
   * 현재 사용자 가져오기
   */
  static getCurrentUser() {
    return SimpleAuthService.getCurrentUser()
  }

  /**
   * 현재 사용자 설정
   */
  static setCurrentUser(user: any, sessionToken: string) {
    SimpleAuthService.setCurrentUser(user, sessionToken)
  }

  /**
   * 인증 상태 확인
   */
  static isAuthenticated(): boolean {
    return SimpleAuthService.isAuthenticated()
  }
}
