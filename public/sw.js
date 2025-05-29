const CACHE_NAME = "anniversary-app-v1.0.0"
const STATIC_CACHE_NAME = "anniversary-static-v1.0.0"
const DYNAMIC_CACHE_NAME = "anniversary-dynamic-v1.0.0"

// 캐시할 정적 파일들
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  // Next.js 정적 파일들은 런타임에 추가됨
]

// 오프라인 페이지
const OFFLINE_PAGE = "/offline"

// 설치 이벤트 - 정적 자산 캐시
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")

  event.waitUntil(
    Promise.all([
      // 정적 자산 캐시
      caches
        .open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log("Caching static assets")
          return cache.addAll(STATIC_ASSETS)
        }),
      // 오프라인 페이지 캐시
      caches
        .open(CACHE_NAME)
        .then((cache) => {
          return cache.add(OFFLINE_PAGE)
        }),
    ]).then(() => {
      console.log("Static assets cached successfully")
      self.skipWaiting()
    }),
  )
})

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")

  event.waitUntil(
    Promise.all([
      // 오래된 캐시 삭제
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                console.log("Deleting old cache:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
      // 모든 클라이언트 제어
      self.clients.claim(),
    ]),
  )
})

// 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 같은 도메인의 요청만 처리
  if (url.origin !== location.origin) {
    return
  }

  // API 요청 처리
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // 정적 자산 요청 처리
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // 페이지 요청 처리
  if (request.mode === "navigate") {
    event.respondWith(handlePageRequest(request))
    return
  }

  // 기타 요청은 네트워크 우선
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    }),
  )
})

// API 요청 처리 (캐시 후 네트워크)
async function handleApiRequest(request) {
  const url = new URL(request.url)

  try {
    // 네트워크 요청 시도
    const networkResponse = await fetch(request.clone())

    // 성공적인 GET 요청만 캐시
    if (request.method === "GET" && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("Network failed, trying cache for:", url.pathname)

    // 네트워크 실패 시 캐시에서 찾기
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 기념일 API의 경우 오프라인 데이터 반환
    if (url.pathname.includes("/api/anniversaries")) {
      return createOfflineApiResponse(url.pathname)
    }

    // 기타 API는 오프라인 응답
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "오프라인 상태입니다. 네트워크 연결을 확인해주세요.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// 정적 자산 처리 (캐시 우선)
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("Failed to fetch static asset:", request.url)
    throw error
  }
}

// 페이지 요청 처리
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("Network failed for page request, trying cache")

    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 오프라인 페이지 반환
    return caches.match(OFFLINE_PAGE) || new Response("오프라인 상태입니다.")
  }
}

// 정적 자산 판별
function isStaticAsset(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".ttf")
  )
}

// 오프라인 API 응답 생성
function createOfflineApiResponse(pathname) {
  // 로컬 스토리지에서 데이터 가져오기 (실제로는 IndexedDB 사용 권장)
  const offlineData = {
    anniversaries: [],
    message: "오프라인 모드입니다. 저장된 데이터를 표시합니다.",
  }

  return new Response(JSON.stringify(offlineData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

// 푸시 알림 처리
self.addEventListener("push", (event) => {
  console.log("Push message received:", event)

  let notificationData = {
    title: "기념일 알림",
    body: "새로운 기념일 알림이 있습니다",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "확인하기",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/icon-192x192.png",
      },
    ],
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (e) {
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationData))
})

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.")

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})

// 백그라운드 동기화
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "anniversary-sync") {
    event.waitUntil(syncAnniversaries())
  } else if (event.tag === "image-sync") {
    event.waitUntil(syncImages())
  } else if (event.tag === "settings-sync") {
    event.waitUntil(syncSettings())
  }
})

// 기념일 동기화 함수
async function syncAnniversaries() {
  try {
    console.log("Starting anniversary sync...")

    // IndexedDB에서 동기화 대기 중인 데이터 가져오기
    const pendingData = await getPendingData()

    if (pendingData.length === 0) {
      console.log("No pending data to sync")
      return
    }

    console.log(`Syncing ${pendingData.length} pending items`)

    let successCount = 0
    let failCount = 0

    // 각 항목을 순차적으로 동기화
    for (const item of pendingData) {
      try {
        await syncSingleItem(item)
        await removePendingItem(item.id)
        successCount++

        // 클라이언트에 진행 상황 알림
        await notifyClients({
          type: "sync-progress",
          progress: successCount + failCount,
          total: pendingData.length,
          item: item.data.name || "항목",
        })
      } catch (error) {
        console.error("Failed to sync item:", item, error)
        failCount++

        // 재시도 횟수 증가
        await incrementRetryCount(item.id)
      }
    }

    // 동기화 완료 알림
    await notifyClients({
      type: "sync-complete",
      success: successCount,
      failed: failCount,
    })

    console.log(`Sync completed: ${successCount} success, ${failCount} failed`)
  } catch (error) {
    console.error("Background sync failed:", error)

    // 동기화 실패 알림
    await notifyClients({
      type: "sync-error",
      error: error.message,
    })

    throw error // 재시도를 위해 에러 던지기
  }
}

