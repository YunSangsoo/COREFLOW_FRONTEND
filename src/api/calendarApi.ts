// src/api/calendarApi.ts
import type { ShareListRes, ShareUpsertReq } from "../types/calendar/calendar";
import { api } from "./coreflowApi";
import dayjs, { Dayjs } from "dayjs";

const __calRoleCache = new Map<number, CalendarDefaultRole>(); // calId -> myRole
const __shareReqCache = new Map<number, Promise<CalendarShares>>(); // 중복 호출 방지

function pickMyRole(shares?: CalendarShares, userNo?: number): CalendarDefaultRole | undefined {
  if (!shares) return undefined;
  const direct = shares.users?.find(u => Number(u.userNo) === Number(userNo))?.role;
  return direct || shares.defaultRole; // 디폴트 권한으로 폴백
}

async function ensureCalRoleCached(calId: number, userNo?: number): Promise<CalendarDefaultRole | undefined> {
  if (__calRoleCache.has(calId)) return __calRoleCache.get(calId);
  try {
    let p = __shareReqCache.get(calId);
    if (!p) {
      p = getCalendarShares(calId);
      __shareReqCache.set(calId, p);
    }
    const shares = await p;
    const role = pickMyRole(shares, userNo);
    if (role) __calRoleCache.set(calId, role);
    return role;
  } catch { /* 무시 */ }
  return undefined;
}

// 서버 표준 형식: YYYY-MM-DDTHH:mm:ss (로컬 KST)
export const fmt = (d: Date | string) =>
  dayjs(d).format("YYYY-MM-DD HH:mm:ss");

