import { useState, useEffect } from 'react'
import { cache } from '@/lib/redis'

interface OfflineStorage {
  saveToCache: (key: string, data: any) => Promise<void>
  getFromCache: <T>(key: string) => Promise<T | null>
  clearCache: (key: string) => Promise<void>
  clearAllCache: () => Promise<void>
}

export function useOfflineStorage(): OfflineStorage {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    window.addEventListener('offline', () => setIsOffline(true))
    window.addEventListener('online', () => setIsOffline(false))
    return () => {
      window.removeEventListener('offline', () => setIsOffline(true))
      window.removeEventListener('online', () => setIsOffline(false))
    }
  }, [])

  const saveToCache = async (key: string, data: any) => {
    try {
      await cache.set('offline', key, data, 86400) // 24시간
      if (isOffline) {
        console.log(`오프라인 모드: ${key} 데이터를 캐시에 저장했습니다.`)
      }
    } catch (error) {
      console.error('캐시 저장 실패:', error)
    }
  }

  const getFromCache = async <T>(key: string): Promise<T | null> => {
    try {
      const data = await cache.get<T>('offline', key)
      if (data) {
        console.log(`캐시에서 ${key} 데이터를 불러왔습니다.`)
      }
      return data
    } catch (error) {
      console.error('캐시 읽기 실패:', error)
      return null
    }
  }

  const clearCache = async (key: string) => {
    try {
      await cache.del('offline', key)
      console.log(`캐시에서 ${key} 데이터를 삭제했습니다.`)
    } catch (error) {
      console.error('캐시 삭제 실패:', error)
    }
  }

  const clearAllCache = async () => {
    try {
      await cache.clear('offline')
      console.log('모든 오프라인 캐시를 삭제했습니다.')
    } catch (error) {
      console.error('캐시 초기화 실패:', error)
    }
  }

  return {
    saveToCache,
    getFromCache,
    clearCache,
    clearAllCache,
  }
}