// 개별 항목 동기화
async function syncSingleItem(item) {
  const { action, data, retryCount = 0 } = item

  // 최대 재시도 횟수 확인
  if (retryCount >= 3) {
    throw new Error(`Max retry count exceeded for item: ${data.name}`)
  }

  switch (action) {
    case "create":
      return await syncCreateItem(data)
    case "update":
      return await syncUpdateItem(data)
    case "delete":
      return await syncDeleteItem(data)
    default:
      throw new Error(`Unknown sync action: ${action}`)
  }
}

// 생성 동기화
async function syncCreateItem(data) {
  const response = await fetch("/api/anniversaries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Create sync failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  // 로컬 데이터 업데이트 (임시 ID를 서버 ID로 교체)
  await updateLocalData(data.id, result)

  return result
}

// 수정 동기화
async function syncUpdateItem(data) {
  const response = await fetch(`/api/anniversaries/${data.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Update sync failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  await updateLocalData(data.id, result)

  return result
}

// 삭제 동기화
async function syncDeleteItem(data) {
  const response = await fetch(`/api/anniversaries/${data.id}`, {
    method: "DELETE",
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete sync failed: ${response.status} ${response.statusText}`)
  }

  // 로컬에서도 삭제
  await removeLocalData(data.id)

  return true
}

// 이미지 동기화
async function syncImages() {
  try {
    const pendingImages = await getPendingImages()

    for (const imageItem of pendingImages) {
      try {
        const formData = new FormData()
        formData.append("file", imageItem.file)
        formData.append("anniversaryId", imageItem.anniversaryId)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          await updateImageUrl(imageItem.anniversaryId, result.url)
          await removePendingImage(imageItem.id)
        }
      } catch (error) {
        console.error("Failed to sync image:", error)
      }
    }
  } catch (error) {
    console.error("Image sync failed:", error)
  }
}

// 설정 동기화
async function syncSettings() {
  try {
    const pendingSettings = await getPendingSettings()

    for (const setting of pendingSettings) {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(setting.data),
        })

        if (response.ok) {
          await removePendingSetting(setting.id)
        }
      } catch (error) {
        console.error("Failed to sync setting:", error)
      }
    }
  } catch (error) {
    console.error("Settings sync failed:", error)
  }
}

// 클라이언트에 메시지 전송
async function notifyClients(message) {
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage(message)
  })
}

// IndexedDB 헬퍼 함수들 (실제 구현)
async function getPendingData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_sync"], "readonly")
      const store = transaction.objectStore("pending_sync")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || [])
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function removePendingItem(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_sync"], "readwrite")
      const store = transaction.objectStore("pending_sync")
      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function incrementRetryCount(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_sync"], "readwrite")
      const store = transaction.objectStore("pending_sync")

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1
          item.lastRetry = Date.now()

          const putRequest = store.put(item)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function updateLocalData(localId, serverData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["anniversaries"], "readwrite")
      const store = transaction.objectStore("anniversaries")

      // 임시 ID 항목 삭제
      const deleteRequest = store.delete(localId)
      deleteRequest.onsuccess = () => {
        // 서버 데이터로 새 항목 추가
        const addRequest = store.put({
          ...serverData,
          synced: true,
          lastModified: Date.now(),
        })

        addRequest.onsuccess = () => resolve()
        addRequest.onerror = () => reject(addRequest.error)
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function removeLocalData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["anniversaries"], "readwrite")
      const store = transaction.objectStore("anniversaries")
      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function getPendingImages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_images"], "readonly")
      const store = transaction.objectStore("pending_images")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || [])
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function removePendingImage(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_images"], "readwrite")
      const store = transaction.objectStore("pending_images")
      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function updateImageUrl(anniversaryId, imageUrl) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["anniversaries"], "readwrite")
      const store = transaction.objectStore("anniversaries")

      const getRequest = store.get(anniversaryId)
      getRequest.onsuccess = () => {
        const anniversary = getRequest.result
        if (anniversary) {
          anniversary.image_url = imageUrl
          anniversary.lastModified = Date.now()

          const putRequest = store.put(anniversary)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function getPendingSettings() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_settings"], "readonly")
      const store = transaction.objectStore("pending_settings")
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || [])
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

async function removePendingSetting(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AnniversaryAppDB", 1)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["pending_settings"], "readwrite")
      const store = transaction.objectStore("pending_settings")
      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

// 메시지 처리 (클라이언트와 통신)
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
