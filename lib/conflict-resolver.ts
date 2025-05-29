import { offlineStorage } from "./offline-storage"
import type { DataConflict, ConflictData, ConflictResolutionSettings } from "@/types/conflict"
import type { Anniversary } from "@/types/anniversary"

export interface ConflictResolutionRule {
  field: string
  strategy: "local" | "server" | "latest" | "merge" | "manual"
  priority: number
}

export class ConflictResolver {
  private static instance: ConflictResolver
  private settings: ConflictResolutionSettings = {
    defaultStrategy: "latest",
    fieldRules: [
      { field: "name", strategy: "manual", priority: 1 },
      { field: "date", strategy: "manual", priority: 1 },
      { field: "memo", strategy: "merge", priority: 2 },
      { field: "is_favorite", strategy: "latest", priority: 3 },
      { field: "image_url", strategy: "latest", priority: 3 },
      { field: "notification_enabled", strategy: "latest", priority: 3 },
    ],
    autoResolveEnabled: true,
    notifyOnConflict: true,
    keepConflictHistory: true,
  }

  constructor() {
    this.loadSettings()
  }

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver()
    }
    return ConflictResolver.instance
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await offlineStorage.getSetting("conflictResolutionSettings")
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings }
      }
    } catch (error) {
      console.error("Failed to load conflict resolution settings:", error)
    }
  }

  async saveSettings(settings: Partial<ConflictResolutionSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }
    await offlineStorage.saveSetting("conflictResolutionSettings", this.settings)
  }

  // 데이터 충돌 감지
  async detectConflicts(localData: Anniversary, serverData: Anniversary): Promise<DataConflict | null> {
    if (!localData || !serverData) return null

    // 타임스탬프 비교
    const localTimestamp = new Date(localData.updated_at).getTime()
    const serverTimestamp = new Date(serverData.updated_at).getTime()

    // 동일한 타임스탬프면 충돌 없음
    if (localTimestamp === serverTimestamp) return null

    // 필드별 충돌 감지
    const conflicts: ConflictData[] = []
    const fieldsToCheck = [
      "name",
      "date",
      "is_lunar",
      "contact_name",
      "category",
      "repeat_type",
      "memo",
      "image_url",
      "is_favorite",
      "notification_enabled",
      "notify_same_day",
      "notify_one_day_before",
      "notify_three_days_before",
      "notify_five_days_before",
      "notify_one_week_before",
    ]

    for (const field of fieldsToCheck) {
      if (this.hasFieldConflict(localData[field], serverData[field])) {
        conflicts.push({
          id: `${localData.id}-${field}`,
          field,
          localValue: localData[field],
          serverValue: serverData[field],
          localTimestamp: localData.updated_at,
          serverTimestamp: serverData.updated_at,
          conflictType: "field",
        })
      }
    }

    if (conflicts.length === 0) return null

    const conflict: DataConflict = {
      id: `conflict-${localData.id}-${Date.now()}`,
      entityType: "anniversary",
      entityId: localData.id,
      entityName: localData.name,
      conflicts,
      localData,
      serverData,
      localTimestamp: localData.updated_at,
      serverTimestamp: serverData.updated_at,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    // 자동 해결 시도
    if (this.settings.autoResolveEnabled) {
      const autoResolved = await this.attemptAutoResolution(conflict)
      if (autoResolved) {
        conflict.status = "auto-resolved"
        conflict.resolvedAt = new Date().toISOString()
        conflict.resolvedBy = "system"
      }
    }

    // 충돌 저장
    await this.saveConflict(conflict)

    return conflict
  }

  // 필드 충돌 확인
  private hasFieldConflict(localValue: any, serverValue: any): boolean {
    // null/undefined 처리
    if (localValue == null && serverValue == null) return false
    if (localValue == null || serverValue == null) return true

    // 타입별 비교
    if (typeof localValue !== typeof serverValue) return true

    // 객체/배열 비교
    if (typeof localValue === "object") {
      return JSON.stringify(localValue) !== JSON.stringify(serverValue)
    }

    // 기본 타입 비교
    return localValue !== serverValue
  }

  // 자동 해결 시도
  private async attemptAutoResolution(conflict: DataConflict): Promise<boolean> {
    try {
      const resolvedData = { ...conflict.localData }
      let hasResolution = true

      for (const conflictData of conflict.conflicts) {
        const rule = this.getFieldRule(conflictData.field)
        const strategy = rule?.strategy || this.settings.defaultStrategy

        switch (strategy) {
          case "local":
            // 로컬 값 유지 (이미 설정됨)
            break

          case "server":
            resolvedData[conflictData.field] = conflictData.serverValue
            break

          case "latest":
            const localTime = new Date(conflictData.localTimestamp).getTime()
            const serverTime = new Date(conflictData.serverTimestamp).getTime()
            if (serverTime > localTime) {
              resolvedData[conflictData.field] = conflictData.serverValue
            }
            break

          case "merge":
            const merged = this.mergeValues(conflictData.localValue, conflictData.serverValue, conflictData.field)
            if (merged !== null) {
              resolvedData[conflictData.field] = merged
            } else {
              hasResolution = false
            }
            break

          case "manual":
            hasResolution = false
            break

          default:
            hasResolution = false
        }

        if (!hasResolution) break
      }

      if (hasResolution) {
        // 해결된 데이터 저장
        resolvedData.updated_at = new Date().toISOString()
        await offlineStorage.saveAnniversary(resolvedData)

        // 해결 전략 기록
        conflict.resolutionStrategy = "merge"
        return true
      }

      return false
    } catch (error) {
      console.error("Auto resolution failed:", error)
      return false
    }
  }

  // 필드별 규칙 조회
  private getFieldRule(field: string): ConflictResolutionRule | undefined {
    return this.settings.fieldRules.find((rule) => rule.field === field)
  }

  // 값 병합
  private mergeValues(localValue: any, serverValue: any, field: string): any {
    switch (field) {
      case "memo":
        // 메모는 두 값을 합치기
        if (typeof localValue === "string" && typeof serverValue === "string") {
          if (localValue.includes(serverValue) || serverValue.includes(localValue)) {
            return localValue.length > serverValue.length ? localValue : serverValue
          }
          return `${localValue}\n\n--- 서버에서 병합 ---\n${serverValue}`
        }
        break

      case "is_favorite":
        // 즐겨찾기는 true 우선
        return localValue || serverValue

      case "notification_enabled":
      case "notify_same_day":
      case "notify_one_day_before":
      case "notify_three_days_before":
      case "notify_five_days_before":
      case "notify_one_week_before":
        // 알림 설정은 true 우선
        return localValue || serverValue

      default:
        return null // 병합 불가
    }

    return null
  }

  // 수동 충돌 해결
  async resolveConflict(
    conflictId: string,
    resolution: "local" | "server" | "custom",
    customData?: any,
  ): Promise<boolean> {
    try {
      const conflict = await this.getConflict(conflictId)
      if (!conflict || conflict.status === "resolved") return false

      let resolvedData: any

      switch (resolution) {
        case "local":
          resolvedData = conflict.localData
          break

        case "server":
          resolvedData = conflict.serverData
          break

        case "custom":
          if (!customData) return false
          resolvedData = customData
          break

        default:
          return false
      }

      // 해결된 데이터 저장
      resolvedData.updated_at = new Date().toISOString()
      await offlineStorage.saveAnniversary(resolvedData)

      // 충돌 상태 업데이트
      conflict.status = "resolved"
      conflict.resolutionStrategy = resolution === "custom" ? "manual" : resolution
      conflict.resolvedAt = new Date().toISOString()
      conflict.resolvedBy = "user"

      await this.updateConflict(conflict)

      // 동기화 대기열에 추가
      await offlineStorage.addPendingSync(
        {
          action: "update",
          data: resolvedData,
        },
        3, // 높은 우선순위
      )

      return true
    } catch (error) {
      console.error("Failed to resolve conflict:", error)
      return false
    }
  }

  // 충돌 저장
  private async saveConflict(conflict: DataConflict): Promise<void> {
    await offlineStorage.saveConflict(conflict)

    // 알림 발송
    if (this.settings.notifyOnConflict) {
      this.notifyConflict(conflict)
    }
  }

  // 충돌 업데이트
  private async updateConflict(conflict: DataConflict): Promise<void> {
    await offlineStorage.updateConflict(conflict)
  }

  // 충돌 조회
  async getConflict(conflictId: string): Promise<DataConflict | null> {
    return await offlineStorage.getConflict(conflictId)
  }

  // 모든 충돌 조회
  async getAllConflicts(): Promise<DataConflict[]> {
    return await offlineStorage.getAllConflicts()
  }

  // 미해결 충돌 조회
  async getPendingConflicts(): Promise<DataConflict[]> {
    const conflicts = await this.getAllConflicts()
    return conflicts.filter((conflict) => conflict.status === "pending")
  }

  // 충돌 알림
  private notifyConflict(conflict: DataConflict): void {
    window.dispatchEvent(
      new CustomEvent("data-conflict", {
        detail: {
          conflict,
          message: `"${conflict.entityName}" 기념일에서 데이터 충돌이 발생했습니다.`,
        },
      }),
    )
  }

  // 충돌 통계
  async getConflictStats(): Promise<{
    total: number
    pending: number
    resolved: number
    autoResolved: number
  }> {
    const conflicts = await this.getAllConflicts()

    return {
      total: conflicts.length,
      pending: conflicts.filter((c) => c.status === "pending").length,
      resolved: conflicts.filter((c) => c.status === "resolved").length,
      autoResolved: conflicts.filter((c) => c.status === "auto-resolved").length,
    }
  }

  // 오래된 충돌 정리
  async cleanOldConflicts(daysToKeep = 30): Promise<void> {
    if (!this.settings.keepConflictHistory) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    await offlineStorage.cleanOldConflicts(cutoffDate.toISOString())
  }
}

export const conflictResolver = ConflictResolver.getInstance()