export type CalendarSummary = {
  calId: number;
  name: string;
  color? : string;
    myRole?: CalendarDefaultRole;

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

export type ShareUser = { userNo: number; role: CalendarDefaultRole; userName?: string };
export type ShareDept = { depId: number; role: CalendarDefaultRole; depName?: string }; // depId 규칙
export type SharePos  = { posId: number; role: CalendarDefaultRole; posName?: string };

export type CalendarShares = {
  users?: ShareUser[];
  departments?: ShareDept[];
  positions?: SharePos[];
  defaultRole?: CalendarDefaultRole; // 응답에 있을 수 있으나 저장 시엔 항상 NONE 정책
};

export type CalendarDetail = {
  calId: number;
  calName: string;
  color: string;
  ownerUserNo: number;
  // ... 필요시 확장
};

// ── 상세/공유 조회
export async function getCalendar(calId: number): Promise<CalendarDetail> {
  const r = await api.get(`/calendar/${calId}`);
  return r.data;
}

export async function getCalendarShares(calId: number): Promise<CalendarShares> {
  const r = await api.get(`/calendar/${calId}/shares`);
  return r.data ?? {};
}
  
export async function getMyRole(calId: number): Promise<CalendarDefaultRole> {
  const r = await api.get(`/calendar/${calId}/my-role`);
  return (r?.data?.role ?? "NONE") as CalendarDefaultRole;
}

export type Member = {
  userNo : number;
  userName : string;
  email? : string;
  depId? : number;
  posId? : number;
}

export type MemberLite = {
  userNo: number;
  name: string;         
  depId?: number;
  posId?: number;
  depName?: string;
  posName?: string;
};

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

export type MemberItem = { userNo: number; name: string; depName?: string; posName?: string };
export type DeptNode   = { depId: number; name: string;};
export type PositionRow= { posId: number; posName: string };

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
  attendees?: Member[];
  sharers?: Member[];
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


export async function fetchVisibleCalendars(userNo?: number): Promise<CalendarSummary[]> {
  const url = typeof userNo === "number" ? `/calendar/visible?userNo=${userNo}` : `/calendar/visible`;
  const r = await api.get(url);
  const raw = unwrap<any[]>(r) ?? [];

  const list = raw.map((c) => ({
    calId: num(c.calId ?? c.CAL_ID),
    name: String(c.name ?? c.calName ?? c.CAL_NAME ?? ""),
    color: String(c.color ?? c.COLOR ?? "#4096ff"),
    // myRole?: 나중에 채움
  })) as CalendarSummary[];

  // 권한 정보 필요할 때만 병렬 조회
  if (typeof userNo === "number") {
    await Promise.all(
      list.map(async (c) => {
        try {
          c.myRole = await getMyRole(c.calId);
        } catch {
          c.myRole = "NONE"; // 방어
        }
      })
    );
  }
  return list;
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

export type AudienceDefaultRole = CalendarDefaultRole;


const pickArray = (r: any): any[] => {
  const dig = (v: any, depth = 0): any[] => {
    if (Array.isArray(v)) return v;
    if (!v || typeof v !== "object" || depth > 3) return [];

    // 1차: 흔한 키들에서 바로 배열 찾기
    const keys = [
      "data", "items", "list", "rows", "records",
      "content", "result", "nodes", "children",
      "departments", "positions"
    ];
    for (const k of keys) {
      const a = (v as any)[k];
      if (Array.isArray(a)) return a;
    }

    // 2차: 값들 중 배열이 있으면 그걸 사용
    for (const val of Object.values(v)) {
      if (Array.isArray(val)) return val as any[];
    }

    // 3차: 객체 값들을 한 단계 더 파고듦
    for (const val of Object.values(v)) {
      if (val && typeof val === "object") {
        const inner = dig(val, depth + 1);
        if (inner.length) return inner;
      }
    }
    return [];
  };

  return dig(r?.data ?? r);
};
const toNum = (...vals: any[]): number | null => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};
const toStr = (...vals: any[]): string => {
  for (const v of vals) {
    if (v !== undefined && v !== null) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return "";
};

export async function searchMembersForSharePicker(
  query = "", limit = 30, depId?: number
): Promise<MemberLite[]> {
  const r = await api.get("/calendar/members", { params: { query, limit, depId } });
  const raw = (unwrap<any[]>(r) ?? []) as any[];

  return raw
    .map((m) => {
      const userNo = num(m.userNo ?? m.USER_NO ?? m.id ?? m.USER_ID);
      if (!Number.isFinite(userNo)) return null;

      const userName = String(
        m.userName ?? m.USER_NAME ?? m.name ?? m.NAME ?? ""
      );

      return {
        userNo,
        // ★ PeoplePicker가 userName을 보더라도 보이고,
        //   다른 곳에서 name만 보더라도 보이도록 둘 다 채움
        userName,
        name: userName,
        email: m.email ?? m.EMAIL ?? undefined,
        depId: num(m.depId ?? m.DEP_ID) ?? undefined,
        posId: num(m.posId ?? m.POS_ID) ?? undefined,
        depName: m.depName ?? m.DEP_NAME ?? undefined,
        posName: m.posName ?? m.POS_NAME ?? undefined,
      } as MemberLite & { userName: string };
    })
    .filter((x): x is MemberLite & { userName: string } => !!x && x.userName.length > 0);
}

// ✅ 부서 트리
export async function fetchDeptChildren(parentId?: number | null): Promise<DeptNode[]> {
  // 루트면 params 자체를 생략(= 쿼리 문자열에 parentId가 붙지 않도록)
  const params = parentId == null ? undefined : { parentId };

  // 1순위: 실제 운영에서 가장 일반적인 엔드포인트
  try {
    const r = await api.get("/calendar/org/departments", { params });
    const raw = pickArray(r);
    if (raw.length) {
      return raw
        .map((d: any) => ({
          // 다양한 키 수용(deptId/depId/DEPT_ID/DEP_ID/id)
          depId: toNum(d.deptId ?? d.depId ?? d.DEPT_ID ?? d.DEP_ID ?? d.id),
          // 이름 키 수용(name/depName/DEPT_NAME)
          name:  toStr(d.name ?? d.depName ?? d.DEP_NAME),
        }))
        .filter((x: any) => x.depId !== null) as DeptNode[];
    }
  } catch {
    // 무시하고 폴백 진행
  }

  // 2순위 폴백: 트리형 엔드포인트 - 서버별 구현에 따라 children이 통째로 오기도 함
  try {
    // 보통 루트 호출은 인자/쿼리 없이도 응답이 오기 때문에 우선 그대로 호출
    const r = await api.get("/calendar/org/departments/tree", { params });
    const raw = pickArray(r);
    if (raw.length) {
      return raw
        .map((d: any) => ({
          depId: toNum(d.deptId ?? d.depId ?? d.DEPT_ID ?? d.DEP_ID ?? d.id),
          name:  toStr(d.name ?? d.depName ?? d.DEP_NAME),
        }))
        .filter((x: any) => x.depId !== null) as DeptNode[];
    }
  } catch {
    /* 최종 빈 배열 반환 */
  }

  return [];
}

// ✅ 직급 목록
export async function fetchPositions(): Promise<{ posId: number; posName: string }[]> {
  try {
    // console.log("[api] GET /calendar/org/positions (call)");
    const r = await api.get("/calendar/org/positions");
    // console.log("[api] /org/positions status:", r.status, "raw:", r.data);

    const raw: any =
      Array.isArray(r?.data)       ? r.data :
      Array.isArray(r?.data?.data) ? r.data.data :
      Array.isArray(r?.data?.list) ? r.data.list :
      Array.isArray(r?.data?.rows) ? r.data.rows :
      Array.isArray(r?.data?.items)? r.data.items :
      [];

    const out = raw
      .map((p: any) => ({
        // ❗️백엔드가 POSID(언더스코어 없음)로 보내는 케이스 보완
        posId: Number(p.posId ?? p.POS_ID ?? p.POSID ?? p.id),
        posName: String(
          p.posName ?? p.POS_NAME ?? p.POSNAME ??  // ← 여기에 POSNAME 추가
          p.name ?? p.positionName ?? p.POSITION_NAME ?? ""
        ),
      }))
      .filter((x: any) => Number.isFinite(x.posId) && !!x.posName);

    // console.log("[api] /org/positions normalized:", out);
    return out;
  } catch (err: any) {
    // console.log("[api] /org/positions ERROR:", err?.response?.status, err?.response?.data ?? String(err));
    throw err;
  }
}
// ── 캘린더 수정
export async function updateCalendar(
  calId: number,
  req: { name: string; color: string }
): Promise<void> {
  await api.put(`/calendar/${calId}`, {
    name: req.name,
    color: req.color,
    defaultRole: "NONE" as CalendarDefaultRole,
  });
}

// ── 캘린더 삭제
export async function deleteCalendar(calId: number): Promise<void> {
  await api.delete(`/calendar/${calId}`);
}

// 캘린더 공유 조회
export async function fetchCalendarShares(calId: number) {
  const { data } = await api.get<ShareListRes>(`/calendar/${calId}/shares`);
  return data;
}

// 캘린더 공유 저장 (merge | replace)
export async function saveCalendarShares(args: {
  calId: number;
  payload: ShareUpsertReq;                   // users 기반
  mode?: "merge" | "replace";
  userNo?: number;                           // X-User-No 폴백용
}) {
  const { calId, payload, mode = "merge", userNo } = args;

  // 🤝 서버가 members를 받도록 변환(서버가 users를 받아도 문제 없음)
  const body: any = {
    members: payload.users ?? [],            // ← 핵심 변환
    departments: payload.departments ?? [],
    positions: payload.positions ?? [],
  };

  return api.put(`/calendar/${calId}/shares`, body, {
    params: { mode },
    headers: userNo ? { "X-User-No": String(userNo) } : undefined,
  });
}

// 기간 내 이벤트 조회 (BUSY_ONLY 마스킹 + 클릭 차단용 id 부여)
export async function fetchEvents(params: {
  calendarId: number;
  from: string; // "YYYY-MM-DDTHH:mm:ss"
  to: string;   // "YYYY-MM-DDTHH:mm:ss"
}): Promise<EventDto[]> {
  const cid = num(params.calendarId);

  // 내 권한 캐싱(없으면 최소한 defaultRole만이라도 채움)
  await ensureCalRoleCached(cid);

  // 원본 이벤트 조회
  const r = await api.get("/events", {
    params: {
      calendarId: cid,   // 컨트롤러가 기대하는 이름
      calId: cid,        // 혹시 다른 로직에서 calId로 읽는 경우 대비
      from: params.from,
      to: params.to,
    },
  });
  const raw = unwrap<any[]>(r) ?? [];

  // 이 캘린더에서의 나의 권한
  const myRole = __calRoleCache.get(cid); // "BUSY_ONLY" | "READER" | ...

  // 표준 DTO로 변환하면서 BUSY_ONLY는 마스킹
  const out = raw.map((e) => {
    const ev: EventDto = {
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
    };

    // 👉 BUSY_ONLY면 제목/세부를 숨기고, UI가 클릭을 막을 수 있도록 플래그를 붙임
    if (myRole === "BUSY_ONLY") {
      ev.title = "";                 // 제목 숨김 (UI에서 '바쁨' 같은 고정 문구로 대체)
      ev.locationText = undefined;   // 위치/메모 등 디테일 제거
      ev.note = undefined;
      ev.labelId = undefined;
      ev.typeId = undefined as any;

      // 타입에는 없지만 UI에서 사용할 수 있도록 소프트 플래그 부여
      (ev as any).__busyMasked = true;                    // 제목 숨김 여부
      (ev as any).__clickBlockId = `busy:${ev.eventId}`;  // 클릭 차단용 가짜 id
    }

    return ev;
  });

  return out;
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
export async function searchMembers(
  query = "", limit = 30, depId?: number
): Promise<Member[]> {
  const r = await api.get("/calendar/members", { params: { query, limit, depId } }); // ← 경로 통일
  const raw = unwrap<any[]>(r) ?? [];
  return raw.map((m) => ({
    userNo: num(m.userNo ?? m.USER_NO ?? m.id ?? m.USER_ID),
    userName: String(m.userName ?? m.name ?? m.USER_NAME ?? m.NAME ?? ""), // ← name fallback
    email: m.email ?? m.EMAIL ?? undefined,
    depId: num(m.depId ?? m.DEP_ID) ?? undefined,
    posId: num(m.posId ?? m.POS_ID) ?? undefined,
  })).filter(x => Number.isFinite(x.userNo) && x.userName.length > 0);
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

