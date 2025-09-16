// src/api/calendarApi.ts
import { api } from "./coreflowApi";
import dayjs, { Dayjs } from "dayjs";

// 서버 표준 형식: YYYY-MM-DDTHH:mm:ss (로컬 KST)
export const fmt = (d: Date | string) =>
  dayjs(d).format("YYYY-MM-DD HH:mm:ss");

export type CalendarSummary = {
  calId: number;
  name: string;
  color? : string;
}

// CalendarPage가 import해서 쓰는 타입
export type EventDto = {
  eventId: number;
  calId: number;
  title: string;
  startAt: string;   // "YYYY-MM-DDTHH:mm:ss"
  endAt: string;     // "
  allDayYn: "Y" | "N";
  locationText?: string;
  note?: string;
  roomId?: number;
  status?: string;
  labelId?: number;
  typeId?: number;
  typeName?: string;
  typeCode?: string;
  rrule?: string;
  exdates?: string;
};
// 캘린더 기본 권한 역할
export type CalendarDefaultRole =
  | "NONE"
  | "BUSY_ONLY"
  | "READER"
  | "CONTRIBUTOR"
  | "EDITOR";

export type Member = {
  userNo : number;
  userName : string;
  email? : string;
  depId? : number;
  posId? : number;
}

export type Department = {
  depId: number; depName: string; parentId?: number | null;
};

export type Label = {
  labelId : number;
  labelName : string;
  labelColor : string;
}

export type EventTypeOption = {
  typeId: number;
  typeCode: string;
  typeName: string;
};

// 상세 타입
export type EventDetail = {
  eventId: number;
  calId: number;
  title: string;
  startAt: string;
  endAt: string;
  allDayYn: "Y" | "N";
  locationText?: string;
  note?: string;
  roomId?: number;
  status?: string;
  labelId?: number;
  typeId?: string;
  createByUserNo?: number;
  room?: {
    roomId: number;
    roomName: string;
    buildingName?: string;
    floor?: string;
    roomNo?: string;
    capacity?: number;
    detailLocation?: string; // SVG URL
  };
  canEdit: boolean;
  canDelete: boolean;
};

function unwrap<T = any>(res: any): T {
  // 백엔드가 { data: {...} } 또는 {...} 형태 모두 지원
  if (res?.data?.data !== undefined) return res.data.data as T;
  if (res?.data !== undefined) return res.data as T;
  return res as T;
}

function num(n: any, d = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}


// ── 내가 조회 가능한 캘린더 목록
export async function fetchVisibleCalendars(userNo: number): Promise<CalendarSummary[]> {
  const r = await api.get("/calendar/visible", {
    headers: { "X-User-No": String(userNo) }, 
    params:  { userNo },                      
  });
  const raw = unwrap<any[]>(r) ?? [];
  return raw.map((c) => ({
    calId: num(c.calId ?? c.CAL_ID),
    name: String(c.name ?? c.calName ?? ""),
    color: c.color ?? c.COLOR,
  }));
}

// ── 캘린더 생성 → { calId, name?, color? } 반환
export async function createCalendar(body: {
  name: string;
  color?: string;
  defaultRole?: CalendarDefaultRole;
}): Promise<{ calId: number; name?: string; color?: string }> {
  const r = await api.post("/calendar", body);
  const data = unwrap<any>(r);

  // 백엔드가 number만 리턴하거나 {calId,...}를 리턴하는 두 케이스 모두 처리
  if (typeof data === "number") {
    return { calId: data, name: body.name, color: body.color };
  }
  return {
    calId: num(data.calId ?? data.CAL_ID ?? 0),
    name: data.name ?? data.calName,
    color: data.color,
  };
}

// ── 캘린더 수정
export async function updateCalendar(
  calId: number,
  body: { name?: string; color?: string; defaultRole?: CalendarDefaultRole }
): Promise<void> {
  await api.put(`/calendar/${calId}`, body);
}

// ── 캘린더 삭제
export async function deleteCalendar(calId: number): Promise<void> {
  await api.delete(`/calendar/${calId}`);
}

// 기간 내 이벤트 조회 (두 키 모두 전송: calendarId, calId)
export async function fetchEvents(params: {
  calendarId: number;
  from: string; // "YYYY-MM-DDTHH:mm:ss"
  to: string;   // "YYYY-MM-DDTHH:mm:ss"
}): Promise<EventDto[]> {
  const cid = num(params.calendarId);
  const r = await api.get("/events", {
    params: {
      calendarId: cid,   // 컨트롤러가 기대하는 이름
      calId: cid,        // 혹시 다른 로직에서 calId로 읽는 경우 대비
      from: params.from,
      to: params.to,
    },
  });
  const raw = unwrap<any[]>(r) ?? [];
  return raw.map((e) => ({
    eventId: num(e.eventId ?? e.EVENT_ID),
    calId: num(e.calId ?? e.CAL_ID ?? cid),
    title: String(e.title ?? e.TITLE ?? ""),
    startAt: String(e.startAt ?? e.START_AT ?? ""),
    endAt: String(e.endAt ?? e.END_AT ?? ""),
    allDayYn: (e.allDayYn ?? e.ALL_DAY_YN ?? "N") as "Y" | "N",
    locationText: e.locationText ?? e.LOCATION_TEXT,
    note: e.note ?? e.NOTE,
    roomId: e.roomId ?? e.ROOM_ID,
    status: e.status ?? e.STATUS,
    labelId: e.labelId ?? e.LABEL_ID,
    typeId: e.typeId ?? e.TYPE_ID,
    typeName: e.typeName ?? e.TYPE_NAME ?? undefined,  
    typeCode: e.typeCode ?? e.TYPE_CODE ?? undefined,  
    rrule: e.rrule ?? e.RRULE,
    exdates: e.exdates ?? e.EXDATES,
  }));
}

