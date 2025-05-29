-- 사용자 테이블 업데이트
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_email_provider ON users(email, auth_provider);

-- 제약조건 업데이트
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 기존 사용자들의 auth_provider 업데이트
UPDATE users 
SET auth_provider = 'email' 
WHERE auth_provider IS NULL;

-- Google 사용자를 위한 고유 제약조건
ALTER TABLE users 
ADD CONSTRAINT unique_google_id UNIQUE (google_id);

-- 이메일과 auth_provider 조합 고유성
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS unique_email_provider;

ALTER TABLE users 
ADD CONSTRAINT unique_email_provider UNIQUE (email, auth_provider);
