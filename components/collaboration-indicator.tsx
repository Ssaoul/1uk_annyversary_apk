"use client"
import { useState, useEffect } from "react"
import { Users, Edit3, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSupabaseClient } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface CollaborationUser {
  id: string
  name: string
  color: string
  isOnline: boolean
  lastSeen?: string
}

interface CollaborationIndicatorProps {
  entityId?: string
  className?: string
}

export default function CollaborationIndicator({ entityId, className = "" }: CollaborationIndicatorProps) {
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([])
  const [editingUsers, setEditingUsers] = useState<CollaborationUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    const channelName = entityId ? `collaboration:${entityId}` : "collaboration:global"

    const collaborationChannel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false },
        presence: { key: "user" },
      },
    })

    collaborationChannel
      .on("presence", { event: "sync" }, () => {
        const presenceState = collaborationChannel.presenceState()
        const users: CollaborationUser[] = []

        Object.values(presenceState).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.user && presence.user.id !== getCurrentUserId()) {
              users.push({
                ...presence.user,
                isOnline: true,
                lastSeen: presence.online_at,
              })
            }
          })
        })

        setOnlineUsers(users)
        setIsConnected(true)
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        // 새 사용자 입장 처리
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        // 사용자 퇴장 처리
      })
      .on("broadcast", { event: "editing_started" }, (payload) => {
        const session = payload.payload
        if (session.userId !== getCurrentUserId()) {
          setEditingUsers((prev) => {
            const user: CollaborationUser = {
              id: session.userId,
              name: session.userName,
              color: session.userColor,
              isOnline: true,
            }
            return [...prev.filter((u) => u.id !== user.id), user]
          })
        }
      })
      .on("broadcast", { event: "editing_stopped" }, (payload) => {
        const { sessionId } = payload.payload
        // sessionId에서 userId 추출 (임시 방법)
        const userId = sessionId.split("-")[0]
        setEditingUsers((prev) => prev.filter((u) => u.id !== userId))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          // 현재 사용자 프레즌스 추가
          await collaborationChannel.track({
            user: {
              id: getCurrentUserId(),
              name: getCurrentUserName(),
              color: getCurrentUserColor(),
            },
            online_at: new Date().toISOString(),
          })
        } else {
          setIsConnected(false)
        }
      })

    setChannel(collaborationChannel)

    return () => {
      collaborationChannel.unsubscribe()
    }
  }, [entityId])

  const getCurrentUserId = () => {
    return localStorage.getItem("temp-user-id") || "anonymous"
  }

  const getCurrentUserName = () => {
    return localStorage.getItem("temp-user-name") || "익명 사용자"
  }

  const getCurrentUserColor = () => {
    return localStorage.getItem("temp-user-color") || "#3F51B5"
  }

  const totalUsers = onlineUsers.length
  const editingCount = editingUsers.length

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* 연결 상태 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? "실시간 협업 연결됨" : "연결 끊김"}</p>
          </TooltipContent>
        </Tooltip>

        {/* 온라인 사용자 수 */}
        {totalUsers > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalUsers}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">온라인 사용자 ({totalUsers}명)</p>
                {onlineUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{onlineUsers.length - 5}명 더</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 편집 중인 사용자 */}
        {editingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 animate-pulse">
                <Edit3 className="h-3 w-3" />
                {editingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">편집 중 ({editingCount}명)</p>
                {editingUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 사용자 아바타들 */}
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback
                    className="text-xs"
                    style={{
                      backgroundColor: user.color,
                      color: "white",
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {onlineUsers.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs bg-muted">+{onlineUsers.length - 3}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{onlineUsers.length - 3}명 더</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
