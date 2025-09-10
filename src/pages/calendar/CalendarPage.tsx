// src/pages/calendar/calendarpage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MonthCalendar } from "@mui/x-date-pickers/MonthCalendar";
import { GlobalStyles } from "@mui/material";

import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ko";

// API
import {
  fetchVisibleCalendars,
  fetchEvents,
  createCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventDto,
  type CalendarDefaultRole as ApiCalendarDefaultRole,
  type Member,
  searchMembers,
  type Department,
  fetchDepartments,
} from "../../api/calendarApi";
import { fetchLabels } from "../../api/labelApi";

// 분리된 컴포넌트/타입/유틸
import CalendarCreateDialog from "../../components/dialogs/calendar/CalendarCreateDialog";
import EventCreateDialog from "../../components/dialogs/calendar/EventCreateDialog";
import PeoplePickerDialog from "../../components/dialogs/calendar/PeoplePickerDialog";
import RecurrenceDialog from "../../components/dialogs/calendar/RecurrenceDialog";

import type {
  CalendarEvent,
  CalendarVisibilityItem,
  Label,
  RecurrenceRule,
} from "../../types/calendar/calendar";
import { generateOccurrences } from "../../utils/calendar/recurrence";

// 큰 카테고리(유형) 기본값
const DEFAULT_EVENT_TYPE = "MEETING";

