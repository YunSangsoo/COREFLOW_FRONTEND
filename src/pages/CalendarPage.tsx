import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg, EventDropArg, DatesSetArg } from '@fullcalendar/core'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'

import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

import '../style/calendar-layout.css'
import { api } from '../api/coreflowApi'
import type { RootState } from '../store/store'
import { useSelector } from 'react-redux'

// ===== Types that mirror backend payloads =====
export type FcCalendarRes = {
  calId: number
  name: string
  color: string
  defaultRole: 'NONE' | 'BUSY_ONLY' | 'READER' | 'CONTRIBUTOR' | 'EDITOR'
}

export type EventRes = {
  eventId: number
  calId: number
  title: string
  startAt: string // 'YYYY-MM-DDTHH:mm:ss' (KST local)
  endAt: string   // same format
  allDayYn: 'Y' | 'N'
  locationText?: string
  note?: string
  roomId?: number
  status?: string
  labelId?: number
  eventType?: string
  rrule?: string | null
  exdates?: string | null
}

// ===== Small fetch helper with base and X-User-No header =====
const USER_NO = '1' // TODO: replace with real login value
const API_BASE = 'http://localhost:8081/api'
const API_PREFIX = '/calendar'


// async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
//   const url = typeof input === 'string'
//     ? (input.startsWith('http') ? input : `${API_BASE}${input.startsWith('/') ? '' : '/'}${input}`)
//     : input

//   const res = await fetch(url, {
//     ...init,
//     headers: {
//       'Content-Type': 'application/json',
//       'X-User-No': USER_NO,
//       ...(init?.headers || {}),
//     },
//     credentials: 'include',
//   })

//   const ctype = res.headers.get('content-type') || ''

//   if (!res.ok) {
//     const text = await res.text().catch(() => '')
//     throw new Error(`HTTP ${res.status} on ${typeof url === 'string' ? url : 'request'}\n${text.slice(0, 200)}`)
//   }
//   if (!ctype.includes('application/json')) {
//     const text = await res.text().catch(() => '')
//     throw new Error(`Expected JSON but got ${ctype} on ${typeof url === 'string' ? url : 'request'}\n${text.slice(0, 200)}`)
//   }

//   return res.json() as Promise<T>
// }

// ===== UI State Types =====
interface UiCalendar extends FcCalendarRes {
  checked: boolean
}

