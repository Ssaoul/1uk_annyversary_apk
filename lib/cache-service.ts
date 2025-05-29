import { cache } from './redis'
import { Anniversary } from '../types/anniversary'

export class CacheService {
  private static instance: CacheService

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  // 기념일 캐시
  async cacheAnniversary(anniversary: Anniversary) {
    await cache.set('anniversary', anniversary.id, anniversary, 3600)
  }

  async getCachedAnniversary(id: string): Promise<Anniversary | null> {
    return await cache.get<Anniversary>('anniversary', id)
  }

  async invalidateAnniversaryCache(id: string) {
    await cache.del('anniversary', id)
  }

  async clearAnniversaryCache() {
    await cache.clear('anniversary')
  }

  // 사용자 캐시
  async cacheUser(userId: string, userData: any) {
    await cache.set('user', userId, userData, 3600)
  }

  async getCachedUser(userId: string): Promise<any | null> {
    return await cache.get<any>('user', userId)
  }

  async invalidateUserCache(userId: string) {
    await cache.del('user', userId)
  }

  async clearUserCache() {
    await cache.clear('user')
  }

  // 알림 설정 캐시
  async cacheNotificationSettings(userId: string, settings: any) {
    await cache.set('notification', userId, settings, 3600)
  }

  async getCachedNotificationSettings(userId: string): Promise<any | null> {
    return await cache.get<any>('notification', userId)
  }

  async invalidateNotificationCache(userId: string) {
    await cache.del('notification', userId)
  }

  async clearNotificationCache() {
    await cache.clear('notification')
  }
}
