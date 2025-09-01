import dayjs from 'dayjs'
import type { CalendarSummaryDto, EventDto } from '../types/calendar'

const BASE = '/api'

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export function fetchVisibleCalendars() {
  return getJSON<CalendarSummaryDto[]>(`${BASE}/calendars/visible`)
}

export function fetchEvents(p: { calendarId: number; from: Date; to: Date }) {
  const qs = new URLSearchParams({
    calendarId: String(p.calendarId),
    from: dayjs(p.from).toISOString(),
    to: dayjs(p.to).toISOString()
  })
  return getJSON<EventDto[]>(`${BASE}/events?${qs}`)
}