// ── 일정 생성 → { eventId }
export async function createEvent(req: {
  calId: number;
  title: string;
  startAt: string;               // "YYYY-MM-DDTHH:mm:ss"
  endAt: string;                 // "YYYY-MM-DDTHH:mm:ss"
  allDayYn?: "Y" | "N";
  locationText?: string;
  note?: string;
  roomId?: number;
  status?: string;
  labelId?: number;
  typeId?: number;
  rrule?: string;
  exdates?: string;
  attendeeUserNos?: number[];    // 참석자
  shareUserNos?: number[];       // 공유자
}): Promise<{ eventId: number }> {
  const r = await api.post("/events", req);
  const data = unwrap<any>(r);
  if (typeof data === "number") return { eventId: data };
  return { eventId: num(data.eventId ?? data.EVENT_ID) };
}

export type RoomReservationCreateReq = {
  eventId?: number | null;
  roomId: number;
  startAt: string | Dayjs | Date; // ← 문자열/Dayjs/Date 모두 허용
  endAt: string | Dayjs | Date;
  title?: string;
};

function toIsoSecs(v: string | Dayjs | Date): string {
  if (dayjs.isDayjs(v)) return (v as Dayjs).format("YYYY-MM-DD[T]HH:mm:ss");
  if (v instanceof Date) return dayjs(v).format("YYYY-MM-DD[T]HH:mm:ss");
  let s = String(v).trim();
  // "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(" ", "T");
  // 이미 ISO면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  // 그 외도 마지막으로 dayjs 파싱 시도
  return dayjs(s).format("YYYY-MM-DD[T]HH:mm:ss");
}

export async function createRoomReservation(
  input: RoomReservationCreateReq
): Promise<{ reservationId: number }> {
  const body = {
    roomId: input.roomId,
    startAt: toIsoSecs(input.startAt),
    endAt: toIsoSecs(input.endAt),
    title: input.title,
    eventId: input.eventId ?? null,
  };

  const r = await api.post("/rooms/reservations", body);
  const data = (r?.data ?? r) as any;
  const id =
    typeof data === "number"
      ? data
      : Number(data.id ?? data.reservationId ?? data.RESV_ID ?? 0);
  return { reservationId: id };
}

// ── 일정 수정
export async function updateEvent(
  eventId: string | number,
  body: Partial<Pick<
    EventDto,
    "title" | "startAt" | "endAt" | "allDayYn" | "locationText" | "note" | "labelId" | "typeId" | "rrule" | "exdates" | "status"
  >>
): Promise<void> {
  await api.put(`/events/${eventId}`, body);
}

export async function fetchDepartments(): Promise<Department[]> {
  const r = await api.get("/CalendarDepartments");      // 백엔드: GET /api/departments (depId, depName, parentId)
  const raw = unwrap<any[]>(r) ?? [];
  return raw.map((d) => ({
    depId: num(d.depId ?? d.DEP_ID),
    depName: String(d.depName ?? d.DEP_NAME ?? ""),
    parentId: d.parentId ?? d.PARENT_ID ?? null,
  }));
}

export async function getEventDetail(eventId: number): Promise<EventDetail> {
  const res = await api.get(`/events/${eventId}/detail`);
  return res.data as EventDetail;
}

// ── 일정 삭제
export async function deleteEvent(eventId: number | string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}
// 일정 유형
export async function fetchEventTypes() {
  const r = await api.get("/events/event-types");
  const raw = r.data ?? [];
  return raw.map((m:any)=>({
    typeId: Number(m.typeId ?? m.TYPE_ID),
    typeCode: String(m.typeCode ?? m.TYPE_CODE ?? ""),
    typeName: String(m.typeName ?? m.TYPE_NAME ?? ""),
  }));
}
export async function createEventType(typeName: string): Promise<EventTypeOption> {
  const r = await api.post("/events/event-types", { typeName });
  const m = r.data;
  return { typeId: Number(m.typeId), typeCode: String(m.typeCode ?? ""), typeName: String(m.typeName) };
}
export async function updateEventType(typeId: number, typeName: string): Promise<void> {
  await api.put(`/events/event-types/${typeId}`, { typeName });
}
export async function deleteEventType(typeId: number): Promise<void> {
  await api.delete(`/events/event-types/${typeId}`);
}

/** 멤버 검색 (이름/이메일 부분검색) */
export async function searchMembers(query = "", limit = 30, depId?: number): Promise<Member[]> {
  const r = await api.get("/CalendarMembers", { params: { query, limit, depId } });
  const raw = unwrap<any[]>(r) ?? [];
  return raw.map((m) => ({
    userNo: num(m.userNo ?? m.USER_NO),
    userName: String(m.userName ?? m.USER_NAME ?? ""),
    email: m.email ?? m.EMAIL,
    depId: num(m.depId ?? m.DEP_ID ?? 0) || undefined,
    posId: num(m.posId ?? m.POS_ID ?? 0) || undefined,
  }));
}


// 라벨목록
export async function fetchLabels(): Promise<Label[]> {
  const r = await api.get("/labels");
  return (r.data ?? []) as Label[];
}

// 라벨생성
export async function createLabel(req: { labelName: string; labelColor: string }): Promise<Label> {
  const r = await api.post("/labels", req);
  return r.data as Label;
}

// 라벨수정
export async function updateLabel(labelId: number, req: { labelName: string; labelColor: string }): Promise<Label> {
  const r = await api.put(`/labels/${labelId}`, req);
  return r.data as Label;
}

// 라벨삭제
export async function deleteLabel(labelId: number): Promise<void> {
  await api.delete(`/labels/${labelId}`);
}

