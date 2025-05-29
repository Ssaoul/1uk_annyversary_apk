interface CalendarEvent {
  summary: string
  description?: string
  date: string
  isRecurring?: boolean
  reminderMinutes?: number
}

interface AuthResult {
  success: boolean
  userEmail?: string
  error?: string
}

interface EventResult {
  success: boolean
  eventId?: string
  htmlLink?: string
  error?: string
}

interface GoogleConfig {
  clientId: string
  discoveryDoc: string
  scopes: string
}

export class GoogleCalendarIntegration {
  private static gapi: any = null
  private static isInitialized = false
  private static config: GoogleConfig | null = null

  /**
   * 서버에서 설정 가져오기
   */
  private static async getConfig(): Promise<GoogleConfig> {
    if (this.config) return this.config

    try {
      const response = await fetch("/api/calendar/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getConfig" }),
      })

      const data = await response.json()
      if (data.success) {
        this.config = data.config
        return this.config
      } else {
        throw new Error("Failed to get calendar config")
      }
    } catch (error) {
      console.error("Config fetch error:", error)
      // 폴백 설정 (데모 모드)
      this.config = {
        clientId: "demo-client-id",
        discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        scopes: "https://www.googleapis.com/auth/calendar.events",
      }
      return this.config
    }
  }

  /**
   * Google API 초기화
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const config = await this.getConfig()

      if (typeof window !== "undefined") {
        // Google API 스크립트 동적 로드
        if (!(window as any).gapi) {
          await this.loadGoogleAPI()
        }

        this.gapi = (window as any).gapi

        await new Promise<void>((resolve) => {
          this.gapi.load("client:auth2", resolve)
        })

        await this.gapi.client.init({
          clientId: config.clientId,
          discoveryDocs: [config.discoveryDoc],
          scope: config.scopes,
        })

        this.isInitialized = true
      }
    } catch (error) {
      console.error("Google API 초기화 실패:", error)
      // 데모 모드로 폴백
      this.initializeDemoMode()
    }
  }

  /**
   * Google API 스크립트 로드
   */
  private static loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).gapi) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google API"))
      document.head.appendChild(script)
    })
  }

  /**
   * 데모 모드 초기화
   */
  private static initializeDemoMode(): void {
    if (typeof window !== "undefined") {
      ;(window as any).gapi = {
        load: (api: string, callback: () => void) => {
          setTimeout(callback, 100)
        },
        client: {
          init: async (config: any) => {
            console.log("Google API 초기화 (데모 모드):", config)
            return Promise.resolve()
          },
        },
        auth2: {
          getAuthInstance: () => ({
            isSignedIn: {
              get: () => false,
            },
            signIn: async () => {
              console.log("Google 로그인 (데모 모드)")
              return {
                getBasicProfile: () => ({
                  getEmail: () => "demo@example.com",
                  getName: () => "데모 사용자",
                }),
                getAuthResponse: () => ({
                  access_token: "demo-access-token",
                }),
              }
            },
            signOut: async () => {
              console.log("Google 로그아웃 (데모 모드)")
            },
            currentUser: {
              get: () => ({
                getBasicProfile: () => ({
                  getEmail: () => "demo@example.com",
                  getName: () => "데모 사용자",
                }),
                getAuthResponse: () => ({
                  access_token: "demo-access-token",
                }),
              }),
            },
          }),
        },
      }

      this.gapi = (window as any).gapi
      this.isInitialized = true
    }
  }

  /**
   * 인증 상태 확인
   */
  static async checkAuthStatus(): Promise<{ isAuthenticated: boolean; userEmail?: string }> {
    try {
      await this.initialize()

      const authInstance = this.gapi.auth2.getAuthInstance()
      const isSignedIn = authInstance.isSignedIn.get()

      if (isSignedIn) {
        const user = authInstance.currentUser.get()
        const profile = user.getBasicProfile()
        return {
          isAuthenticated: true,
          userEmail: profile.getEmail(),
        }
      }

      return { isAuthenticated: false }
    } catch (error) {
      console.error("인증 상태 확인 실패:", error)
      return { isAuthenticated: false }
    }
  }

  /**
   * Google 계정 인증
   */
  static async authenticate(): Promise<AuthResult> {
    try {
      await this.initialize()

      const authInstance = this.gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn()
      const profile = user.getBasicProfile()

      return {
        success: true,
        userEmail: profile.getEmail(),
      }
    } catch (error: any) {
      console.error("Google 인증 실패:", error)
      return {
        success: false,
        error: error.message || "인증에 실패했습니다",
      }
    }
  }

  /**
   * Google 계정 로그아웃
   */
  static async signOut(): Promise<void> {
    try {
      if (this.gapi && this.gapi.auth2) {
        const authInstance = this.gapi.auth2.getAuthInstance()
        await authInstance.signOut()
      }
    } catch (error) {
      console.error("로그아웃 실패:", error)
      throw error
    }
  }

  /**
   * 캘린더 이벤트 생성 (서버 API 사용)
   */
  static async createEvent(eventData: CalendarEvent): Promise<EventResult> {
    try {
      await this.initialize()

      // 인증 확인
      const authStatus = await this.checkAuthStatus()
      if (!authStatus.isAuthenticated) {
        throw new Error("Google 계정에 로그인이 필요합니다")
      }

      // 액세스 토큰 가져오기
      const authInstance = this.gapi.auth2.getAuthInstance()
      const user = authInstance.currentUser.get()
      const authResponse = user.getAuthResponse()
      const accessToken = authResponse.access_token

      // 데모 모드 체크
      if (accessToken === "demo-access-token") {
        console.log("캘린더 이벤트 생성 (데모 모드):", eventData)
        return {
          success: true,
          eventId: "demo-event-" + Date.now(),
          htmlLink: "https://calendar.google.com/demo",
        }
      }

      // 서버 API를 통해 이벤트 생성
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventData,
          accessToken,
        }),
      })

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          eventId: result.eventId,
          htmlLink: result.htmlLink,
        }
      } else {
        throw new Error(result.error || "Failed to create event")
      }
    } catch (error: any) {
      console.error("캘린더 이벤트 생성 실패:", error)
      return {
        success: false,
        error: error.message || "이벤트 생성에 실패했습니다",
      }
    }
  }

  /**
   * API 지원 여부 확인
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && window.location.protocol === "https:"
  }

  /**
   * 환경 정보 반환
   */
  static getEnvironmentInfo() {
    const isHTTPS = typeof window !== "undefined" && window.location.protocol === "https:"
    const hasClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "demo-client-id"

    return {
      isHTTPS,
      hasClientId,
      isSupported: this.isSupported(),
      isDemoMode: !hasClientId,
    }
  }
}
