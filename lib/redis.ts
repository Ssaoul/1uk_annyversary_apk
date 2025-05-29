import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL,
})

client.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

await client.connect()

// 캐시 키 생성 함수
const generateCacheKey = (type: string, id: string) => `
  ${type}:${id}`

// Redis 캐시 래퍼
export const cache = {
  async get<T>(type: string, id: string): Promise<T | null> {
    const key = generateCacheKey(type, id)
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  },

  async set(type: string, id: string, value: any, ttl: number = 3600) {
    const key = generateCacheKey(type, id)
    await client.set(key, JSON.stringify(value), { EX: ttl })
  },

  async del(type: string, id: string) {
    const key = generateCacheKey(type, id)
    await client.del(key)
  },

  async clear(type: string) {
    const keys = await client.keys(`${type}:*`)
    if (keys.length > 0) {
      await client.del(keys)
    }
  },
}

export default client