// ──────────────────────────────────────────────────────────────
// 폼 상태 타입
// ──────────────────────────────────────────────────────────────
type EventFormState = {
  calId: number | null;
  title: string;
  allDay: boolean;
  start: Dayjs;
  end: Dayjs;
  labelId?: number;
  eventType?: string;       // ✅ 복구: 큰 카테고리
  locationText?: string;
  note?: string;
};

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [miniDate, setMiniDate] = useState<Dayjs>(dayjs());
  const [visibleCals, setVisibleCals] = useState<CalendarVisibilityItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 라벨 색상 캐시
  const [labelColorMap, setLabelColorMap] = useState<Map<number, string>>(new Map());
  const pickTextColor = (hex = "#64748b") => {
    const n = (h: string) => parseInt(h, 16);
    const m = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "64748b";
    const r = n(m.slice(0, 2)), g = n(m.slice(2, 4)), b = n(m.slice(4, 6));
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y < 140 ? "#fff" : "#111";
  };
  const findCalColor = (calId: number) => visibleCals.find((c) => c.calId === calId)?.color || "";
  const getEventBaseColor = (calId: number, labelId?: number | null, lmap?: Map<number, string>) => {
    const lc = labelId ? lmap?.get(labelId) : undefined;
    return lc ?? findCalColor(calId) ?? "#64748b";
  };
  const dedupByCalId = (arr: CalendarVisibilityItem[]) => {
    const m = new Map<number, CalendarVisibilityItem>();
    arr.forEach(x => m.set(x.calId, x));
    return Array.from(m.values());
  };

  // 캘린더 생성 모달
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = useState<{ name: string; color: string; defaultRole: ApiCalendarDefaultRole; }>(
    { name: "", color: "#4096ff", defaultRole: "READER" }
  );

  // 일정 생성 모달
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>({
    calId: null, title: "", allDay: false,
    start: dayjs(), end: dayjs().add(1, "hour"),
    labelId: undefined, eventType: DEFAULT_EVENT_TYPE,
    locationText: "", note: "",
  });
  const [eventErr, setEventErr] = useState<{ calId?: string; title?: string; time?: string }>({});
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);

  // 반복등록
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    enabled: false,
    freq: "WEEKLY",
    interval: 1,
    end: { mode: "NEVER" },
    byWeekdays: undefined,
    maxInstances: 200,
  });

  // 참석자/공유자 & 사람 선택 모달
  const [selectedAttendees, setSelectedAttendees] = useState<Member[]>([]);
  const [selectedSharers, setSelectedSharers] = useState<Member[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [pickMode, setPickMode] = useState<"ATTENDEE" | "SHARER">("ATTENDEE");
  const [pickQuery, setPickQuery] = useState("");
  const [pickDepartments, setPickDepartments] = useState<Department[]>([]);
  const [pickDeptId, setPickDeptId] = useState<number | null>(null);
  const [pickMembers, setPickMembers] = useState<Member[]>([]);
  const [pickSelectedMembers, setPickSelectedMembers] = useState<Member[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const styles = {
    button: { border: "1px solid #d0d7de", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 14, background: "#fff" } as React.CSSProperties,
    colorDot: (c?: string) => ({
      display: "inline-block", width: 10, height: 10, borderRadius: 6,
      background: c || "#999",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)",
    }) as React.CSSProperties,
  };

  // 최초: 캘린더 목록 로딩
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const list = await fetchVisibleCalendars();
        const withChecked: CalendarVisibilityItem[] = (list || []).map((c) => ({
          calId: c.calId, name: c.name, color: c.color, checked: true,
        }));
        setVisibleCals(dedupByCalId(withChecked));
      } catch (e: any) {
        setError(e?.message ?? "캘린더 목록 조회 실패");
      } finally { setLoading(false); }
    })();
  }, []);

  // 현재 뷰 범위의 이벤트 로딩
  const handleViewDidMount = async () => {
    const fcApi = calendarRef.current?.getApi(); if (!fcApi) return;
    const start = dayjs(fcApi.view.activeStart).format("YYYY-MM-DDTHH:mm:ss");
    const end = dayjs(fcApi.view.activeEnd).format("YYYY-MM-DDTHH:mm:ss");
    const selectedCalIds = visibleCals.filter((c) => c.checked).map((c) => c.calId);
    if (selectedCalIds.length === 0) { setEvents([]); return; }

    try {
      setLoading(true); setError(null);

      // 라벨 캐시
      const labels = await fetchLabels().catch(() => [] as Label[]);
      const lmap = new Map<number, string>();
      (labels as Label[]).forEach((l) => lmap.set(Number(l.labelId), String(l.labelColor)));
      setLabelColorMap(lmap);

      const all: CalendarEvent[] = [];
      for (const calId of selectedCalIds) {
        const data = await fetchEvents({ calendarId: calId, from: start, to: end });
        all.push(...(data as EventDto[]).map((e) => {
          const labelId = (e as any).labelId ?? null;
          const base = getEventBaseColor(calId, labelId, lmap);
          const text = pickTextColor(base);
          return {
            id: String(e.eventId),
            eventId: e.eventId,
            calId: e.calId,
            labelId,
            title: e.title,
            start: e.startAt,
            end: e.endAt,
            allDay: e.allDayYn === "Y",
            backgroundColor: base, borderColor: base, textColor: text,
          } as CalendarEvent;
        }));
      }
      setEvents(all);
    } catch (e: any) {
      setError(e?.message ?? "이벤트 조회 실패");
    } finally { setLoading(false); }
  };

  // 미니 달력 연/월 이동
  const handleMiniChange = (v: Dayjs | null) => {
    if (!v) return;
    const firstDayOfMonth = v.startOf("month");
    setMiniDate(firstDayOfMonth);
    calendarRef.current?.getApi().gotoDate(firstDayOfMonth.toDate());
  };

  // 새 캘린더 만들기
  const handleClickCreateCalendar = () => setCreateOpen(true);
  const handleCreateCalendarSave = async (payload: { name: string; color: string; defaultRole: ApiCalendarDefaultRole }) => {
    try {
      setLoading(true); setError(null);
      const res = await createCalendar(payload);
      const newCal: CalendarVisibilityItem = { calId: res.calId, name: payload.name, color: payload.color, checked: true };
      setVisibleCals(prev => dedupByCalId([newCal, ...prev]));
      setCreateOpen(false);
    } catch (e: any) { setError(e?.message ?? "캘린더 생성 실패"); }
    finally { setLoading(false); }
  };

  // 일정 모달 열기
  const openEventModal = (preset?: Partial<Pick<EventFormState, "start" | "end" | "allDay" | "calId">>) => {
    const defaultCalId = preset?.calId ?? visibleCals.find((c) => c.checked)?.calId ?? visibleCals[0]?.calId ?? null;
    const start = preset?.start ?? dayjs().minute(0).second(0);
    const end = preset?.end ?? start.add(1, "hour");
    setEventForm({
      calId: defaultCalId, title: "", allDay: !!preset?.allDay,
      start, end: (preset?.allDay ? start.startOf("day").add(1, "day") : end),
      labelId: undefined, eventType: DEFAULT_EVENT_TYPE,
      locationText: "", note: "",
    });
    setSelectedLabel(null);
    setEventErr({});
    setSelectedAttendees([]); setSelectedSharers([]);
    // 반복 기본값 리셋
    setRecurrence({ enabled: false, freq: "WEEKLY", interval: 1, end: { mode: "NEVER" }, maxInstances: 200 });
    setRecurrenceOpen(false);

    setEventOpen(true);
  };
  const handleCreateEvent = () => {
    const base = miniDate || dayjs();
    openEventModal({ start: base.hour(9).minute(0).second(0), end: base.hour(10).minute(0).second(0), allDay: false });
  };
  const handleSelect = (arg: DateSelectArg) =>
    openEventModal({ start: dayjs(arg.start), end: dayjs(arg.end), allDay: !!arg.allDay });
  const handleDateClick = (arg: DateClickArg) => {
    const s = dayjs(arg.date).startOf("day");
    openEventModal({ start: s, end: s.add(1, "day"), allDay: true });
  };

  // 사람 선택 모달 (생략: 기존과 동일)
  const openPeoplePicker = (mode: "ATTENDEE" | "SHARER", _query = "") => {
    setPickMode(mode);
    setPickSelectedMembers(mode === "ATTENDEE" ? selectedAttendees : selectedSharers);
    setPickOpen(true);
  };
  useEffect(() => {
    if (!pickOpen) return;
    let alive = true;
    (async () => {
      try { setLoadingDepts(true); const deps = await fetchDepartments(); if (alive) setPickDepartments(deps); }
      catch { if (alive) setPickDepartments([]); }
      finally { if (alive) setLoadingDepts(false); }
    })();
    return () => { alive = false; };
  }, [pickOpen]);
  useEffect(() => {
    if (!pickOpen) return;
    let alive = true;
    const t = setTimeout(async () => {
      try { setLoadingMembers(true); const list = await searchMembers(pickQuery.trim(), 50, pickDeptId ?? undefined); if (alive) setPickMembers(list); }
      catch { if (alive) setPickMembers([]); }
      finally { if (alive) setLoadingMembers(false); }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [pickOpen, pickDeptId, pickQuery]);
  const togglePick = (m: Member) =>
    setPickSelectedMembers(prev => (prev.some(x => x.userNo === m.userNo) ? prev.filter(x => x.userNo !== m.userNo) : [...prev, m]));
  
  const confirmPick = () => {
    // 반대 목록에 이미 있는 멤버는 선택 불가(추가 방어)
    const dedup = (arr: Member[]) => {
      const map = new Map<number, Member>();
      arr.forEach(m => map.set(m.userNo, m));
      return Array.from(map.values());
    };

    if (pickMode === "ATTENDEE") {
      const blocked = new Set(selectedSharers.map(m => m.userNo));
      // ✅ 현재 체크된 것만 "참석자"로, 반대 목록 교차 제거
      const filtered = pickSelectedMembers.filter(m => !blocked.has(m.userNo));
      setSelectedAttendees(dedup(filtered));
    } else {
      const blocked = new Set(selectedAttendees.map(m => m.userNo));
      // ✅ 현재 체크된 것만 "공유자"로, 반대 목록 교차 제거
      const filtered = pickSelectedMembers.filter(m => !blocked.has(m.userNo));
      setSelectedSharers(dedup(filtered));
    }
    setPickOpen(false);
  };
  // 참석자/공유자 교집합 검사
  const hasOverlap = (att: Member[], shr: Member[]) => {
    const A = new Set(att.map(a => a.userNo));
    for (const s of shr) if (A.has(s.userNo)) return true;
    return false;
  };

  const handleQuickAdd = async (mode: "ATTENDEE" | "SHARER", query: string) => {
    if (!query.trim()) return;
    // 실제 멤버 검색
    const found = await searchMembers(query.trim(), 5);
    if (found.length === 1) {
      const m = found[0];
      // 교차 중복 방지
      if (
        (mode === "ATTENDEE" && !selectedAttendees.some(a => a.userNo === m.userNo) && !selectedSharers.some(s => s.userNo === m.userNo)) ||
        (mode === "SHARER" && !selectedSharers.some(s => s.userNo === m.userNo) && !selectedAttendees.some(a => a.userNo === m.userNo))
      ) {
        if (mode === "ATTENDEE") setSelectedAttendees(prev => [...prev, m]);
        else setSelectedSharers(prev => [...prev, m]);
      } else {
        alert("이미 다른 목록에 포함되어 있습니다.");
      }
    } else {
      // 0명 or 여러 명 → 모달 오픈(검색어 전달)
      setPickMode(mode);
      setPickSelectedMembers(mode === "ATTENDEE" ? selectedAttendees : selectedSharers);
      setPickOpen(true);
      setPickQuery(query);
    }
  };

  // 일정 저장 (eventType 포함, 반복등록 지원)
  const handleEventSave = async () => {
    const { calId, title, allDay, start, end, labelId, eventType, locationText, note } = eventForm;
    const nextErr: typeof eventErr = {};
    if (!calId) nextErr.calId = "캘린더를 선택하세요.";
    if (!title?.trim()) nextErr.title = "제목을 입력하세요.";
    if (!start || !end || !end.isAfter(start)) nextErr.time = "시작/종료 시간을 확인하세요.";
    setEventErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    if (hasOverlap(selectedAttendees, selectedSharers)) {
      alert("같은 사용자를 참여자와 공유자에 동시에 지정할 수 없어요.");
      return;
    }

    try {
      setLoading(true); setError(null);

      const baseCalId = calId!;
      const labelToUse = selectedLabel?.labelId ?? labelId;
      const typeToUse = eventType ?? DEFAULT_EVENT_TYPE;

      // 반복 OFF → 1건 생성
      if (!recurrence.enabled) {
        const res = await createEvent({
          calId: baseCalId, title: title.trim(),
          startAt: start.format("YYYY-MM-DDTHH:mm:ss"),
          endAt: end.format("YYYY-MM-DDTHH:mm:ss"),
          allDayYn: allDay ? "Y" : "N",
          labelId: labelToUse,
          eventType: typeToUse,              // ✅ 전송
          locationText, note,
          attendeeUserNos: selectedAttendees.map(m => m.userNo),
          shareUserNos: selectedSharers.map(m => m.userNo),
        });

        const base = getEventBaseColor(baseCalId, labelToUse, labelColorMap);
        const text = pickTextColor(base);
        setEvents(prev => [...prev, {
          id: String(res.eventId), eventId: res.eventId, calId: baseCalId,
          labelId: labelToUse ?? null, title: title.trim(),
          start: start.format("YYYY-MM-DDTHH:mm:ss"),
          end: end.format("YYYY-MM-DDTHH:mm:ss"),
          allDay, backgroundColor: base, borderColor: base, textColor: text,
        } as CalendarEvent]);
        setEventOpen(false);
        return;
      }

      // 반복 ON → 인스턴스 계산 후 다건 생성
      const occs = generateOccurrences(recurrence, start, end);
      if (occs.length === 0) throw new Error("반복 설정에 해당하는 일정이 없습니다.");

      const concurrency = 5;
      const chunks: typeof occs[] = [];
      for (let i = 0; i < occs.length; i += concurrency) chunks.push(occs.slice(i, i + concurrency));

      const createdEvents: Array<{ eventId: number; start: string; end: string }> = [];
      for (const chunk of chunks) {
        const results = await Promise.allSettled(chunk.map(o => createEvent({
          calId: baseCalId,
          title: title.trim(),
          startAt: o.start,
          endAt: o.end,
          allDayYn: allDay ? "Y" : "N",
          labelId: labelToUse,
          eventType: typeToUse,             // ✅ 전송
          locationText, note,
          attendeeUserNos: selectedAttendees.map(m => m.userNo),
          shareUserNos: selectedSharers.map(m => m.userNo),
        })));
        results.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            const ok = r.value;
            createdEvents.push({ eventId: ok.eventId, start: chunk[idx].start, end: chunk[idx].end });
          }
        });
      }

      const baseColor = getEventBaseColor(baseCalId, labelToUse, labelColorMap);
      const textColor = pickTextColor(baseColor);
      setEvents(prev => [
        ...prev,
        ...createdEvents.map(ce => ({
          id: String(ce.eventId),
          eventId: ce.eventId,
          calId: baseCalId,
          labelId: labelToUse ?? null,
          title: title.trim(),
          start: ce.start,
          end: ce.end,
          allDay,
          backgroundColor: baseColor, borderColor: baseColor, textColor: textColor,
        } as CalendarEvent)),
      ]);

      setEventOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "일정(반복) 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  // 이동/리사이즈/삭제 (기존과 동일)
  const handleEventDrop = async (info: EventDropArg) => {
    try {
      setLoading(true); setError(null);
      const ev = info.event;
      await updateEvent(ev.id!, {
        title: ev.title,
        startAt: dayjs(ev.start!).format("YYYY-MM-DDTHH:mm:ss"),
        endAt: ev.end ? dayjs(ev.end).format("YYYY-MM-DDTHH:mm:ss") : dayjs(ev.start!).format("YYYY-MM-DDTHH:mm:ss"),
        allDayYn: ev.allDay ? "Y" : "N",
      });
    } catch (e: any) { setError(e?.message ?? "일정 이동 실패"); info.revert(); }
    finally { setLoading(false); }
  };
  const handleEventResize = async (info: EventResizeDoneArg) => {
    try {
      setLoading(true); setError(null);
      const ev = info.event;
      await updateEvent(ev.id!, {
        title: ev.title,
        startAt: dayjs(ev.start!).format("YYYY-MM-DDTHH:mm:ss"),
        endAt: ev.end ? dayjs(ev.end).format("YYYY-MM-DDTHH:mm:ss") : dayjs(ev.start!).format("YYYY-MM-DDTHH:mm:ss"),
        allDayYn: ev.allDay ? "Y" : "N",
      });
    } catch (e: any) { setError(e?.message ?? "일정 기간 변경 실패"); info.revert(); }
    finally { setLoading(false); }
  };
  const handleEventClick = async (arg: EventClickArg) => {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    try { setLoading(true); setError(null); await deleteEvent(arg.event.id!); setEvents((prev) => prev.filter((e) => String(e.eventId) !== String(arg.event.id))); }
    catch (e: any) { setError(e?.message ?? "일정 삭제 실패"); }
    finally { setLoading(false); }
  };

  // 캘린더 체크 변경/기간 변경 시 재조회
  useEffect(() => { handleViewDidMount(); }, [visibleCals.map((c) => `${c.calId}:${c.checked}`).join("|")]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <GlobalStyles styles={{
        ".fc .fc-toolbar-title": { fontSize: "20px", fontWeight: 700, letterSpacing: "-0.2px" },
        ".fc .fc-button": { borderRadius: 8, padding: "4px 10px" },
        ".fc-theme-standard td, .fc-theme-standard th": { borderColor: "#e5e7eb" },
        ".fc .fc-col-header-cell-cushion": { padding: "8px 4px", fontWeight: 600, color: "#374151" },
        ".fc .fc-daygrid-day-number": { fontSize: 13, fontWeight: 600, color: "#374151", padding: "6px 8px" },
        ".fc .fc-daygrid-day.fc-day-today": { background: "#fff7ed" },
        ".fc .fc-daygrid-day.fc-day-other": { opacity: 0.45 },
        ".fc .fc-daygrid-block-event": { margin: "2px 6px" },
        ".fc .fc-event": { borderRadius: 8, padding: "1px 4px", fontSize: 12, border: "none" },
        ".fc .fc-event .fc-event-main": { padding: "0 2px" },
        ".fc .fc-daygrid-more-link": { fontWeight: 600, color: "#2563eb" },
        ".fc .fc-timegrid-axis-cushion": { fontSize: 12, color: "#6b7280" },
        ".fc .fc-timegrid-slot": { height: "38px" },
        ".calendar-right, .calendar-right .fc, .calendar-right .fc-view-harness, .calendar-right .fc-scrollgrid": { width: "100%" },
      }} />

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(900px, 1fr)", gap: 24, alignItems: "start", width: "100%" }}>
        {/* 왼쪽 패널 */}
        <div style={{ maxWidth: 280, position: "sticky", top: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button style={styles.button} onClick={() => setMiniDate(prev => prev.subtract(1, "year"))}>◀</button>
            <strong>{miniDate.format("YYYY년")}</strong>
            <button style={styles.button} onClick={() => setMiniDate(prev => prev.add(1, "year"))}>▶</button>
          </div>
          <MonthCalendar value={miniDate} onChange={handleMiniChange} />

          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: "8px 0" }}>캘린더</h4>
            {visibleCals.length === 0 && <div>캘린더가 없습니다.</div>}
            {visibleCals.map((c) => (
              <label key={`${c.calId}-${c.name}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
                <input
                  type="checkbox"
                  checked={!!c.checked}
                  onChange={(e) => setVisibleCals((prev) => prev.map((x) => (x.calId === c.calId ? { ...x, checked: e.target.checked } : x)))}
                />
                <span style={styles.colorDot(c.color)} /><span>{c.name}</span>
              </label>
            ))}
          </div>

          {loading && <div style={{ marginTop: 12 }}>불러오는 중…</div>}
          {error && <div style={{ marginTop: 12, color: "tomato" }}>{error}</div>}
        </div>

        {/* 오른쪽 메인 캘린더 */}
        <div className="calendar-right" style={{ minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
            <button style={styles.button} onClick={() => handleClickCreateCalendar()}>+ 새 캘린더</button>
            <button style={styles.button} onClick={handleCreateEvent}>+ 새 일정</button>
          </div>

          <FullCalendar
            ref={calendarRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale="ko" timeZone="local" initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            height={"calc(100vh - 140px)"}
            expandRows stickyHeaderDates
            views={{
              dayGridMonth: { dayMaxEventRows: 3 },
              timeGridWeek: { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
              timeGridDay:  { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
            }}
            selectable editable weekends selectMirror dayMaxEvents
            moreLinkClick="popover" moreLinkText={(n: number) => `+${n}개`}
            navLinks nowIndicator eventDisplay="block"
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            dayHeaderFormat={{ weekday: "short" }}
            events={events}
            select={handleSelect} dateClick={handleDateClick}
            eventDrop={handleEventDrop} eventResize={handleEventResize} eventClick={handleEventClick}
            datesSet={handleViewDidMount}
          />
        </div>
      </div>

      {/* 새 캘린더 모달 */}
      <CalendarCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateCalendarSave}
        init={createForm}
      />

      {/* 새 일정 모달 */}
      <EventCreateDialog
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        visibleCals={visibleCals}
        value={{
          calId: eventForm.calId,
          title: eventForm.title,
          allDay: eventForm.allDay,
          start: eventForm.start,
          end: eventForm.end,
          label: selectedLabel,
          eventType: eventForm.eventType,        // ✅ 전달
          locationText: eventForm.locationText,
          note: eventForm.note,
        }}
        onChange={(patch) => {
          // 1) 종일 토글
          if ("allDay" in patch) {
            const allDay = !!patch.allDay;
            setEventForm(f => {
              const newEnd = allDay
                ? f.start.startOf("day").add(1, "day")
                : (f.end.isAfter(f.start) ? f.end : f.start.add(1, "hour"));
              return { ...f, allDay, end: newEnd };
            });
            return;
          }
          // 2) 시작시간 변경
          if (patch.start) {
            const newStart = patch.start;
            setEventForm(f => {
              const newEnd = f.allDay
                ? newStart.startOf("day").add(1, "day")
                : (f.end.isAfter(newStart) ? f.end : newStart.add(1, "hour"));
              return { ...f, start: newStart, end: newEnd };
            });
            return;
          }
          // 3) 라벨 선택
          if ("label" in patch) {
            const lab = patch.label ?? null;
            setSelectedLabel(lab);
            setEventForm(f => ({ ...f, labelId: lab?.labelId }));
            return;
          }
          // 4) 나머지(유형 포함)
          setEventForm(f => ({ ...f, ...(patch as Partial<EventFormState>) }));
        }}
        onSave={handleEventSave}
        attendees={selectedAttendees}
        sharers={selectedSharers}
        onQuickAdd={handleQuickAdd}
        onOpenPeoplePicker={(m) => openPeoplePicker(m)}
        error={eventErr}
        recurrence={recurrence}
        onOpenRecurrence={() => setRecurrenceOpen(true)}
      />

      {/* 반복 등록 모달 */}
      <RecurrenceDialog
        open={recurrenceOpen}
        onClose={() => setRecurrenceOpen(false)}
        value={recurrence}
        onSubmit={(rule) => { setRecurrence(rule); setRecurrenceOpen(false); }}
        anchorStart={eventForm.start}
        anchorEnd={eventForm.end}
      />

      {/* 사람 선택 모달 */}
      <PeoplePickerDialog
        open={pickOpen}
        mode={pickMode}
        departments={pickDepartments as any}
        members={pickMembers as any}
        selected={pickSelectedMembers as any}
        blockedUserNos={                           
          pickMode === "ATTENDEE"
            ? selectedSharers.map(s => s.userNo)   // 공유자에 있으면 참석자로 선택 불가
            : selectedAttendees.map(a => a.userNo) // 참석자에 있으면 공유자로 선택 불가
        }
        loadingDepts={loadingDepts}
        loadingMembers={loadingMembers}
        onClose={() => setPickOpen(false)}
        onConfirm={confirmPick}
        onToggle={(m: any) => togglePick(m)}
        onQueryChange={(q) => setPickQuery(q)}
        onDeptChange={(id) => setPickDeptId(id)}
      />
    </LocalizationProvider>
  );
}
