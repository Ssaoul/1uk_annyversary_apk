import { type NextRequest, NextResponse } from "next/server"

interface CalendarEvent {
  summary: string
  description?: string
  date: string
  isRecurring?: boolean
  reminderMinutes?: number
  accessToken: string
}

export async function POST(request: NextRequest) {
  try {
    const eventData: CalendarEvent = await request.json()

    // 서버에서 Google Calendar API 호출
    const event = {
      summary: eventData.summary,
      description: eventData.description || "",
      start: {
        date: eventData.date,
        timeZone: "Asia/Seoul",
      },
      end: {
        date: eventData.date,
        timeZone: "Asia/Seoul",
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: "popup",
            minutes: eventData.reminderMinutes || 540,
          },
        ],
      },
    }

    // 매년 반복 설정
    if (eventData.isRecurring) {
      ;(event as any).recurrence = ["RRULE:FREQ=YEARLY"]
    }

    // Google Calendar API 호출
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${eventData.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Calendar API error")
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      eventId: result.id,
      htmlLink: result.htmlLink,
    })
  } catch (error: any) {
    console.error("Calendar event creation error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create calendar event",
    })
  }
}
