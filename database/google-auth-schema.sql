-- 사용자 테이블에 Google 인증 관련 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Google ID에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Google 인증 사용자를 위한 제약조건 수정
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Google 인증 사용자는 비밀번호가 없을 수 있음
ALTER TABLE users 
ADD CONSTRAINT check_auth_provider 
CHECK (
  (auth_provider = 'email' AND password_hash IS NOT NULL) OR
  (auth_provider = 'google' AND google_id IS NOT NULL)
);

-- 기존 사용자들의 auth_provider 업데이트
UPDATE users 
SET auth_provider = 'email' 
WHERE auth_provider IS NULL;
