import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/use-toast'

interface MobileOptimizationProps {
  children: React.ReactNode
}

export function MobileOptimization({ children }: MobileOptimizationProps) {
  const [isOffline, setIsOffline] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // 모바일 감지
    const userAgent = navigator.userAgent
    const isMobileDevice = /Mobi|Android/i.test(userAgent)
    setIsMobile(isMobileDevice)

    // 오프라인 감지
    function handleOffline() {
      setIsOffline(true)
      toast({
        title: '오프라인 상태',
        description: '인터넷 연결이 끊어졌습니다. 기능이 제한될 수 있습니다.',
        variant: 'destructive',
      })
    }

    function handleOnline() {
      setIsOffline(false)
      toast({
        title: '온라인 상태',
        description: '인터넷 연결이 되었습니다.',
        variant: 'default',
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [toast])

  // 모바일 최적화 기능
  useEffect(() => {
    if (isMobile) {
      // 모바일에서만 사용할 스타일
      document.documentElement.style.scrollBehavior = 'smooth'
      document.documentElement.style.overflow = 'hidden'

      // 모바일에서만 사용할 이벤트 리스너
      const handleTouchStart = (e: TouchEvent) => {
        // 터치 최적화
        e.preventDefault()
      }

      document.addEventListener('touchstart', handleTouchStart, { passive: false })

      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
      }
    }
  }, [isMobile])

  // 브라우저 PWA 설치 프롬프트
  useEffect(() => {
    let deferredPrompt: Event | null = null

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      window['deferredPrompt'] = deferredPrompt
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
      {/* 오프라인 모드 UI */}
      {isOffline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-2">오프라인 모드</h2>
            <p>현재 인터넷 연결이 끊어져 있습니다.</p>
            <p>오프라인으로 저장된 데이터만 사용할 수 있습니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}
