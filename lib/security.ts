import { NextResponse, NextRequest } from 'next/server'
import { createClient } from 'redis'
import { cache } from './redis'
import * as crypto from 'crypto'
import jwt, { SignOptions, VerifyErrors } from 'jsonwebtoken'

// 환경 변수 설정
const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CSRF_SECRET: process.env.CSRF_SECRET,
  API_KEY: process.env.API_KEY,
  API_KEY_EXPIRY: process.env.API_KEY_EXPIRY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  PASSWORD_SALT_ROUNDS: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10'),
}

// CSRF 토큰 생성
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// JWT 토큰 생성
export const generateJWT = (payload: any, expiresIn: string = '24h') => {
  const options: SignOptions = {
    expiresIn,
    algorithm: 'HS256'
  }
  return jwt.sign(payload, env.JWT_SECRET!, options)
}

// 토큰 검증 미들웨어
export const authMiddleware = async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET!) as any
    return NextResponse.next()
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

// API 키 검증 미들웨어
export const apiKeyMiddleware = async (req: NextRequest) => {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  try {
    const cachedKey = await cache.get<string>('api_key', apiKey)
    if (cachedKey) {
      return NextResponse.next()
    }

    // Redis에 API 키 캐시
    await cache.set('api_key', apiKey, apiKey, parseInt(env.API_KEY_EXPIRY!))
    return NextResponse.next()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
}

// CSRF 보호 미들웨어
export const csrfMiddleware = async (req: NextRequest) => {
  const csrfToken = req.headers.get('x-csrf-token')
  const sessionToken = req.cookies.get('csrf_token')?.value

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  return NextResponse.next()
}

// 보안 헤더 설정
export const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",  },
]

export default env
