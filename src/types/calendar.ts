/* 내가 볼 수 있는 캘린더 */
export type CalendarSummaryDto = {
  calId: number
  name: string
  color?: string 
  isPersonal?: boolean
}

/* 기간일정 */
export type EventDto = {
  id: number | string
  calendarId: number
  title: string
  start: string   // ISO-8601(+TZ)
  end?: string
  allDay?: boolean
}