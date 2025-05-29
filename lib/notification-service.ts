import { getSupabaseClient } from "./supabase"
import type { NotificationSettings } from "@/types/anniversary"

const supabase = getSupabaseClient()

export class NotificationService {
  // 푸시 알림 권한 요청
  static async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  // 서비스 워커 등록 및 푸시 토큰 생성
  static async registerServiceWorker(): Promise<string | null> {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker is not supported")
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker registered:", registration)

      // 데모용 토큰 생성 (실제 환경에서는 실제 푸시 토큰 사용)
      return `demo-push-token-${Date.now()}`
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return null
    }
  }

  // 푸시 구독 등록 (데모 버전)
  static async subscribeToPush(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push messaging is not supported")
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // 데모용 구독 객체 생성
      const demoSubscription = {
        endpoint: `https://demo-push-service.com/send/${Date.now()}`,
        keys: {
          p256dh: "demo-p256dh-key",
          auth: "demo-auth-key",
        },
        toJSON: () => ({
          endpoint: `https://demo-push-service.com/send/${Date.now()}`,
          keys: {
            p256dh: "demo-p256dh-key",
            auth: "demo-auth-key",
          },
        }),
      } as PushSubscription

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(demoSubscription)

      return demoSubscription
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return null
    }
  }

  // 푸시 구독 해제
  static async unsubscribeFromPush(): Promise<boolean> {
    try {
      // 데모에서는 항상 성공으로 처리
      console.log("Push subscription removed (demo mode)")
      return true
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
      return false
    }
  }

  // 서버에 구독 정보 전송
  private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: "demo-user-id",
        }),
      })
    } catch (error) {
      console.error("Failed to send subscription to server:", error)
    }
  }

  // 서버에서 구독 정보 제거
  private static async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })
    } catch (error) {
      console.error("Failed to remove subscription from server:", error)
    }
  }

  // 테스트 알림 전송
  static async sendTestNotification(): Promise<void> {
    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user-id",
          title: "테스트 알림",
          body: "푸시 알림이 정상적으로 작동합니다!",
        }),
      })

      const result = await response.json()
      console.log("Test notification result:", result)
    } catch (error) {
      console.error("Failed to send test notification:", error)
    }
  }

  // UUID 유효성 검사
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // 알림 설정 조회
  static async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    if (!this.isValidUUID(userId)) {
      console.warn("Invalid UUID provided for getNotificationSettings:", userId)
      return null
    }

    const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching notification settings:", error)
      return null
    }

    return data
  }

  // 알림 설정 저장
  static async saveNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>,
  ): Promise<NotificationSettings | null> {
    if (!this.isValidUUID(userId)) {
      console.warn("Invalid UUID provided for saveNotificationSettings:", userId)
      return null
    }

    try {
      // 먼저 사용자가 존재하는지 확인
      const { data: userExists } = await supabase.from("users").select("id").eq("id", userId).single()

      if (!userExists) {
        console.error("User does not exist:", userId)
        return null
      }

      const { data, error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error saving notification settings:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in saveNotificationSettings:", error)
      return null
    }
  }

  // 로컬 알림 스케줄링
  static scheduleLocalNotification(title: string, body: string, date: Date): void {
    if (Notification.permission !== "granted") return

    const now = new Date()
    const delay = date.getTime() - now.getTime()

    if (delay > 0) {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        })
      }, delay)
    }
  }

  // 기념일 알림 스케줄링
  static async scheduleAnniversaryNotifications(
    anniversaryId: string,
    anniversaryName: string,
    anniversaryDate: string,
    settings: NotificationSettings,
  ): Promise<void> {
    if (!settings.notifications_enabled) return

    const targetDate = new Date(anniversaryDate)
    const notifications: { days: number; enabled: boolean }[] = [
      { days: 0, enabled: settings.same_day },
      { days: 1, enabled: settings.one_day_before },
      { days: 3, enabled: settings.three_days_before },
      { days: 5, enabled: settings.five_days_before },
      { days: 7, enabled: settings.one_week_before },
    ]

    for (const notification of notifications) {
      if (!notification.enabled) continue

      const notificationDate = new Date(targetDate)
      notificationDate.setDate(notificationDate.getDate() - notification.days)
      notificationDate.setHours(9, 0, 0, 0) // 오전 9시에 알림

      const title =
        notification.days === 0
          ? `🎉 오늘은 ${anniversaryName}입니다!`
          : `📅 ${notification.days}일 후 ${anniversaryName}입니다`

      const body = notification.days === 0 ? "특별한 하루 되세요!" : "미리 준비하세요!"

      this.scheduleLocalNotification(title, body, notificationDate)

      // 알림 로그 저장
      try {
        await supabase.from("notification_logs").insert({
          user_id: settings.user_id,
          anniversary_id: anniversaryId,
          notification_date: notificationDate.toISOString().split("T")[0],
          days_before: notification.days,
        })
      } catch (error) {
        console.error("Error saving notification log:", error)
      }
    }
  }
}
