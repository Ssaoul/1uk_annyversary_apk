import type { CollaborationUser, EditingSession, PresenceIndicator, CollaborationSettings } from "@/types/collaboration"

// 브라우저 환경에서만 Supabase 클라이언트 생성
const getSupabaseClient = async () => {
  if (typeof window === "undefined") return null
  try {
    const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs")
    return createClientComponentClient()
  } catch (error) {
    console.error("Failed to load Supabase client:", error)
    return null
  }
}

export class RealtimeCollaboration {
  private static instance: RealtimeCollaboration | null = null
  private currentUser: CollaborationUser | null = null
  private activeSessions = new Map<string, EditingSession>()
  private presenceIndicators = new Map<string, PresenceIndicator>()
  private eventListeners = new Map<string, Function[]>()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private presenceChannel: any = null
  private editingChannel: any = null
  private supabaseClient: any = null
  private settings: CollaborationSettings = {
    showOtherUsers: true,
    showCursors: true,
    showEditing: true,
    showUserNames: true,
    enableRealtimeSync: true,
    conflictResolution: "manual",
    presenceTimeout: 30000, // 30초
  }

  constructor() {
    // 브라우저 환경에서만 초기화
    if (typeof window !== "undefined") {
      this.init()
    }
  }

  static getInstance(): RealtimeCollaboration {
    // 서버사이드에서는 더미 객체 반환
    if (typeof window === "undefined") {
      return {
        setCurrentUser: async () => {},
        getCurrentUser: () => null,
        startEditingSession: async () => "",
        stopEditingSession: async () => {},
        notifyFieldChange: async () => {},
        notifyCursorMove: async () => {},
        getActiveUsers: () => [],
        getEditingSessions: () => [],
        isUserEditing: () => false,
        getSettings: () => ({
          showOtherUsers: true,
          showCursors: true,
          showEditing: true,
          showUserNames: true,
          enableRealtimeSync: true,
          conflictResolution: "manual",
          presenceTimeout: 30000,
        }),
        saveSettings: async () => {},
        on: () => {},
        off: () => {},
      } as any
    }

    if (!RealtimeCollaboration.instance) {
      RealtimeCollaboration.instance = new RealtimeCollaboration()
    }
    return RealtimeCollaboration.instance
  }

  private async init() {
    if (typeof window === "undefined") return

    try {
      await this.loadSettings()
      await this.initializeSupabaseClient()
      this.setupRealtimeChannels()
      this.startHeartbeat()
      this.setupEventListeners()
    } catch (error) {
      console.error("Failed to initialize collaboration:", error)
    }
  }

  private async initializeSupabaseClient() {
    try {
      this.supabaseClient = await getSupabaseClient()
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
    }
  }

