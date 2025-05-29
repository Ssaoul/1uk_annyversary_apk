export interface CollaborationUser {
  id: string
  name: string
  email?: string
  avatar?: string
  color: string
  isOnline: boolean
  lastSeen: string
}

export interface EditingSession {
  id: string
  userId: string
  userName: string
  userColor: string
  entityType: "anniversary"
  entityId: string
  entityName: string
  field?: string
  startedAt: string
  lastActivity: string
  cursor?: {
    field: string
    position: number
  }
  selection?: {
    field: string
    start: number
    end: number
  }
}

export interface RealtimeEdit {
  id: string
  sessionId: string
  userId: string
  entityId: string
  field: string
  operation: "insert" | "delete" | "replace"
  position: number
  content: string
  timestamp: string
}

export interface CollaborationEvent {
  type: "user_joined" | "user_left" | "editing_started" | "editing_stopped" | "field_changed" | "cursor_moved"
  userId: string
  userName: string
  entityId?: string
  field?: string
  data?: any
  timestamp: string
}

export interface PresenceIndicator {
  userId: string
  userName: string
  userColor: string
  field: string
  type: "editing" | "viewing" | "cursor"
  position?: number
  lastUpdate: string
}

export interface CollaborationSettings {
  showOtherUsers: boolean
  showCursors: boolean
  showEditing: boolean
  showUserNames: boolean
  enableRealtimeSync: boolean
  conflictResolution: "manual" | "auto" | "last-writer-wins"
  presenceTimeout: number // milliseconds
}
