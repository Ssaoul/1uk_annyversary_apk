-- 사용자 테이블 (최적화된 버전)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'family')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT email_unique UNIQUE (email)
);

-- 기념일 테이블 (최적화된 버전)
CREATE TABLE IF NOT EXISTS anniversaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  is_lunar BOOLEAN DEFAULT FALSE,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  category VARCHAR(50) DEFAULT 'birthday' CHECK (category IN ('birthday', 'anniversary', 'company', 'holiday', 'other')),
  repeat_type VARCHAR(20) DEFAULT 'yearly' CHECK (repeat_type IN ('once', 'yearly', 'cumulative')),
  memo TEXT,
  image_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  notify_same_day BOOLEAN DEFAULT TRUE,
  notify_one_day_before BOOLEAN DEFAULT TRUE,
  notify_three_days_before BOOLEAN DEFAULT FALSE,
  notify_five_days_before BOOLEAN DEFAULT FALSE,
  notify_one_week_before BOOLEAN DEFAULT FALSE,
  google_calendar_event_id VARCHAR(255),
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_date_idx UNIQUE (user_id, date),
  CONSTRAINT user_name_idx UNIQUE (user_id, name)
);

-- 인덱스 추가
CREATE INDEX idx_anniversaries_user_id ON anniversaries(user_id);
CREATE INDEX idx_anniversaries_date ON anniversaries(date);
CREATE INDEX idx_anniversaries_category ON anniversaries(category);
CREATE INDEX idx_anniversaries_priority ON anniversaries(priority);
CREATE INDEX idx_anniversaries_is_favorite ON anniversaries(is_favorite);
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_anniversary_id ON notification_logs(anniversary_id);

-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  same_day BOOLEAN DEFAULT TRUE,
  one_day_before BOOLEAN DEFAULT TRUE,
  three_days_before BOOLEAN DEFAULT FALSE,
  five_days_before BOOLEAN DEFAULT FALSE,
  one_week_before BOOLEAN DEFAULT FALSE,
  notification_time TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 푸시 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 알림 로그 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anniversary_id UUID NOT NULL REFERENCES anniversaries(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'push', 'sms')),
  notification_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_date_idx UNIQUE (user_id, notification_date)
);

-- 공유 기념일 테이블
CREATE TABLE IF NOT EXISTS shared_anniversaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anniversary_id UUID NOT NULL REFERENCES anniversaries(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_shared_anniversary UNIQUE (anniversary_id, shared_with)
);