  private async loadSettings() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("collaboration-settings")
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) }
        }
      }
    } catch (error) {
      console.error("Failed to load collaboration settings:", error)
    }
  }

  async saveSettings(settings: Partial<CollaborationSettings>) {
    this.settings = { ...this.settings, ...settings }
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("collaboration-settings", JSON.stringify(this.settings))
      } catch (error) {
        console.error("Failed to save collaboration settings:", error)
      }
    }
  }

  // 사용자 설정
  async setCurrentUser(user: CollaborationUser) {
    this.currentUser = user
    await this.updatePresence()
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser
  }

  // 실시간 채널 설정
  private setupRealtimeChannels() {
    if (typeof window === "undefined" || !this.supabaseClient) return

    try {
      // 프레즌스 채널 (사용자 온라인 상태)
      this.presenceChannel = this.supabaseClient.channel("presence", {
        config: {
          presence: {
            key: this.currentUser?.id || "anonymous",
          },
        },
      })

      this.presenceChannel
        .on("presence", { event: "sync" }, () => {
          this.handlePresenceSync()
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          this.handleUserJoined(newPresences)
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          this.handleUserLeft(leftPresences)
        })
        .subscribe()

      // 편집 채널 (실시간 편집 이벤트)
      this.editingChannel = this.supabaseClient.channel("editing")

      this.editingChannel
        .on("broadcast", { event: "editing_started" }, (payload) => {
          this.handleEditingStarted(payload)
        })
        .on("broadcast", { event: "editing_stopped" }, (payload) => {
          this.handleEditingStopped(payload)
        })
        .on("broadcast", { event: "field_changed" }, (payload) => {
          this.handleFieldChanged(payload)
        })
        .on("broadcast", { event: "cursor_moved" }, (payload) => {
          this.handleCursorMoved(payload)
        })
        .subscribe()
    } catch (error) {
      console.error("Failed to setup realtime channels:", error)
    }
  }

  // 하트비트 시작
  private startHeartbeat() {
    if (typeof window === "undefined") return

    this.heartbeatInterval = setInterval(() => {
      this.updatePresence()
      this.cleanupInactiveSessions()
    }, 10000) // 10초마다
  }

  // 이벤트 리스너 설정
  private setupEventListeners() {
    if (typeof window === "undefined") return

    try {
      // 서비스 워커 메시지 리스너
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          this.handleServiceWorkerMessage(event.data)
        })
      }

      // 온라인 상태 변경 리스너
      window.addEventListener("online", () => {
        this.triggerSync()
      })

      // 페이지 가시성 변경 리스너
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden && navigator.onLine) {
            this.triggerSync()
          }
        })
      }

      // 페이지 언로드 시 정리
      window.addEventListener("beforeunload", () => {
        this.cleanup()
      })
    } catch (error) {
      console.error("Failed to setup event listeners:", error)
    }
  }

  // 프레즌스 업데이트
  private async updatePresence() {
    if (!this.currentUser || !this.presenceChannel) return

    try {
      await this.presenceChannel.track({
        user: this.currentUser,
        online_at: new Date().toISOString(),
        editing: Array.from(this.activeSessions.values()),
      })
    } catch (error) {
      console.error("Failed to update presence:", error)
    }
  }

  // 편집 세션 시작
  async startEditingSession(entityId: string, entityName: string, field?: string): Promise<string> {
    if (!this.currentUser) return ""

    try {
      const sessionId = `${this.currentUser.id}-${entityId}-${Date.now()}`
      const session: EditingSession = {
        id: sessionId,
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        userColor: this.currentUser.color,
        entityType: "anniversary",
        entityId,
        entityName,
        field,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }

      this.activeSessions.set(sessionId, session)

      // 다른 사용자에게 알림
      if (this.editingChannel) {
        await this.editingChannel.send({
          type: "broadcast",
          event: "editing_started",
          payload: {
            session,
            user: this.currentUser,
          },
        })
      }

      this.emit("editing_started", { session, user: this.currentUser })
      return sessionId
    } catch (error) {
      console.error("Failed to start editing session:", error)
      return ""
    }
  }

  // 편집 세션 종료
  async stopEditingSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    try {
      this.activeSessions.delete(sessionId)

      // 다른 사용자에게 알림
      if (this.editingChannel) {
        await this.editingChannel.send({
          type: "broadcast",
          event: "editing_stopped",
          payload: {
            sessionId,
            userId: session.userId,
            entityId: session.entityId,
          },
        })
      }

      this.emit("editing_stopped", { sessionId, session })
    } catch (error) {
      console.error("Failed to stop editing session:", error)
    }
  }

  // 필드 변경 알림
  async notifyFieldChange(sessionId: string, field: string, value: any) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    try {
      session.field = field
      session.lastActivity = new Date().toISOString()

      if (this.editingChannel) {
        await this.editingChannel.send({
          type: "broadcast",
          event: "field_changed",
          payload: {
            sessionId,
            userId: session.userId,
            entityId: session.entityId,
            field,
            value,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      console.error("Failed to notify field change:", error)
    }
  }

  // 커서 위치 알림
  async notifyCursorMove(sessionId: string, field: string, position: number) {
    const session = this.activeSessions.get(sessionId)
    if (!session || !this.settings.showCursors) return

    try {
      session.cursor = { field, position }
      session.lastActivity = new Date().toISOString()

      if (this.editingChannel) {
        await this.editingChannel.send({
          type: "broadcast",
          event: "cursor_moved",
          payload: {
            sessionId,
            userId: session.userId,
            entityId: session.entityId,
            field,
            position,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      console.error("Failed to notify cursor move:", error)
    }
  }

  // 이벤트 핸들러들
  private handlePresenceSync() {
    try {
      const state = this.presenceChannel?.presenceState()
      const users: CollaborationUser[] = []

      Object.values(state || {}).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          if (presence.user && presence.user.id !== this.currentUser?.id) {
            users.push({
              ...presence.user,
              isOnline: true,
              lastSeen: presence.online_at,
            })
          }
        })
      })

      this.emit("users_updated", users)
    } catch (error) {
      console.error("Failed to handle presence sync:", error)
    }
  }

  private handleUserJoined(newPresences: any[]) {
    try {
      newPresences.forEach((presence) => {
        if (presence.user && presence.user.id !== this.currentUser?.id) {
          this.emit("user_joined", {
            user: presence.user,
            timestamp: new Date().toISOString(),
          })
        }
      })
    } catch (error) {
      console.error("Failed to handle user joined:", error)
    }
  }

  private handleUserLeft(leftPresences: any[]) {
    try {
      leftPresences.forEach((presence) => {
        if (presence.user && presence.user.id !== this.currentUser?.id) {
          this.emit("user_left", {
            user: presence.user,
            timestamp: new Date().toISOString(),
          })
        }
      })
    } catch (error) {
      console.error("Failed to handle user left:", error)
    }
  }

  private handleEditingStarted(payload: any) {
    try {
      const { session, user } = payload.payload
      if (user.id === this.currentUser?.id) return

      this.emit("other_user_editing_started", { session, user })
    } catch (error) {
      console.error("Failed to handle editing started:", error)
    }
  }

  private handleEditingStopped(payload: any) {
    try {
      const { sessionId, userId, entityId } = payload.payload
      if (userId === this.currentUser?.id) return

      this.emit("other_user_editing_stopped", { sessionId, userId, entityId })
    } catch (error) {
      console.error("Failed to handle editing stopped:", error)
    }
  }

  private handleFieldChanged(payload: any) {
    try {
      const { sessionId, userId, entityId, field, value, timestamp } = payload.payload
      if (userId === this.currentUser?.id) return

      this.emit("other_user_field_changed", {
        sessionId,
        userId,
        entityId,
        field,
        value,
        timestamp,
      })
    } catch (error) {
      console.error("Failed to handle field changed:", error)
    }
  }

  private handleCursorMoved(payload: any) {
    try {
      const { sessionId, userId, entityId, field, position, timestamp } = payload.payload
      if (userId === this.currentUser?.id || !this.settings.showCursors) return

      this.emit("other_user_cursor_moved", {
        sessionId,
        userId,
        entityId,
        field,
        position,
        timestamp,
      })
    } catch (error) {
      console.error("Failed to handle cursor moved:", error)
    }
  }

  // 비활성 세션 정리
  private cleanupInactiveSessions() {
    try {
      const now = Date.now()
      const timeout = this.settings.presenceTimeout

      for (const [sessionId, session] of this.activeSessions.entries()) {
        const lastActivity = new Date(session.lastActivity).getTime()
        if (now - lastActivity > timeout) {
          this.stopEditingSession(sessionId)
        }
      }
    } catch (error) {
      console.error("Failed to cleanup inactive sessions:", error)
    }
  }

  // 정리
  private cleanup() {
    try {
      // 모든 활성 세션 종료
      for (const sessionId of this.activeSessions.keys()) {
        this.stopEditingSession(sessionId)
      }

      // 채널 정리
      this.presenceChannel?.unsubscribe()
      this.editingChannel?.unsubscribe()

      // 하트비트 정리
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
      }
    } catch (error) {
      console.error("Failed to cleanup collaboration:", error)
    }
  }

  // 이벤트 시스템
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    try {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(data)
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error)
          }
        })
      }
    } catch (error) {
      console.error("Failed to emit event:", error)
    }
  }

  // 공개 메서드들
  getActiveUsers(): CollaborationUser[] {
    if (typeof window === "undefined") return []

    try {
      const state = this.presenceChannel?.presenceState()
      const users: CollaborationUser[] = []

      Object.values(state || {}).forEach((presences: any[]) => {
        presences.forEach((presence) => {
          if (presence.user && presence.user.id !== this.currentUser?.id) {
            users.push({
              ...presence.user,
              isOnline: true,
              lastSeen: presence.online_at,
            })
          }
        })
      })

      return users
    } catch (error) {
      console.error("Failed to get active users:", error)
      return []
    }
  }

  getEditingSessions(entityId?: string): EditingSession[] {
    try {
      const sessions = Array.from(this.activeSessions.values())
      return entityId ? sessions.filter((s) => s.entityId === entityId) : sessions
    } catch (error) {
      console.error("Failed to get editing sessions:", error)
      return []
    }
  }

  isUserEditing(userId: string, entityId?: string): boolean {
    try {
      const sessions = this.getEditingSessions(entityId)
      return sessions.some((s) => s.userId === userId)
    } catch (error) {
      console.error("Failed to check if user is editing:", error)
      return false
    }
  }

  getSettings(): CollaborationSettings {
    return { ...this.settings }
  }

  private async triggerSync() {
    if (typeof window !== "undefined") {
      try {
        await this.initializeSupabaseClient()
        this.setupRealtimeChannels()
      } catch (error) {
        console.error("Failed to trigger sync:", error)
      }
    }
  }

  private handleServiceWorkerMessage(data: any) {
    try {
      if (data.type === "sync") {
        this.triggerSync()
      }
    } catch (error) {
      console.error("Failed to handle service worker message:", error)
    }
  }
}

// Export the singleton instance - 브라우저에서만 생성
export const realtimeCollaboration = RealtimeCollaboration.getInstance()