// ===== Component =====
export default function CalendarPage() {
  const [miniDate, setMiniDate] = useState<Dayjs | null>(dayjs())
  const [calendars, setCalendars] = useState<UiCalendar[]>([])
  const calendarRef = useRef<FullCalendar | null>(null)

  // avoid setState in events loader: keep last range in a ref
  const rangeRef = useRef<{ from: string; to: string } | null>(null)

  // Create Calendar Modal state
  const [openCreate, setOpenCreate] = useState(false)
  const [newCal, setNewCal] = useState<{ name: string; color: string; defaultRole: UiCalendar['defaultRole'] }>({
    name: '',
    color: '#1976d2',
    defaultRole: 'READER',
  })
  const auth = useSelector((state:RootState) => state.auth);
  //const [user, setUser] = useState();


  // ===== Effects =====
  useEffect(() => {
    dayjs.locale('ko')
  }, [])

  // Load visible calendars once
  useEffect(() => {

    console.log("start");
    console.log(auth.user?.email);
    (async () => {
      console.log(auth);
      await api.get('/calendars/visible',{
        params:{
          user : auth.user
        }}).then(res =>{
        console.log(res);
      })

      // try {
      //   // NOTE: endpoint base resolved by API_BASE (see top)
      //   const list = await api<FcCalendarRes[]>('/calendars/visible')
      //   setCalendars(list.map(c => ({ ...c, checked: true })))
      // } catch (e) {
      //   console.error(e)
      // }
    })()
  }, [])

  // ===== Helper: current checked calendarIds =====
  const checkedCalIds = useMemo(() => calendars.filter(c => c.checked).map(c => c.calId), [calendars])

  // ===== FullCalendar event source loader =====
  const loadEvents = useCallback(async (fetchInfo: { start: Date; end: Date }, success: any, failure: any) => {
    try {
      // back-end expects local KST strings, not ISO Zulu
      const from = dayjs(fetchInfo.start).format('YYYY-MM-DDTHH:mm:ss')
      const to = dayjs(fetchInfo.end).format('YYYY-MM-DDTHH:mm:ss')
      rangeRef.current = { from, to }

      // aggregate events across all checked calendars
      const promises = checkedCalIds.map(calId =>
        api<EventRes[]>(`/events?calendarId=${calId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
          .then(items => items.map(ev => ({ ...ev, _calId: calId } as EventRes & { _calId: number })))
      )
      const lists = await Promise.all(promises)
      const all = lists.flat()

      const byCalColor = new Map<number, string>(calendars.map(c => [c.calId, c.color]))

      // map to FullCalendar format
      const fcEvents = all.map(ev => ({
        id: String(ev.eventId),
        title: ev.title,
        start: ev.startAt,
        end: ev.endAt,
        allDay: ev.allDayYn === 'Y',
        backgroundColor: byCalColor.get((ev as any)._calId) || undefined,
        borderColor: byCalColor.get((ev as any)._calId) || undefined,
        extendedProps: {
          calId: ev.calId,
          locationText: ev.locationText,
          note: ev.note,
          roomId: ev.roomId,
          status: ev.status,
          labelId: ev.labelId,
          eventType: ev.eventType,
        },
      }))

      success(fcEvents)
    } catch (err) {
      console.error('[events loader]', err)
      failure(err)
    }
  }, [checkedCalIds, calendars])

  // ===== Handlers =====
  const onDatesSet = (arg: DatesSetArg) => {
    // keep mini calendar in sync (center to current view start)
    setMiniDate(dayjs(arg.start))
  }

  const onMiniChange = (value: Dayjs | null) => {
    setMiniDate(value)
    if (value && calendarRef.current) {
      ;(calendarRef.current as any).getApi().gotoDate(value.toDate())
    }
  }

  const onToggleCalendar = (id: number) => {
    setCalendars(prev => prev.map(c => (c.calId === id ? { ...c, checked: !c.checked } : c)))
  }

  const onSelect = (arg: DateSelectArg) => {
    // TODO: open event-create modal here
    console.log('[select]', arg.startStr, '→', arg.endStr)
  }

  const onEventClick = (arg: EventClickArg) => {
    // TODO: open event-detail modal
    console.log('[click]', arg.event.id)
  }

  const onEventDrop = async (arg: EventDropArg) => {
    // TODO: call PUT /events/{id} with new start/end
    console.log('[drop]', arg.event.id, arg.event.start, arg.event.end)
  }

  const onEventResize = async (arg: EventResizeDoneArg) => {
    // TODO: call PUT /events/{id} with new end
    console.log('[resize]', arg.event.id, arg.event.end)
  }

  const createCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = { name: newCal.name, color: newCal.color, defaultRole: newCal.defaultRole }
      const created = await api<FcCalendarRes>('/calendars', { method: 'POST', body: JSON.stringify(body) })
      setCalendars(prev => [{ ...created, checked: true }, ...prev])
      setOpenCreate(false)
      setNewCal({ name: '', color: '#1976d2', defaultRole: 'READER' })
    } catch (err) {
      console.error(err)
      alert('캘린더 생성에 실패했어요.')
    }
  }

  // ===== Render =====
  return (
    <div className="calendar-layout p-4">
      {/* Left: mini calendar + calendar list */}
      <div className="calendar-left">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
          <DateCalendar value={miniDate} onChange={onMiniChange} disableHighlightToday={false} />
        </LocalizationProvider>

        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-2xl shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">캘린더</h3>
            <button
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              onClick={() => setOpenCreate(true)}
            >
              + 새 캘린더
            </button>
          </div>
          <ul className="space-y-2">
            {calendars.map(c => (
              <li key={c.calId} className="flex items-center gap-2">
                <input type="checkbox" checked={c.checked} onChange={() => onToggleCalendar(c.calId)} />
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: c.color }} />
                <span className="text-sm truncate" title={c.name}>{c.name}</span>
              </li>
            ))}
            {calendars.length === 0 && <li className="text-xs text-gray-500">표시할 캘린더가 없어요.</li>}
          </ul>
        </div>
      </div>

      {/* Right: FullCalendar */}
      <div className="calendar-right">
        <FullCalendar
          ref={calendarRef as any}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="ko"
          timeZone="local"
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          selectable
          editable
          selectMirror
          navLinks
          datesSet={onDatesSet}
          select={onSelect}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          events={(info, success, failure) => loadEvents(info, success, failure)}
          dayMaxEvents
        />
      </div>

      {/* Create Calendar Modal */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-[520px] max-w-[94vw] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">새 캘린더 만들기</h3>
              <button className="px-2 py-1 text-sm" onClick={() => setOpenCreate(false)}>닫기</button>
            </div>
            <form onSubmit={createCalendar} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">이름</label>
                <input className="w-full border rounded px-3 py-2" value={newCal.name} onChange={e => setNewCal(s => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm mb-1">색상</label>
                  <input type="color" className="h-10 w-full border rounded" value={newCal.color} onChange={e => setNewCal(s => ({ ...s, color: e.target.value }))} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">기본 권한</label>
                  <select className="w-full border rounded px-3 py-2" value={newCal.defaultRole} onChange={e => setNewCal(s => ({ ...s, defaultRole: e.target.value as UiCalendar['defaultRole'] }))}>
                    <option value="NONE">NONE</option>
                    <option value="READER">READER</option>
                    <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="BUSY_ONLY">BUSY_ONLY</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500">개발 모드: 이름/색상/기본권한만 서버로 전송합니다.</p>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setOpenCreate(false)}>취소</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
