export interface Anniversary {
  id: string
  name: string
  date: string
  is_lunar: boolean
  contact_name?: string
  category: "personal" | "birthday" | "anniversary" | "company" | "other"
  repeat_type: "once" | "yearly" | "cumulative"
  memo?: string
  image_url?: string
  user_id?: string
  is_favorite: boolean
  is_official: boolean
  notification_enabled: boolean
  notify_same_day: boolean
  notify_one_day_before: boolean
  notify_three_days_before: boolean
  notify_five_days_before: boolean
  notify_one_week_before: boolean
  created_at: string
  updated_at: string
}

export interface OfficialHoliday {
  id: string
  name: string
  date_type: "solar" | "lunar"
  month: number
  day?: number
  week_of_month?: number
  day_of_week?: number
  description?: string
  is_enabled: boolean
  created_at: string
}

export interface UserOfficialHoliday {
  id: string
  user_id: string
  holiday_id: string
  contact_name?: string
  is_enabled: boolean
  holiday: OfficialHoliday
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  notifications_enabled: boolean
  same_day: boolean
  one_day_before: boolean
  three_days_before: boolean
  five_days_before: boolean
  one_week_before: boolean
  push_token?: string
  created_at: string
  updated_at: string
}

export interface NotificationLog {
  id: string
  user_id: string
  anniversary_id: string
  notification_date: string
  days_before: number
  is_sent: boolean
  sent_at?: string
  created_at: string
}

export interface User {
  id: string
  email?: string
  name?: string
  created_at: string
}
