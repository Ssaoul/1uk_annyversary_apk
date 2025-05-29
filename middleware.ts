import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityHeaders } from './lib/security'
import { authMiddleware, apiKeyMiddleware, csrfMiddleware } from './lib/security'

export async function middleware(request: NextRequest) {
  // 보안 헤더 적용
  const response = NextResponse.next()
  securityHeaders.forEach((header) => {
    response.headers.set(header.key, header.value)
  })

  // API 키 검증 (API 엔드포인트에만 적용)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return apiKeyMiddleware(request)
  }

  // CSRF 보호 (POST 요청에만 적용)
  if (request.method === 'POST') {
    return csrfMiddleware(request)
  }

  // 인증 검증 (프로텍티드 라우트에만 적용)
  if (request.nextUrl.pathname.startsWith('/protected')) {
    return authMiddleware(request)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
