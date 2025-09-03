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

// 권한 타입 통일
type CalendarAccess =
  | 'NONE'
  | 'BUSY_ONLY'
  | 'READER'
  | 'CONTRIBUTOR'   // 내가 만든 것만 편집
  | 'EDITOR'        // 전체 편집

/** 내가 볼 수 있는 캘린더 요약 (서버 DTO) */
type CalendarSummaryDto = {
  calId: number
  name: string
  color?: string
  isPersonal?: boolean
  defaultForMe?: boolean
  myAccess?: CalendarAccess
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

/** 새 캘린더 생성 요청(백엔드로 보내는 최소 필드) */
type CreateCalendarReq = {
  name: string
  color?: string
  defaultRole?: Exclude<CalendarAccess, 'NONE'> | 'NONE'
}

/** 캘린더 수정 요청(백엔드로 보내는 최소 필드) */
type UpdateCalendarReq = {
  name: string
  color?: string
  defaultRole?: Exclude<CalendarAccess, 'NONE'> | 'NONE'
}

/** 모달 폼 전용(확장 필드 포함, 서버 전송 시 필요한 것만 추려냄) */
type CreateCalendarForm = {
  name: string
  color: string
  defaultRole: 'NONE' | 'BUSY_ONLY' | 'READER' | 'CONTRIBUTOR' | 'EDITOR'
  timeZone: string
  visibility: 'PRIVATE' | 'DEPT' | 'POSITION' | 'PUBLIC'
  description: string
}

/* =============================================================================
   SECTION 2) API (나중에 src/api/calendar.ts로 이동)
   - USE_MOCK 토글로 목/실 API 전환 가능
   ========================================================================== */

const BASE = '/api'
const USE_MOCK = false
const USER_NO = '1' // dev용 헤더. 운영에선 세션/쿠키로 대체

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/* ===== MOCK 저장소 (원하면 켜서 UX 확인) ===== */
const LS_KEY = 'mock_calendars'
function getMockCalendars(): CalendarSummaryDto[] {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return JSON.parse(raw)
  const seed: CalendarSummaryDto[] = [
    { calId: 1, name: '내 캘린더', color: '#4285F4', isPersonal: true, defaultForMe: true },
    { calId: 2, name: '개발부서', color: '#0F9D58' },
    { calId: 3, name: '프로젝트A', color: '#DB4437' }
  ]
  localStorage.setItem(LS_KEY, JSON.stringify(seed))
  return seed
}
function setMockCalendars(arr: CalendarSummaryDto[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr))
}
function nextMockCalId(arr: CalendarSummaryDto[]) {
  return (arr.reduce((m, c) => Math.max(m, c.calId), 0) || 0) + 1
}

// [GET] 내가 볼 수 있는 캘린더 목록
async function fetchVisibleCalendars(): Promise<CalendarSummaryDto[]> {
  if (USE_MOCK) return getMockCalendars()
  return getJSON<CalendarSummaryDto[]>(`${BASE}/calendars/visible`)
}

