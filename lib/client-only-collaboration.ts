"use client"

import type { CollaborationUser, EditingSession, CollaborationSettings } from "@/types/collaboration"

// 클라이언트 전용 collaboration 서비스
class ClientOnlyCollaboration {
  private static instance: ClientOnlyCollaboration | null = null
  private currentUser: CollaborationUser | null = null
  private activeSessions = new Map<string, EditingSession>()
  private eventListeners = new Map<string, Function[]>()
  private settings: CollaborationSettings = {
    showOtherUsers: true,
    showCursors: true,
    showEditing: true,
    showUserNames: true,
    enableRealtimeSync: true,
    conflictResolution: "manual",
    presenceTimeout: 30000,
  }

  static getInstance(): ClientOnlyCollaboration {
    if (!ClientOnlyCollaboration.instance) {
      ClientOnlyCollaboration.instance = new ClientOnlyCollaboration()
    }
    return ClientOnlyCollaboration.instance
  }

  constructor() {
    this.loadSettings()
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem("collaboration-settings")
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error("Failed to load collaboration settings:", error)
    }
  }

  async saveSettings(settings: Partial<CollaborationSettings>) {
    this.settings = { ...this.settings, ...settings }
    localStorage.setItem("collaboration-settings", JSON.stringify(this.settings))
  }

  async setCurrentUser(user: CollaborationUser) {
    this.currentUser = user
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser
  }

  async startEditingSession(entityId: string, entityName: string, field?: string): Promise<string> {
    if (!this.currentUser) return ""

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
    this.emit("editing_started", { session, user: this.currentUser })
    return sessionId
  }

  async stopEditingSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    this.activeSessions.delete(sessionId)
    this.emit("editing_stopped", { sessionId, session })
  }

  async notifyFieldChange(sessionId: string, field: string, value: any) {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    session.field = field
    session.lastActivity = new Date().toISOString()
  }

  async notifyCursorMove(sessionId: string, field: string, position: number) {
    const session = this.activeSessions.get(sessionId)
    if (!session || !this.settings.showCursors) return

    session.cursor = { field, position }
    session.lastActivity = new Date().toISOString()
  }

  getActiveUsers(): CollaborationUser[] {
    return []
  }

  getEditingSessions(entityId?: string): EditingSession[] {
    const sessions = Array.from(this.activeSessions.values())
    return entityId ? sessions.filter((s) => s.entityId === entityId) : sessions
  }

  isUserEditing(userId: string, entityId?: string): boolean {
    const sessions = this.getEditingSessions(entityId)
    return sessions.some((s) => s.userId === userId)
  }

  getSettings(): CollaborationSettings {
    return { ...this.settings }
  }

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
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }
}

// 클라이언트 전용 인스턴스 export
export const clientOnlyCollaboration = ClientOnlyCollaboration.getInstance()
