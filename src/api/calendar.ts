import dayjs from 'dayjs'
import type { CalendarSummaryDto, EventDto } from '../types/calendar'

const BASE = '/api'

async function getJSON<T>(url: string): Promise<T> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
}

/* 
get 조회 가능 캘린더 목록
calId,name,color?
*/
export function fetchVisibleCalendars() {
    return getJSON<CalendarSummaryDto[]>(`${BASE}/calendars/visible`)
}

/*
특정 캘린더의 기간 이벤트 조회
from/to는 fullcalendar제공기간 사용
*/
export function fetchEvents(p: { calendarId: number; from: Date; to: Date }) {
  const qs = new URLSearchParams({
    calendarId: String(p.calendarId),
    from: dayjs(p.from).toISOString(),
    to: dayjs(p.to).toISOString()
  })
  return getJSON<EventDto[]>(`${BASE}/events?${qs}`)
}
