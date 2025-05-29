import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

export class GoogleAuthService {
  private static supabase = createClientComponentClient()

  /**
   * Google OAuth 초기화
   */
  static async initializeGoogleAuth(): Promise<void> {
    if (typeof window === "undefined") return

    try {
      // Google API 스크립트 로드
      await this.loadGoogleScript()

      // Google OAuth 초기화
      await new Promise<void>((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: this.handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        resolve()
      })
    } catch (error) {
      console.error("Google Auth initialization failed:", error)
    }
  }

  /**
   * Google API 스크립트 로드
   */
  private static loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google script"))
      document.head.appendChild(script)
    })
  }

  /**
   * Google 로그인 콜백 처리
   */
  private static handleGoogleCallback = async (response: any) => {
    try {
      const credential = response.credential
      const payload = JSON.parse(atob(credential.split(".")[1]))

      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      }

      // 커스텀 이벤트 발생
      window.dispatchEvent(new CustomEvent("googleSignIn", { detail: googleUser }))
    } catch (error) {
      console.error("Google callback error:", error)
      window.dispatchEvent(new CustomEvent("googleSignInError", { detail: error }))
    }
  }

  /**
   * Google 로그인 버튼 렌더링
   */
  static renderGoogleButton(elementId: string): void {
    if (typeof window === "undefined" || !window.google) return

    window.google.accounts.id.renderButton(document.getElementById(elementId), {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
    })
  }

  /**
   * Google 사용자를 로컬 사용자로 변환 또는 생성
   */
  static async handleGoogleUser(googleUser: GoogleUser): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // 기존 사용자 확인
      const { data: existingUser } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", googleUser.email)
        .single()

      if (existingUser) {
        // 기존 사용자 로그인
        const sessionToken = await this.createSession(existingUser.id)

        // Google 정보로 프로필 업데이트
        await this.supabase
          .from("users")
          .update({
            name: googleUser.name,
            avatar_url: googleUser.picture,
            email_verified: googleUser.email_verified,
            google_id: googleUser.id,
            last_login: new Date().toISOString(),
          })
          .eq("id", existingUser.id)

        return {
          success: true,
          user: {
            ...existingUser,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            email_verified: googleUser.email_verified,
          },
          sessionToken,
        }
      } else {
        // 새 사용자 생성
        const { data: newUser, error } = await this.supabase
          .from("users")
          .insert({
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.picture,
            email_verified: googleUser.email_verified,
            google_id: googleUser.id,
            auth_provider: "google",
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        // 기본 알림 설정 생성
        await this.supabase.from("notification_settings").insert({
          user_id: newUser.id,
        })

        const sessionToken = await this.createSession(newUser.id)

        return {
          success: true,
          user: newUser,
          sessionToken,
        }
      }
    } catch (error: any) {
      console.error("Google user handling error:", error)
      return { success: false, error: error.message || "Google 로그인에 실패했습니다." }
    }
  }

  /**
   * 세션 생성
   */
  private static async createSession(userId: string): Promise<string> {
    const sessionToken = this.generateSecureToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30일 후 만료

    await this.supabase.from("user_sessions").insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    })

    return sessionToken
  }

  /**
   * 보안 토큰 생성
   */
  private static generateSecureToken(): string {
    const array = new Uint8Array(32)
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array)
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  /**
   * Google 로그아웃
   */
  static signOut(): void {
    if (typeof window !== "undefined" && window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
  }
}

// Google API 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}
