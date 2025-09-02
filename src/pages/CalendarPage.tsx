import React, { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

import '../style/calendar-layout.css'

/* =============================================================================
   SECTION 1) TYPES (나중에 src/types/calendar.ts로 이동)
   ========================================================================== */

/** 내가 볼 수 있는 캘린더 요약 (서버 DTO) */
type CalendarSummaryDto = {
  calId: number
  name: string
  color?: string
  /** 백엔드가 내려주면 초기 선택 판단에 사용 */
  isPersonal?: boolean
  /** 백엔드가 명시적으로 1개만 true로 내려주면 가장 깔끔 */
  defaultForMe?: boolean
}

/** 일정 이벤트 (서버 DTO) */
type EventDto = {
  id: number | string
  calendarId: number
  title: string
  start: string   // ISO-8601(+TZ)
  end?: string
  allDay?: boolean
}

/* =============================================================================
   SECTION 2) API (나중에 src/api/calendar.ts로 이동)
   - USE_MOCK 토글로 목/실 API 전환 가능
   ========================================================================== */

const BASE = '/api'
const USE_MOCK = false // ⚠️ 개발 중 편하게 목 데이터 쓰고 싶을 때 true
const USER_NO = '123'  // dev용 헤더. 운영에선 세션/쿠키로 대체

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

// [GET] 내가 볼 수 있는 캘린더 목록
async function fetchVisibleCalendars(): Promise<CalendarSummaryDto[]> {
  if (USE_MOCK) {
    // ✅ 목 데이터
    return [
      { calId: 1, name: '내 캘린더', color: '#4285F4', isPersonal: true, defaultForMe: true },
      { calId: 2, name: '개발부서', color: '#0F9D58' },
      { calId: 3, name: '프로젝트A', color: '#DB4437' }
    ]
  }
  return getJSON<CalendarSummaryDto[]>(`${BASE}/calendars/visible`)
}

// [GET] 특정 캘린더의 기간 이벤트
async function fetchEvents(p: { calendarId: number; from: Date; to: Date }): Promise<EventDto[]> {
  if (USE_MOCK) {
    // ✅ 심플 목
    if (p.calendarId === 1) {
      return [
        {
          id: 'm1',
          calendarId: 1,
          title: '개발 킥오프',
          start: dayjs().startOf('month').add(2, 'day').hour(9).minute(0).second(0).format(),
          end: dayjs().startOf('month').add(2, 'day').hour(10).minute(0).second(0).format(),
          allDay: false
        }
      ]
    }
    if (p.calendarId === 2) {
      return [
        {
          id: 'd1',
          calendarId: 2,
          title: '부서 주간회의',
          start: dayjs().startOf('month').add(6, 'day').hour(10).format(),
          end: dayjs().startOf('month').add(6, 'day').hour(11).format(),
          allDay: false
        }
      ]
    }
    return []
  }
  const qs = new URLSearchParams({
    calendarId: String(p.calendarId),
    from: dayjs(p.from).toISOString(),
    to: dayjs(p.to).toISOString()
  })
  return getJSON<EventDto[]>(`${BASE}/events?${qs}`)
}

/** === FullCalendar 전용: 생성/수정/삭제 === */
type FcCreateBody = {
  calId: number
  title: string
  start: string // ISO
  end: string   // ISO
  allDay: boolean
  locationText?: string
  note?: string
  roomId?: number | null
  eventType?: string
  labelId?: number | null
  rrule?: string
  exdates?: string
}

// [POST] 생성
async function createEventFc(body: FcCreateBody): Promise<number> {
  const res = await fetch(`${BASE}/fc/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-No': USER_NO },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (res.status === 409) throw new Error('회의실 예약이 겹칩니다.')
    throw new Error(`생성 실패: HTTP ${res.status}`)
  }
  return res.json()
}

// [PUT] 수정
async function updateEventFc(eventId: string | number, calendarId: number, body: Omit<FcCreateBody, 'calId'>) {
  const res = await fetch(`${BASE}/fc/events/${eventId}?calendarId=${calendarId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-No': USER_NO },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (res.status === 409) throw new Error('회의실 예약이 겹칩니다.')
    throw new Error(`수정 실패: HTTP ${res.status}`)
  }
}

// [DELETE] 삭제
async function deleteEventFc(eventId: string | number) {
  const res = await fetch(`${BASE}/fc/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'X-User-No': USER_NO }
  })
  if (!res.ok) throw new Error(`삭제 실패: HTTP ${res.status}`)
}

/* =============================================================================
   SECTION 3) UI (이 파일이 그대로 src/pages/CalendarPage.tsx)
   ========================================================================== */

export default function CalendarPage() {
  /** 좌측 작은 달력의 현재 선택 월 */
  const [monthValue, setMonthValue] = useState<Dayjs>(dayjs())
  /** FullCalendar 제어용 ref (gotoDate, addEventSource 등) */
  const calRef = useRef<FullCalendar | null>(null)

  /** 내가 볼 수 있는 캘린더 목록 */
  const [calendars, setCalendars] = useState<CalendarSummaryDto[]>([])
  /** 선택된 캘린더 ID 집합 */
  const [selected, setSelected] = useState<Set<number>>(new Set())

  /** 모두 선택 여부 (UI 체크박스 상태 계산용) */
  const allSelected = useMemo(
    () => calendars.length > 0 && selected.size === calendars.length,
    [calendars, selected]
  )

  /** 작은 달력에서 월 변경 → 메인 캘린더 이동 */
  const handleMonthChange = (value: Dayjs | null) => {
    if (!value) return
    setMonthValue(value)
    calRef.current?.getApi().gotoDate(value.toDate())
  }

  /** 초기 로드: 캘린더 목록 가져오기 + 초기 선택 결정 */
  useEffect(() => {
    ;(async () => {
      const list = await fetchVisibleCalendars()
      setCalendars(list)

      // --- 초기 선택 정책 ---
      // 1) defaultForMe가 있으면 그것 1개만
      let defaultOne = list.find(c => c.defaultForMe)
      // 2) 없으면 isPersonal 중 첫 번째 하나
      if (!defaultOne) defaultOne = list.find(c => c.isPersonal)
      // 3) 그것도 없으면 첫 번째
      if (!defaultOne) defaultOne = list[0]

      setSelected(new Set(defaultOne ? [defaultOne.calId] : []))
    })()
  }, [])

  /**
   * 선택 상태 → FullCalendar eventSource 동기화
   * - 선택 해제된 소스는 제거
   * - 새로 선택된 소스는 추가(events 콜백에서 기간에 맞춰 fetch)
   */
  useEffect(() => {
    const api = calRef.current?.getApi()
    if (!api) return

    // 제거
    calendars.forEach(c => {
      const id = `cal-${c.calId}`
      const src = api.getEventSourceById(id)
      if (src && !selected.has(c.calId)) src.remove()
    })

    // 추가
    calendars.forEach(c => {
      if (!selected.has(c.calId)) return
      const id = `cal-${c.calId}`
      if (api.getEventSourceById(id)) return

      api.addEventSource({
        id,
        color: c.color,
        // FullCalendar가 현재 보이는 범위를 info.start/end로 전달해줌
        events: async (info, success, failure) => {
          try {
            const data = await fetchEvents({
              calendarId: c.calId,
              from: info.start,
              to: info.end
            })
            success(
              data.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                allDay: e.allDay,
                // 업데이트 시 어떤 캘린더의 이벤트인지 식별용
                extendedProps: { calId: e.calendarId }
              }))
            )
          } catch (err) {
            failure(err)
          }
        }
      } as any)
    })
  }, [calendars, selected])

  /** 개별 캘린더 토글 */
  const toggleSelect = (calId: number) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(calId) ? next.delete(calId) : next.add(calId)
      return next
    })

  /** 모두 선택/해제 */
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(calendars.map(c => c.calId)))

  /* ----------------------------
     FullCalendar 이벤트 핸들러
     ---------------------------- */

  // 생성: 범위 선택 후 서버 저장
  const handleSelect = async (selectInfo: any) => {
    const title = window.prompt('일정 제목을 입력하세요')
    if (!title) {
      selectInfo.view.calendar.unselect()
      return
    }
    try {
      await createEventFc({
        calId: Array.from(selected)[0] ?? calendars[0]?.calId,
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: !!selectInfo.allDay,
        locationText: '',
        note: '',
        roomId: null,
        eventType: 'MEETING',
        labelId: null
      })
      selectInfo.view.calendar.refetchEvents()
    } catch (e: any) {
      alert(e.message || '생성 실패')
    }
  }

  // 이동(drop) → 수정
  const handleEventDrop = async (arg: any) => {
    try {
      await updateEventFc(
        arg.event.id,
        Number(arg.event.extendedProps?.calId ?? Array.from(selected)[0]),
        {
          title: arg.event.title,
          start: arg.event.startStr,
          end: arg.event.endStr,
          allDay: !!arg.event.allDay,
          locationText: arg.event.extendedProps?.locationText ?? '',
          note: arg.event.extendedProps?.note ?? '',
          roomId: arg.event.extendedProps?.roomId ?? null,
          eventType: arg.event.extendedProps?.eventType ?? 'MEETING',
          labelId: arg.event.extendedProps?.labelId ?? null
        }
      )
      arg.view.calendar.refetchEvents()
    } catch (e: any) {
      alert(e.message || '업데이트 실패')
      arg.revert()
    }
  }

  // 리사이즈 → 수정
  const handleEventResize = async (arg: any) => {
    try {
      await updateEventFc(
        arg.event.id,
        Number(arg.event.extendedProps?.calId ?? Array.from(selected)[0]),
        {
          title: arg.event.title,
          start: arg.event.startStr,
          end: arg.event.endStr,
          allDay: !!arg.event.allDay,
          locationText: arg.event.extendedProps?.locationText ?? '',
          note: arg.event.extendedProps?.note ?? '',
          roomId: arg.event.extendedProps?.roomId ?? null,
          eventType: arg.event.extendedProps?.eventType ?? 'MEETING',
          labelId: arg.event.extendedProps?.labelId ?? null
        }
      )
      arg.view.calendar.refetchEvents()
    } catch (e: any) {
      alert(e.message || '업데이트 실패')
      arg.revert()
    }
  }

  // 클릭 → 삭제
  const handleEventClick = async (clickInfo: any) => {
    if (!window.confirm(`'${clickInfo.event.title}' 일정을 삭제할까요?`)) return
    try {
      await deleteEventFc(clickInfo.event.id)
      clickInfo.event.remove()
    } catch (e: any) {
      alert(e.message || '삭제 실패')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, padding: 16 }}>
      {/* 좌측: 작은 달력 + 캘린더 선택 */}
      <div>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
          <DateCalendar
            views={['year', 'month']}
            openTo="month"
            value={monthValue}
            onChange={handleMonthChange}
            slotProps={{
              calendarHeader: { sx: { '& .MuiPickersCalendarHeader-label': { fontSize: 14 } } },
              day: { sx: { py: 0.2, minWidth: 32 } }
            }}
          />
        </LocalizationProvider>

        {/* 내가 볼 수 있는 캘린더 체크리스트 */}
        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            모두 선택
          </label>

          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {calendars.map(c => (
              <label key={c.calId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={selected.has(c.calId)}
                  onChange={() => toggleSelect(c.calId)}
                />
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: c.color || '#999'
                  }}
                />
                <span>{c.name}</span>
              </label>
            ))}
            {calendars.length === 0 && (
              <div style={{ color: '#888', fontSize: 13 }}>표시할 캘린더가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 우측: 메인 FullCalendar */}
      <div>
        <FullCalendar
          ref={calRef as any}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={monthValue.toDate()}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          height="calc(100vh - 120px)"
          timeZone="local"
          selectable
          editable                     // ← 드래그/이동/리사이즈 허용
          events={[]}                  // eventSource는 동적으로 addEventSource에서 관리
          select={handleSelect}        // ← 생성
          eventDrop={handleEventDrop}  // ← 이동
          eventResize={handleEventResize} // ← 길이 변경
          eventClick={handleEventClick}   // ← 삭제
        />
      </div>
    </div>
  )
}