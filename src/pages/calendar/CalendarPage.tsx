// src/pages/calendar/CalendarPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { RootState } from "../../store/store";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MonthCalendar } from "@mui/x-date-pickers/MonthCalendar";
import { GlobalStyles } from "@mui/material";
import { fetchPositions } from "../../api/calendarApi";
import "./CalendarPage.css"

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
  createRoomReservation,
  saveCalendarShares,
  getCalendar,
  getCalendarShares,
  updateCalendar as updateCalendarMeta,
  deleteCalendar as deleteCalendarApi,
  updateCalendar,
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
  ShareUpsertReq,
} from "../../types/calendar/calendar";
import { generateOccurrences } from "../../utils/calendar/recurrence";
import { useSelector } from "react-redux";
import EventDetailDialog from "../../components/dialogs/calendar/EventDetailDialog";
import { isValidHexColor } from "../../constants/calendar/calendar";

const DEFAULT_EVENT_TYPE = "MEETING";

// 권한 판별(백엔드 필드명 다양성 방어)
const roleOf = (obj: any) =>
  String(obj?.defaultRole ?? obj?.role ?? obj?.myRole ?? obj?.shareRole ?? "").toUpperCase();
const isBusyRole = (obj: any) => roleOf(obj) === "BUSY_ONLY";

