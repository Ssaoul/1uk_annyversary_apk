export interface ConflictData {
  id: string
  field: string
  localValue: any
  serverValue: any
  localTimestamp: string
  serverTimestamp: string
  conflictType: "field" | "deletion" | "creation"
}

export interface DataConflict {
  id: string
  entityType: "anniversary" | "settings" | "notification"
  entityId: string
  entityName: string
  conflicts: ConflictData[]
  localData: any
  serverData: any
  localTimestamp: string
  serverTimestamp: string
  status: "pending" | "resolved" | "auto-resolved"
  resolutionStrategy?: "local" | "server" | "merge" | "manual"
  resolvedAt?: string
  resolvedBy?: "user" | "system"
  created_at: string
}

export interface ConflictResolutionRule {
  field: string
  strategy: "local" | "server" | "latest" | "manual" | "merge"
  priority: number
}

export interface ConflictResolutionSettings {
  defaultStrategy: "local" | "server" | "latest" | "manual"
  fieldRules: ConflictResolutionRule[]
  autoResolveEnabled: boolean
  notifyOnConflict: boolean
  keepConflictHistory: boolean
}
