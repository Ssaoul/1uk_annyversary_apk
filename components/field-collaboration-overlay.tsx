"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Edit3, MousePointer, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface FieldCollaborationOverlayProps {
  entityId: string
  fieldName: string
  children: React.ReactNode
  onStartEditing?: () => void
  onStopEditing?: () => void
}

interface EditingSession {
  id: string
  userId: string
  userName: string
  userColor: string
  entityId: string
  field: string
  startedAt: string
}

interface CursorPosition {
  userId: string
  userName: string
  color: string
  position: number
}

export default function FieldCollaborationOverlay({
  entityId,
  fieldName,
  children,
  onStartEditing,
  onStopEditing,
}: FieldCollaborationOverlayProps) {
  const [editingSessions, setEditingSessions] = useState<EditingSession[]>([])
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    const channelName = `collaboration:${entityId}:${fieldName}`

    const collaborationChannel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false },
        presence: { key: "user" },
      },
    })

    collaborationChannel
      .on("broadcast", { event: "editing_started" }, (payload) => {
        const session = payload.payload as EditingSession
        if (session.userId !== getCurrentUserId()) {
          setEditingSessions((prev) => [...prev.filter((s) => s.id !== session.id), session])
        }
      })
      .on("broadcast", { event: "editing_stopped" }, (payload) => {
        const { sessionId } = payload.payload
        setEditingSessions((prev) => prev.filter((s) => s.id !== sessionId))
      })
      .on("broadcast", { event: "cursor_moved" }, (payload) => {
        const { userId, userName, color, position } = payload.payload
        if (userId !== getCurrentUserId()) {
          setCursors((prev) => {
            const filtered = prev.filter((cursor) => cursor.userId !== userId)
            return [...filtered, { userId, userName, color, position }]
          })

          // 5초 후 커서 제거
          setTimeout(() => {
            setCursors((prev) => prev.filter((cursor) => cursor.userId !== userId))
          }, 5000)
        }
      })
      .on("presence", { event: "sync" }, () => {
        // 프레즌스 상태 동기화
      })
      .subscribe()

    setChannel(collaborationChannel)

    return () => {
      collaborationChannel.unsubscribe()
    }
  }, [entityId, fieldName])

  const getCurrentUserId = () => {
    // 임시 사용자 ID (실제로는 인증된 사용자 ID를 사용해야 함)
    return localStorage.getItem("temp-user-id") || "anonymous"
  }

  const getCurrentUserName = () => {
    return localStorage.getItem("temp-user-name") || "익명 사용자"
  }

  const getCurrentUserColor = () => {
    return localStorage.getItem("temp-user-color") || "#3F51B5"
  }

  const handleFocus = async () => {
    if (!isEditing && channel) {
      const sessionId = `${getCurrentUserId()}-${entityId}-${fieldName}-${Date.now()}`
      const session: EditingSession = {
        id: sessionId,
        userId: getCurrentUserId(),
        userName: getCurrentUserName(),
        userColor: getCurrentUserColor(),
        entityId,
        field: fieldName,
        startedAt: new Date().toISOString(),
      }

      setCurrentSessionId(sessionId)
      setIsEditing(true)

      await channel.send({
        type: "broadcast",
        event: "editing_started",
        payload: session,
      })

      onStartEditing?.()
    }
  }

  const handleBlur = async () => {
    if (isEditing && currentSessionId && channel) {
      await channel.send({
        type: "broadcast",
        event: "editing_stopped",
        payload: { sessionId: currentSessionId },
      })

      setIsEditing(false)
      setCurrentSessionId("")
      onStopEditing?.()
    }
  }

  const handleSelectionChange = async () => {
    if (currentSessionId && inputRef.current && channel) {
      const position = inputRef.current.selectionStart || 0
      await channel.send({
        type: "broadcast",
        event: "cursor_moved",
        payload: {
          userId: getCurrentUserId(),
          userName: getCurrentUserName(),
          color: getCurrentUserColor(),
          position,
        },
      })
    }
  }

  const otherEditingSessions = editingSessions.filter((session) => session.userId !== getCurrentUserId())

  return (
    <div ref={containerRef} className="relative">
      {/* 다른 사용자 편집 중 표시 */}
      {otherEditingSessions.length > 0 && (
        <div className="absolute -top-6 left-0 z-10 flex gap-1">
          {otherEditingSessions.map((session) => (
            <Badge
              key={session.id}
              variant="secondary"
              className="text-xs animate-pulse"
              style={{
                backgroundColor: `${session.userColor}20`,
                borderColor: session.userColor,
                color: session.userColor,
              }}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              {session.userName} 편집 중
            </Badge>
          ))}
        </div>
      )}

      {/* 커서 위치 표시 */}
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${Math.min(cursor.position * 8, 100)}px`,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-5 animate-pulse" style={{ backgroundColor: cursor.color }} />
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: cursor.color,
                color: "white",
              }}
            >
              <MousePointer className="h-3 w-3 mr-1" />
              {cursor.userName}
            </Badge>
          </div>
        </div>
      ))}

      {/* 실제 입력 필드 */}
      <div
        className={`relative ${
          otherEditingSessions.length > 0 ? "ring-2 ring-orange-200 ring-opacity-50" : ""
        } ${isEditing ? "ring-2 ring-blue-200 ring-opacity-50" : ""}`}
      >
        {React.cloneElement(children as React.ReactElement, {
          ref: inputRef,
          onFocus: handleFocus,
          onBlur: handleBlur,
          onSelect: handleSelectionChange,
          onKeyUp: handleSelectionChange,
          onClick: handleSelectionChange,
        })}
      </div>

      {/* 편집 중 표시 */}
      {isEditing && (
        <div className="absolute -bottom-6 left-0 z-10">
          <Badge variant="outline" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            편집 중
          </Badge>
        </div>
      )}
    </div>
  )
}