type EventFormState = {
  calId: number | null;
  title: string;
  allDay: boolean;
  start: Dayjs;
  end: Dayjs;
  labelId?: number;
  typeId?: number;
  locationText?: string;
  note?: string;
};

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar | null>(null);
  const userNo = useSelector((s: RootState) => s.auth.user?.userNo);
  const [miniDate, setMiniDate] = useState<Dayjs>(dayjs());
  const [visibleCals, setVisibleCals] = useState<CalendarVisibilityItem[]>([]);
  const [busyOnlyMap, setBusyOnlyMap] = useState<Map<number, boolean>>(new Map());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const pendingRoomRef = useRef<{
    needsRoom: boolean;
    selectedRoom: { roomId: number; roomName: string } | null;
  } | null>(null);

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

  // 편집/삭제 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editingCalId, setEditingCalId] = useState<number | null>(null);
  const [editInit, setEditInit] = useState<{ name: string; color: string; defaultRole?: ApiCalendarDefaultRole }>({ name: "", color: "#4096ff" });
  const [editSharesInit, setEditSharesInit] = useState<ShareUpsertReq | undefined>(undefined);

  const [depMap, setDepMap] = useState<Map<number, string>>(new Map());
  const [posMap, setPosMap] = useState<Map<number, string>>(new Map());
  const [userMap, setUserMap] = useState<Map<number, string>>(new Map());

  // 일정 생성 모달
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>({
    calId: null, title: "", allDay: false,
    start: dayjs(), end: dayjs().add(1, "hour"),
    labelId: undefined, typeId: undefined,
    locationText: "", note: "",
  });
  const [eventErr, setEventErr] = useState<{ calId?: string; title?: string; time?: string }>({});
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null);

  // 오늘 일정
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);

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
    nameBtn: { background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer", font: "inherit" } as React.CSSProperties,
  };

  // 최초: 캘린더 목록 로딩(+ BUSY_ONLY 맵 구축)
  useEffect(() => {
    if (!userNo) return;
    (async () => {
      try {
        setLoading(true); setError(null);
        const list = await fetchVisibleCalendars(userNo);
        const withChecked: CalendarVisibilityItem[] = (list || []).map((c: any) => ({
          calId: c.calId, name: c.name, color: c.color, checked: true,
        }));
        setVisibleCals(dedupByCalId(withChecked));

        const bm = new Map<number, boolean>();
        (list || []).forEach((c: any) => bm.set(Number(c.calId), isBusyRole(c)));
        setBusyOnlyMap(bm);
      } catch (e: any) {
        setError(e?.message ?? "캘린더 목록 조회 실패");
      } finally { setLoading(false); }
    })();
  }, [userNo]);

  useEffect(() => {
    (async () => {
      try {
        const deps = await fetchDepartments();
        setDepMap(new Map(deps.map(d => [Number(d.depId), String(d.depName)])));
      } catch { }

      try {
        const poss = await fetchPositions();
        setPosMap(new Map(poss.map(p => [Number(p.posId), String(p.posName)])));
      } catch { }

      try {
        const ms = await searchMembers("", 1000);
        setUserMap(new Map(ms.map(m => [
          Number(m.userNo),
          String(m.userName ?? (m as any).name ?? m.email ?? m.userNo)
        ])));
      } catch { }
    })();
  }, []);

  // 현재 뷰 범위의 이벤트 로딩(마스킹 포함)
  const handleViewDidMount = async () => {
    const fcApi = calendarRef.current?.getApi(); if (!fcApi) return;
    const start = dayjs(fcApi.view.activeStart).format("YYYY-MM-DD HH:mm:ss");
    const end = dayjs(fcApi.view.activeEnd).format("YYYY-MM-DD HH:mm:ss");
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
        all.push(...(data as EventDto[]).map((e: any) => {
          const labelId = (e as any).labelId ?? null;
          const base = getEventBaseColor(calId, labelId, lmap);
          const text = pickTextColor(base);
          
          const busy = (e as any).__busyMasked === true;
const idStr = busy ? String((e as any).__clickBlockId ?? `busy:${e.eventId}`) : String(e.eventId);

return {
  id: idStr,
  eventId: e.eventId,
  calId: e.calId,
  labelId,
  title: busy ? "바쁨" : e.title,   // ← 제목 마스킹
  start: e.startAt,
  end: e.endAt,
  allDay: e.allDayYn === "Y",
  backgroundColor: base, borderColor: base, textColor: text,
} as CalendarEvent;
        }));
      }
      setEvents(all);

      // 월 범위 이벤트 수(표시용)
      const cur = dayjs(fcApi.getDate());
      const mStart = cur.startOf("month");
      const mEnd = cur.endOf("month");
      const count = all.filter(ev => {
        const s = dayjs(ev.start as string);
        const e = dayjs((ev.end as string) || (ev.start as string));
        return s.isBefore(mEnd.add(1, "millisecond")) && e.isAfter(mStart.subtract(1, "millisecond"));
      }).length;
      setMonthCount(count);
    } catch (e: any) {
      setError(e?.message ?? "이벤트 조회 실패");
    } finally { setLoading(false); }
  };

  // 오늘 일정(마스킹 포함)
  useEffect(() => {
    const selectedCalIds = visibleCals.filter(c => c.checked).map(c => c.calId);
    if (selectedCalIds.length === 0) { setTodayEvents([]); return; }

    (async () => {
      try {
        setLoadingToday(true);
        const start = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const end = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");

        const all: CalendarEvent[] = [];
        for (const calId of selectedCalIds) {
          const data = await fetchEvents({ calendarId: calId, from: start, to: end });
          all.push(...(data as EventDto[]).map((e: any) => {
            const labelId = (e as any).labelId ?? null;
            const base = getEventBaseColor(calId, labelId, labelColorMap);
            const text = pickTextColor(base);
            const busy = (e as any).__busyMasked === true;
const idStr = busy ? String((e as any).__clickBlockId ?? `busy:${e.eventId}`) : String(e.eventId);

return {
  id: idStr,
  eventId: e.eventId,
  calId: e.calId,
  labelId,
  title: busy ? "바쁨" : e.title,
  start: e.startAt,
  end: e.endAt,
  allDay: e.allDayYn === "Y",
  backgroundColor: base, borderColor: base, textColor: text,
} as CalendarEvent;
          }));
        }

        all.sort((a, b) => dayjs(a.start as string).valueOf() - dayjs(b.start as string).valueOf());
        setTodayEvents(all);
      } catch {
        setTodayEvents([]);
      } finally {
        setLoadingToday(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCals.map(c => `${c.calId}:${c.checked}`).join("|"), busyOnlyMap, labelColorMap]);

  // 미니 달력 이동
  const handleMiniChange = (v: Dayjs | null) => {
    if (!v) return;
    const firstDayOfMonth = v.startOf("month");
    setMiniDate(firstDayOfMonth);
    calendarRef.current?.getApi().gotoDate(firstDayOfMonth.toDate());
  };

  // 새 캘린더 만들기
  const handleClickCreateCalendar = () => setCreateOpen(true);

  const handleCreateCalendarSave = async (form: {
    name: string;
    color: string;
    defaultRole: ApiCalendarDefaultRole;
    shares?: ShareUpsertReq;
  }) => {
    try {
      setError?.(null);

      const name = (form.name ?? "").trim();
      const color = (form.color ?? "").trim().toUpperCase();
      if (!name) { setError?.("캘린더 이름을 입력하세요."); return; }
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) { setError?.("색상은 #RRGGBB 형식이어야 합니다."); return; }

      const res = await createCalendar({ name, color, defaultRole: form.defaultRole });
      const calId = Number((res as any)?.calId ?? (res as any)?.id ?? res);

      // (선택) 공유 저장
      const raw = (form.shares ?? {}) as any;
      const normPayload: ShareUpsertReq = {
        users: Array.isArray(raw.members) ? raw.members : (Array.isArray(raw.users) ? raw.users : []),
        departments: Array.isArray(raw.departments) ? raw.departments : (Array.isArray(raw.deps) ? raw.deps : []),
        positions: Array.isArray(raw.positions) ? raw.positions : [],
      };
      const hasShares =
        (normPayload.users?.length ?? 0) +
        (normPayload.departments?.length ?? 0) +
        (normPayload.positions?.length ?? 0) > 0;

      if (hasShares && Number.isFinite(calId)) {
        try {
          await saveCalendarShares({ calId, mode: "merge", payload: normPayload, userNo: Number(userNo) });
        } catch {
          setError?.("공유 저장에 실패했습니다. ‘공유 관리’에서 다시 시도하세요.");
        }
      }

      // 가시 캘린더 갱신(+ BUSY_ONLY 맵 재생성)
      try {
        const list = await (userNo ? fetchVisibleCalendars(userNo) : fetchVisibleCalendars());
        const withChecked: CalendarVisibilityItem[] =
          (list || []).map((c: any) => ({ calId: c.calId, name: c.name, color: c.color, checked: true }));
        setVisibleCals(dedupByCalId(withChecked));

        const bm = new Map<number, boolean>();
        (list || []).forEach((c: any) => bm.set(Number(c.calId), isBusyRole(c)));
        setBusyOnlyMap(bm);
      } catch {}

      setCreateOpen?.(false);
    } catch (e: any) {
      setError?.(e?.message ?? "캘린더 생성 실패");
    }
  };

  // 캘린더 편집 열기 (BUSY_ONLY는 편집 버튼 동작 안 함)
  const openEditCalendar = async (calId: number) => {
    try {
      // BUSY_ONLY 사용자는 편집 열지 않음
      if (busyOnlyMap.get(calId)) return;

      setLoading(true); setError(null);
      setEditingCalId(calId);

      const detail = await getCalendar(calId);

      let sharesInit: any | undefined = undefined;
      try {
        sharesInit = await getCalendarShares(calId);
      } catch (e: any) {
        alert("이 캘린더를 수정할 수 없습니다.");
        return;
      }

      setEditInit({ name: (detail as any).calName ?? (detail as any).name, color: (detail as any).color });

      // 이름 보존형으로 매핑
      const users = (sharesInit?.users ?? []).map((u: any) => ({
        userNo: Number(u.userNo), role: u.role, userName: u.userName ?? userMap.get(Number(u.userNo)) ?? "",
      }));
      const departments = (sharesInit?.departments ?? []).map((d: any) => ({
        depId: Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID),
        role: d.role, depName: d.depName ?? depMap.get(Number(d.depId)) ?? "",
      }));
      const positions = (sharesInit?.positions ?? []).map((p: any) => ({
        posId: Number(p.posId ?? p.id ?? p.POS_ID),
        role: p.role, posName: p.posName ?? posMap.get(Number(p.posId)) ?? "",
      }));
      setEditSharesInit({ users, departments, positions } as any);

      setEditOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "캘린더 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 편집 저장
  const handleEditSubmit = async (form: {
    name: string;
    color: string;
    defaultRole: ApiCalendarDefaultRole;
    shares?: {
      users?: any[];
      departments?: any[];
      positions?: any[];
      mode?: "merge" | "replace";
    };
  }) => {
    if (!editingCalId) return;
    try {
      setLoading(true); setError(null);
      await updateCalendar(editingCalId, { name: form.name, color: form.color });

      if (form.shares) {
        try {
          await saveCalendarShares({
            calId: editingCalId,
            mode: form.shares.mode ?? "replace",
            payload: {
              users: form.shares.users ?? [],
              departments: form.shares.departments ?? [],
              positions: form.shares.positions ?? [],
            },
            userNo: Number(userNo),
          });
        } catch (e: any) {
          alert("공유 변경 권한이 없어 이름/색상만 저장되었습니다.");
        }
      }

      setEditOpen(false);

      // 목록/이벤트 갱신 (+BUSY_ONLY 맵)
      const list = await (userNo ? fetchVisibleCalendars(userNo) : fetchVisibleCalendars());
      const withChecked: CalendarVisibilityItem[] = (list || []).map((c: any) => ({
        calId: c.calId, name: c.name, color: c.color,
        checked: visibleCals.find(v => v.calId === c.calId)?.checked ?? true,
      }));
      setVisibleCals(dedupByCalId(withChecked));

      const bm = new Map<number, boolean>();
      (list || []).forEach((c: any) => bm.set(Number(c.calId), isBusyRole(c)));
      setBusyOnlyMap(bm);

      await handleViewDidMount();
    } catch (e: any) {
      setError(e?.message ?? "캘린더 수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDelete = async () => {
    if (!editingCalId) return;
    if (!window.confirm("이 캘린더를 삭제하시겠습니까? (복구 불가)")) return;
    try {
      setLoading(true); setError(null);
      await deleteCalendarApi(editingCalId);

      setVisibleCals(prev => prev.filter(c => c.calId !== editingCalId));
      setEvents(prev => prev.filter(e => e.calId !== editingCalId));
      setEditOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "캘린더 삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  // 일정 생성(기존)
  const openEventModal = (preset?: Partial<Pick<EventFormState, "start" | "end" | "allDay" | "calId">>) => {
    const defaultCalId = preset?.calId ?? visibleCals.find((c) => c.checked)?.calId ?? visibleCals[0]?.calId ?? null;
    const start = preset?.start ?? dayjs().minute(0).second(0);
    const end = preset?.end ?? start.add(1, "hour");
    setEventForm({
      calId: defaultCalId, title: "", allDay: !!preset?.allDay,
      start, end,
      labelId: undefined, typeId: undefined,
      locationText: "", note: "",
    });
    setSelectedLabel(null);
    setEventErr({});
    setSelectedAttendees([]); setSelectedSharers([]);
    setRecurrence({ enabled: false, freq: "WEEKLY", interval: 1, end: { mode: "NEVER" }, maxInstances: 200 });
    setRecurrenceOpen(false);

    setEventOpen(true);
  };
  const handleCreateEvent = () => {
    const base = miniDate || dayjs();
    openEventModal({ start: base.hour(9).minute(0).second(0), end: base.hour(10).minute(0).second(0), allDay: false });
  };
  const handleSelect = (arg: DateSelectArg) => {
    const start = dayjs(arg.start).hour(9).minute(0).second(0);
    const rawMs = dayjs(arg.end).diff(dayjs(arg.start), "millisecond");
    const durMs = Math.max(rawMs, 60 * 60 * 1000);
    const end = start.add(durMs, "millisecond");
    openEventModal({ start, end, allDay: false });
  };
  const handleDateClick = (arg: DateClickArg) => {
    const s = dayjs(arg.date).hour(9).minute(0).second(0);
    openEventModal({ start: s, end: s.add(1, "hour"), allDay: false });
  };

  // 사람 선택 (생략 — 기존 동일)
  const [calQuery, setCalQuery] = useState("");
  const filteredCals = useMemo(() => {
    const q = calQuery.trim().toLowerCase();
    if (!q) return visibleCals;
    return visibleCals.filter(c => (c.name ?? "").toLowerCase().includes(q));
  }, [calQuery, visibleCals]);
  const [monthCount, setMonthCount] = useState(0);

  // 저장 (기존)
  const hasOverlap = (att: Member[], shr: Member[]) => {
    const A = new Set(att.map(a => a.userNo));
    for (const s of shr) if (A.has(s.userNo)) return true;
    return false;
  };

  const handleEventSave = async () => {
    const { calId, title, allDay, start, end, labelId, typeId, locationText, note } = eventForm;
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

      if (!recurrence.enabled) {
        const res = await createEvent({
          calId: calId!, title: title.trim(),
          startAt: start.format("YYYY-MM-DD HH:mm:ss"),
          endAt: end.format("YYYY-MM-DD HH:mm:ss"),
          allDayYn: allDay ? "Y" : "N",
          labelId,
          typeId: Number(typeId),
          locationText, note,
          attendeeUserNos: selectedAttendees.map(m => m.userNo),
          shareUserNos: selectedSharers.map(m => m.userNo),
        });

        try {
          const pr = pendingRoomRef.current;
          if (pr?.needsRoom && pr.selectedRoom) {
            await createRoomReservation({
              eventId: res.eventId,
              roomId: pr.selectedRoom.roomId,
              startAt: start.format("YYYY-MM-DD HH:mm:ss"),
              endAt: end.format("YYYY-MM-DD HH:mm:ss"),
            });
          }
        } finally {
          pendingRoomRef.current = null;
        }

        const base = getEventBaseColor(calId!, labelId, labelColorMap);
        const text = pickTextColor(base);
        const busy = !!busyOnlyMap.get(Number(calId));
        setEvents(prev => [...prev, {
          id: String(res.eventId), eventId: res.eventId, calId: calId!,
          labelId: labelId ?? null, title: busy ? "" : title.trim(), // 생성 직후도 마스킹
          start: start.format("YYYY-MM-DD HH:mm:ss"),
          end: end.format("YYYY-MM-DD HH:mm:ss"),
          allDay, backgroundColor: base, borderColor: base, textColor: text,
          extendedProps: { isBusyOnly: busy, calId },
        } as any]);
        setEventOpen(false);
        return;
      }

      // 반복 등록 (기존)
      const occs = generateOccurrences(recurrence, start, end);
      if (occs.length === 0) throw new Error("반복 설정에 해당하는 일정이 없습니다.");

      const concurrency = 5;
      const chunks: typeof occs[] = [];
      for (let i = 0; i < occs.length; i += concurrency) chunks.push(occs.slice(i, i + concurrency));

      const createdEvents: Array<{ eventId: number; start: string; end: string }> = [];
      for (const chunk of chunks) {
        const results = await Promise.allSettled(chunk.map(o => createEvent({
          calId: calId!,
          title: title.trim(),
          startAt: o.start, endAt: o.end,
          allDayYn: allDay ? "Y" : "N",
          labelId, typeId: Number(typeId),
          locationText, note,
          attendeeUserNos: selectedAttendees.map(m => m.userNo),
          shareUserNos: selectedSharers.map(m => m.userNo),
        })));

        const pr = pendingRoomRef.current;
        const reservationPromises: Promise<any>[] = [];

        results.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            const ok = r.value;
            createdEvents.push({ eventId: ok.eventId, start: chunk[idx].start, end: chunk[idx].end });
            if (pr?.needsRoom && pr.selectedRoom) {
              reservationPromises.push(createRoomReservation({
                eventId: ok.eventId,
                roomId: pr.selectedRoom.roomId,
                startAt: chunk[idx].start, endAt: chunk[idx].end,
              }));
            }
          }
        });

        await Promise.allSettled(reservationPromises);
      }
      pendingRoomRef.current = null;

      const baseColor = getEventBaseColor(calId!, labelId, labelColorMap);
      const textColor = pickTextColor(baseColor);
      const busy = !!busyOnlyMap.get(Number(calId));
      setEvents(prev => [
        ...prev,
        ...createdEvents.map(ce => ({
          id: String(ce.eventId),
          eventId: ce.eventId,
          calId: calId!,
          labelId: labelId ?? null,
          title: busy ? "" : title.trim(),
          start: ce.start, end: ce.end,
          allDay,
          backgroundColor: baseColor, borderColor: baseColor, textColor: textColor,
          extendedProps: { isBusyOnly: busy, calId },
        } as any)),
      ]);

      setEventOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "일정(반복) 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  // 이동/리사이즈( BUSY_ONLY는 금지 )
  const handleEventDrop = async (info: EventDropArg) => {
    if ((info.event.extendedProps as any)?.isBusyOnly) { info.revert(); return; }
    try {
      setLoading(true); setError(null);
      const ev = info.event;
      await updateEvent(ev.id!, {
        title: ev.title,
        startAt: dayjs(ev.start!).format("YYYY-MM-DD HH:mm:ss"),
        endAt: ev.end ? dayjs(ev.end).format("YYYY-MM-DD HH:mm:ss") : dayjs(ev.start!).format("YYYY-MM-DD HH:mm:ss"),
        allDayYn: ev.allDay ? "Y" : "N",
      });
    } catch (e: any) { setError(e?.message ?? "일정 이동 실패"); info.revert(); }
    finally { setLoading(false); }
  };
  const handleEventResize = async (info: EventResizeDoneArg) => {
    if ((info.event.extendedProps as any)?.isBusyOnly) { info.revert(); return; }
    try {
      setLoading(true); setError(null);
      const ev = info.event;
      await updateEvent(ev.id!, {
        title: ev.title,
        startAt: dayjs(ev.start!).format("YYYY-MM-DD HH:mm:ss"),
        endAt: ev.end ? dayjs(ev.end).format("YYYY-MM-DD HH:mm:ss") : dayjs(ev.start!).format("YYYY-MM-DD HH:mm:ss"),
        allDayYn: ev.allDay ? "Y" : "N",
      });
    } catch (e: any) { setError(e?.message ?? "일정 기간 변경 실패"); info.revert(); }
    finally { setLoading(false); }
  };

  // BUSY_ONLY 클릭 차단
  const handleEventClick = (arg: EventClickArg) => {
  const idStr = String(arg.event.id ?? "");
  // BUSY_ONLY 가짜 ID면 차단
  if (idStr.startsWith("busy:")) {
    arg.jsEvent?.preventDefault();
    return;
  }
  const id = Number(idStr);
  if (!Number.isFinite(id)) return;
  setSelectedEventId(id);
  setDetailOpen(true);
};

  // 캘린더 체크/기간 변경 시 재조회
  useEffect(() => { handleViewDidMount(); }, [visibleCals.map((c) => `${c.calId}:${c.checked}`).join("|"), busyOnlyMap]);

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
        ".cf-calstripe": { position: "relative" },
        ".cf-calstripe::before": {
          content: '""',
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: "7px",
          background: "var(--cf-cal)",
        }
      }} />

      <div className="cf-escape">
        <div className="cf-container">
          <div className="cf-card">
            <div className="cf-calpage">
              {/* 왼쪽 패널 */}
              <div className="cf-cal-left">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <button style={styles.button} onClick={() => setMiniDate(prev => prev.subtract(1, "year"))}>◀</button>
                  <strong>{miniDate.format("YYYY년")}</strong>
                  <button style={styles.button} onClick={() => setMiniDate(prev => prev.add(1, "year"))}>▶</button>
                </div>
                <MonthCalendar value={miniDate} onChange={handleMiniChange} />

                <div style={{ marginTop: 12 }}>
                  <div className="cf-section-head">
                    <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>캘린더</h4>
                    <span className="cf-badge">{visibleCals.length}</span>
                  </div>

                  {/* 🔎 검색 */}
                  <div className="cf-search">
                    <input
                      className="cf-input"
                      type="text"
                      placeholder="캘린더 검색"
                      value={calQuery}
                      onChange={(e) => setCalQuery(e.target.value)}
                    />
                  </div>

                  {filteredCals.length === 0 && <div>결과가 없습니다.</div>}
                  {filteredCals.map((c) => (
                    <label
                      key={`${c.calId}-${c.name}`}
                      style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}
                    >
                      <input
                        type="checkbox"
                        checked={!!c.checked}
                        onChange={(e) =>
                          setVisibleCals((prev) =>
                            prev.map((x) =>
                              x.calId === c.calId ? { ...x, checked: e.target.checked } : x
                            )
                          )
                        }
                        style={{ accentColor: c.color || undefined }}
                      />
                      <span style={styles.colorDot(c.color)} />
                      <button
                        style={{
                          ...styles.nameBtn,
                          opacity: busyOnlyMap.get(c.calId) ? 0.5 : 1,
                          cursor: busyOnlyMap.get(c.calId) ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (busyOnlyMap.get(c.calId)) return; // BUSY_ONLY는 편집 안 열음(500 회피)
                          openEditCalendar(c.calId);
                        }}
                        title={busyOnlyMap.get(c.calId) ? "권한상 편집할 수 없습니다." : "클릭하면 수정/삭제"}
                      >
                        {c.name}
                      </button>
                    </label>
                  ))}
                </div>

                {loading && <div style={{ marginTop: 12 }}>불러오는 중…</div>}
                {error && <div style={{ marginTop: 12, color: "tomato" }}>{error}</div>}

                {/* 오늘 일정 */}
                <div className="cf-today">
                  <h4 className="cf-today-title">
                    <span>오늘 일정</span>
                    <span className="cf-badge">{todayEvents.length}</span>
                  </h4>

                  {loadingToday && <div className="cf-today-empty">불러오는 중…</div>}

                  {!loadingToday && todayEvents.length === 0 && (
                    <div className="cf-today-empty">오늘 일정이 없습니다.</div>
                  )}

                  {!loadingToday && todayEvents.length > 0 && (
                    <ul className="cf-today-list">
                      {todayEvents.map(ev => {
                        const timeText = ev.allDay ? "종일" : dayjs(ev.start as string).format("HH:mm");
                        const color = (ev as any).backgroundColor || findCalColor(ev.calId) || "#64748b";
                        const busy = (ev as any)?.extendedProps?.isBusyOnly === true;
                        return (
                          <li key={ev.eventId} className="cf-today-item">
                            <button
                              type="button"
                              className="cf-today-link"
                              onClick={() => {
                                if (busy) return; // BUSY_ONLY 상세 금지
                                setSelectedEventId(Number(ev.eventId));
                                setDetailOpen(true);
                              }}
                              title={busy ? "바쁨" : ev.title}
                            >
                              <span className="cf-dot" style={{ background: color }} />
                              <span className="cf-time">{timeText}</span>
                              <span className="cf-title">{busy ? "바쁨" : ev.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* 오른쪽 메인 캘린더 */}
              <div className="cf-cal-main">
                <div className="cf-actions">
                  <button className="cf-btn" onClick={handleClickCreateCalendar}>+ 새 캘린더</button>
                  <button className="cf-btn cf-btn-primary" onClick={handleCreateEvent}>+ 새 일정</button>
                </div>

                <FullCalendar
                  ref={calendarRef as any}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  locale="ko"
                  timeZone="local"
                  initialView="dayGridMonth"
                  customButtons={{
                    monthCount: { text: ``, click: () => {} },
                  }}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  height={"calc(100vh - 180px)"}
                  expandRows
                  stickyHeaderDates
                  views={{
                    dayGridMonth: { dayMaxEventRows: 3 },
                    timeGridWeek: {
                      slotMinTime: "08:00:00",
                      slotMaxTime: "20:00:00",
                      slotDuration: "00:30:00",
                      expandRows: true,
                    },
                    timeGridDay: {
                      slotMinTime: "08:00:00",
                      slotMaxTime: "20:00:00",
                      slotDuration: "00:30:00",
                      expandRows: true,
                    },
                  }}
                  selectable
                  editable
                  weekends
                  selectMirror
                  dayMaxEvents
                  moreLinkClick="popover"
                  moreLinkText={(n: number) => `+${n}개`}
                  navLinks
                  nowIndicator
                  eventDisplay="block"
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                  dayHeaderFormat={{ weekday: "short" }}
                  events={events}
                  select={handleSelect}
                  dateClick={handleDateClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  eventClick={handleEventClick}
                  datesSet={handleViewDidMount}
                  eventClassNames={() => ["cf-calstripe"]}
                  eventDidMount={(info) => {
                    const calId = info.event.extendedProps?.calId as number;
                    const calHex = findCalColor(calId) || "#64748b";
                    (info.el as HTMLElement).style.setProperty("--cf-cal", calHex);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 새 캘린더 모달 */}
      <CalendarCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(form) => handleCreateCalendarSave(form)}
        init={createForm}
      />

      {/* 캘린더 편집/삭제 모달 */}
      <CalendarCreateDialog
        open={editOpen}
        mode="edit"
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        onDelete={handleEditDelete}
        init={editInit}
        sharesInit={editSharesInit}
      />

      {/* 새 일정 모달 */}
      {eventOpen && (
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
            typeId: eventForm.typeId,
            locationText: eventForm.locationText,
            note: eventForm.note,
          }}
          onChange={(patch) => {
            if ("allDay" in patch) {
              const toAllDay = !!patch.allDay;
              setEventForm(f => {
                const durMs = Math.max(f.end.diff(f.start, "millisecond"), 0);
                if (toAllDay) {
                  const s = f.start.startOf("day");
                  const safeDur = Math.max(durMs, 24 * 60 * 60 * 1000);
                  const e = s.add(safeDur, "millisecond");
                  return { ...f, allDay: true, start: s, end: e };
                } else {
                  const s = f.start;
                  const safeDur = Math.max(durMs, 60 * 60 * 1000);
                  const e = s.add(safeDur, "millisecond");
                  return { ...f, allDay: false, start: s, end: e };
                }
              });
              return;
            }
            if (patch.start) {
              const newStart = patch.start;
              setEventForm(f => {
                const durMs = Math.max(f.end.diff(f.start, "millisecond"), 0);
                const minDur = f.allDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
                const safeDur = Math.max(durMs, minDur);
                const newEnd = newStart.add(safeDur, "millisecond");
                return { ...f, start: newStart, end: newEnd };
              });
              return;
            }
            if ("label" in patch) {
              const lab = patch.label ?? null;
              setSelectedLabel(lab);
              setEventForm(f => ({ ...f, labelId: lab?.labelId }));
              return;
            }
            setEventForm(f => ({ ...f, ...(patch as Partial<EventFormState>) }));
          }}
          onBeforeSave={(info) => {
            pendingRoomRef.current = { needsRoom: info.needsRoom, selectedRoom: info.selectedRoom };
          }}
          onSave={handleEventSave}
          attendees={selectedAttendees}
          sharers={selectedSharers}
          onQuickAdd={async (mode, q) => {
            const query = q.trim();
            if (!query) return;

            const found = await searchMembers(query, 5);

            if (found.length === 1) {
              const m = found[0];
              if (mode === "ATTENDEE") {
                const blocked = new Set(selectedSharers.map(s => s.userNo));
                if (!blocked.has(m.userNo) && !selectedAttendees.some(a => a.userNo === m.userNo)) {
                  setSelectedAttendees(prev => [...prev, m]);
                }
              } else {
                const blocked = new Set(selectedAttendees.map(a => a.userNo));
                if (!blocked.has(m.userNo) && !selectedSharers.some(s => s.userNo === m.userNo)) {
                  setSelectedSharers(prev => [...prev, m]);
                }
              }
            } else {
              setPickMode(mode);
              setPickSelectedMembers(mode === "ATTENDEE" ? selectedAttendees : selectedSharers);
              setPickDeptId(null);
              setPickQuery(query);
              setPickMembers([]);
              setPickOpen(true);
            }
          }}
          onOpenPeoplePicker={(m) => {
            setPickMode(m);
            setPickSelectedMembers(m === "ATTENDEE" ? selectedAttendees : selectedSharers);
            setPickDeptId(null);
            setPickQuery("");
            setPickMembers([]);
            setPickOpen(true);
          }}
          error={eventErr}
          recurrence={recurrence}
          onOpenRecurrence={() => setRecurrenceOpen(true)}
        />
      )}

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
            ? selectedSharers.map(s => s.userNo)
            : selectedAttendees.map(a => a.userNo)
        }
        loadingDepts={loadingDepts}
        loadingMembers={loadingMembers}
        onClose={() => {
          setPickOpen(false);
          setPickQuery("");
          setPickDeptId(null);
          setPickMembers([]);
        }}
        onConfirm={() => {
          const dedup = (arr: Member[]) => { const map = new Map<number, Member>(); arr.forEach(m => map.set(m.userNo, m)); return Array.from(map.values()); };
          if (pickMode === "ATTENDEE") {
            const blocked = new Set(selectedSharers.map(m => m.userNo));
            const filtered = pickSelectedMembers.filter(m => !blocked.has(m.userNo));
            setSelectedAttendees(dedup(filtered));
          } else {
            const blocked = new Set(selectedAttendees.map(m => m.userNo));
            const filtered = pickSelectedMembers.filter(m => !blocked.has(m.userNo));
            setSelectedSharers(dedup(filtered));
          }
          setPickOpen(false);
        }}
        onToggle={(m: any) =>
          setPickSelectedMembers(prev => (prev.some(x => x.userNo === m.userNo) ? prev.filter(x => x.userNo !== m.userNo) : [...prev, m]))
        }
        onQueryChange={(q) => setPickQuery(q)}
        onDeptChange={(id) => setPickDeptId(id)}
      />

      <EventDetailDialog
        open={detailOpen}
        eventId={selectedEventId}
        onClose={() => setDetailOpen(false)}
        onUpdated={(patch) => {
          if (!selectedEventId) return;
          setEvents(prev => prev.map(ev =>
            Number(ev.eventId) === Number(selectedEventId)
              ? {
                ...ev,
                title: (ev as any)?.extendedProps?.isBusyOnly ? "" : (patch.title ?? ev.title),
                start: patch.startAt ?? (ev.start as string),
                end: patch.endAt ?? (ev.end as string),
                allDay: patch.allDayYn ? patch.allDayYn === "Y" : ev.allDay,
              }
              : ev
          ));
        }}
        onDeleted={() => {
          if (!selectedEventId) return;
          setEvents(prev => prev.filter(ev => Number(ev.eventId) !== Number(selectedEventId)));
        }}
      />
    </LocalizationProvider>
  );
}