// [POST] 캘린더 생성
async function createCalendar(body: CreateCalendarReq): Promise<number> {
  if (USE_MOCK) {
    const list = getMockCalendars()
    const id = nextMockCalId(list)
    const newCal: CalendarSummaryDto = {
      calId: id, name: body.name, color: body.color || '#888', isPersonal: true
    }
    setMockCalendars([...list, newCal])
    return id
  }
  const res = await fetch(`${BASE}/calendars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-No': USER_NO },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`캘린더 생성 실패: HTTP ${res.status}`)
  return res.json()
}

// [PUT] 캘린더 수정
async function updateCalendar(calId: number, body: UpdateCalendarReq): Promise<void> {
  if (USE_MOCK) {
    const list = getMockCalendars()
    const idx = list.findIndex(c => c.calId === calId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], name: body.name, color: body.color || list[idx].color }
      setMockCalendars(list)
    }
    return
  }
  const res = await fetch(`${BASE}/calendars/${calId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-User-No': USER_NO },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`캘린더 수정 실패: HTTP ${res.status}`)
}

// [DELETE] 캘린더 삭제(논리)
async function deleteCalendar(calId: number): Promise<void> {
  if (USE_MOCK) {
    const next = getMockCalendars().filter(c => c.calId !== calId)
    setMockCalendars(next)
    return
  }
  const res = await fetch(`${BASE}/calendars/${calId}`, {
    method: 'DELETE',
    headers: { 'X-User-No': USER_NO }
  })
  if (!res.ok) throw new Error(`캘린더 삭제 실패: HTTP ${res.status}`)
}

// [GET] 특정 캘린더의 기간 이벤트
async function fetchEvents(p: { calendarId: number; from: Date; to: Date }): Promise<EventDto[]> {
  if (USE_MOCK) {
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
    from: dayjs(p.from).format('YYYY-MM-DDTHH:mm:ss'),
    to:   dayjs(p.to).format('YYYY-MM-DDTHH:mm:ss'),
  })
  return getJSON<EventDto[]>(`${BASE}/events?${qs}`)
}

/* =============================================================================
   SECTION 3) UI (이 파일이 그대로 src/pages/CalendarPage.tsx)
   ========================================================================== */

export default function CalendarPage() {
  const [monthValue, setMonthValue] = useState<Dayjs>(dayjs())
  const calRef = useRef<FullCalendar | null>(null)

  const [calendars, setCalendars] = useState<CalendarSummaryDto[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const allSelected = useMemo(
    () => calendars.length > 0 && selected.size === calendars.length,
    [calendars, selected]
  )

  const handleMonthChange = (value: Dayjs | null) => {
    if (!value) return
    setMonthValue(value)
    calRef.current?.getApi().gotoDate(value.toDate())
  }

  // 초기 로드: 캘린더 목록 + 초기 선택
  useEffect(() => {
    ;(async () => {
      const list = await fetchVisibleCalendars()
      setCalendars(list)
      let def = list.find(c => c.defaultForMe) || list.find(c => c.isPersonal) || list[0]
      setSelected(new Set(def ? [def.calId] : []))
    })()
  }, [])

  // 선택 상태에 따라 FullCalendar eventSource 동기화
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
        events: async (info, success, failure) => {
          try {
            const data = await fetchEvents({ calendarId: c.calId, from: info.start, to: info.end })
            success(
              data.map(e => ({
                id: e.id,
                title: e.title,
                start: e.start,
                end: e.end,
                allDay: e.allDay,
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

  // 선택 토글
  const toggleSelect = (calId: number) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(calId) ? next.delete(calId) : next.add(calId)
      return next
    })

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(calendars.map(c => c.calId)))

  /* ---------- 캘린더 생성(모달) / 수정 / 삭제 ---------- */

  // 생성 모달
  const [openCreate, setOpenCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCalendarForm>({
    name: '',
    color: '#4285F4',
    defaultRole: 'READER',
    timeZone: 'Asia/Seoul',
    visibility: 'PRIVATE',
    description: ''
  })

  const resetCreateForm = () =>
    setCreateForm({ name: '', color: '#4285F4', defaultRole: 'READER', timeZone: 'Asia/Seoul', visibility: 'PRIVATE', description: '' })

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return alert('캘린더 이름을 입력하세요.')

    // 현재 백엔드는 name/color/defaultRole만 받음 → 필요한 필드만 추려서 전송
    const payload: CreateCalendarReq = {
      name: createForm.name,
      color: createForm.color,
      defaultRole: (createForm.defaultRole ?? 'READER') as any
    }

    try {
      const newId = await createCalendar(payload)
      const list = await fetchVisibleCalendars()
      setCalendars(list)
      setSelected(new Set([newId]))
      setOpenCreate(false)
      resetCreateForm()
      // TODO: visibility/timeZone/description은 백엔드 확장 시 함께 전송하도록 매핑
    } catch (err: any) {
      alert(err.message || '생성 실패')
    }
  }

  // 수정/삭제 (인라인)
  const [editingCalId, setEditingCalId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UpdateCalendarReq>({
    name: '',
    color: '#4285F4',
    defaultRole: 'READER'
  })

  const startEdit = (c: CalendarSummaryDto) => {
    setEditingCalId(c.calId)
    setEditForm({ name: c.name, color: c.color || '#4285F4', defaultRole: 'READER' })
  }
  const cancelEdit = () => setEditingCalId(null)

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCalId == null) return
    if (!editForm.name.trim()) return alert('이름을 입력하세요.')
    try {
      await updateCalendar(editingCalId, editForm)
      const list = await fetchVisibleCalendars()
      setCalendars(list)
      setEditingCalId(null)
    } catch (err: any) {
      alert(err.message || '수정 실패')
    }
  }

  const handleDeleteCalendar = async (calId: number) => {
    if (!confirm('이 캘린더를 삭제할까요?')) return
    try {
      await deleteCalendar(calId)
      const list = await fetchVisibleCalendars()
      setCalendars(list)
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(calId)
        if (next.size === 0 && list.length > 0) next.add(list[0].calId)
        return next
      })
      if (editingCalId === calId) setEditingCalId(null)
    } catch (err: any) {
      alert(err.message || '삭제 실패')
    }
  }

  /* ---------- FullCalendar 기본 핸들러(원하면 서버 연동) ---------- */

  const handleSelect = async (selectInfo: any) => {
    const title = window.prompt('일정 제목을 입력하세요')
    if (!title) {
      selectInfo.view.calendar.unselect()
      return
    }
    // TODO: 이벤트 생성 API 연결
    selectInfo.view.calendar.refetchEvents()
  }

  const handleEventDrop = async (arg: any) => {
    // TODO: 이벤트 업데이트 API 연결
    arg.view.calendar.refetchEvents()
  }

  const handleEventResize = async (arg: any) => {
    // TODO: 이벤트 업데이트 API 연결
    arg.view.calendar.refetchEvents()
  }

  const handleEventClick = async (clickInfo: any) => {
    // TODO: 이벤트 삭제 API 연결
    clickInfo.event.remove()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40, padding: 16 }}>
      {/* 좌측: 작은 달력 + 캘린더 선택/CRUD */}
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

        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              모두 선택
            </label>
            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
            >
              새 캘린더
            </button>
          </div>

          {/* 리스트 + 수정/삭제(인라인) */}
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {calendars.map(c => {
              const isEditing = editingCalId === c.calId
              if (isEditing) {
                return (
                  <form key={c.calId} onSubmit={submitEdit} style={{ display: 'grid', gap: 6, padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={selected.has(c.calId)} onChange={() => toggleSelect(c.calId)} />
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        style={{ width: 48, height: 28, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button type="submit" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #2b7', background: '#2b7', color: '#fff' }}>저장</button>
                        <button type="button" onClick={() => setEditingCalId(null)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' }}>취소</button>
                      </div>
                    </div>
                  </form>
                )
              }
              return (
                <div key={c.calId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={selected.has(c.calId)} onChange={() => toggleSelect(c.calId)} />
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: c.color || '#999' }} />
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => startEdit(c)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' }}>
                      수정
                    </button>
                    <button type="button" onClick={() => handleDeleteCalendar(c.calId)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #f33', background: '#f33', color: '#fff' }}>
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
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
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          height="calc(100vh - 120px)"
          timeZone="local"
          selectable
          editable
          events={[]}
          select={handleSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
        />
      </div>

      {/* ===== 모달: 새 캘린더 생성 ===== */}
      {openCreate && (
        <Modal title="새 캘린더 만들기" onClose={() => setOpenCreate(false)}>
          <form onSubmit={submitCreate} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#555' }}>이름 *</label>
              <input
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="예) 내 업무 캘린더"
                required
                autoFocus
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#555' }}>색상</label>
                <input
                  type="color"
                  value={createForm.color}
                  onChange={e => setCreateForm({ ...createForm, color: e.target.value })}
                  style={{ width: 48, height: 32, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                <label style={{ fontSize: 13, color: '#555' }}>기본 권한</label>
                <select
                  value={createForm.defaultRole}
                  onChange={e => setCreateForm({ ...createForm, defaultRole: e.target.value as any })}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  <option value="NONE">비공개(목록 미표시)</option>
                  <option value="BUSY_ONLY">바쁨만 공개</option>
                  <option value="READER">읽기</option>
                  <option value="CONTRIBUTOR">내 일정만 편집</option>
                  <option value="EDITOR">전체 편집</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#555' }}>타임존</label>
              <input
                value={createForm.timeZone}
                onChange={e => setCreateForm({ ...createForm, timeZone: e.target.value })}
                placeholder="Asia/Seoul"
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#555' }}>공개 범위</label>
              <select
                value={createForm.visibility}
                onChange={e => setCreateForm({ ...createForm, visibility: e.target.value as any })}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              >
                <option value="PRIVATE">개인 전용</option>
                <option value="DEPT">부서 공유</option>
                <option value="POSITION">직급 공유</option>
                <option value="PUBLIC">전체 공개</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#555' }}>설명</label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }}
                placeholder="캘린더 용도나 공유 대상 메모 등"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setOpenCreate(false); resetCreateForm() }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2b7', background: '#2b7', color: '#fff', cursor: 'pointer' }}
              >
                생성
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#666' }}>
              * 현재는 이름/색상/기본권한만 서버로 전송합니다. (타임존/공개범위/설명은 백엔드 확장 시 함께 전송)
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

/* =============================================================================
   SECTION 4) SHARED: 극간단 모달 컴포넌트 (같은 파일에 두었다가 나중에 분리)
   ========================================================================== */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  // ESC 닫기
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button aria-label="닫기" onClick={onClose} style={closeBtnStyle}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000
}
const modalStyle: React.CSSProperties = {
  width: 480, maxWidth: '92vw', background: '#fff', borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: 16
}
const closeBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #ddd',
  background: '#fff', cursor: 'pointer', lineHeight: '28px', fontSize: 18
}