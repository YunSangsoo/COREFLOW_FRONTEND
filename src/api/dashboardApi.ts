// src/api/dashboardApi.ts
import dayjs from "dayjs";
import { api } from "./coreflowApi";
import {
  fetchVisibleCalendars,
  fetchEvents,
  fmt,
  type CalendarSummary,
  type EventDto,
} from "./calendarApi";
import { notiList } from "./noticeApi";
import type { NoticeResponse, SearchParams } from "../types/notice";

export type NoticeItem = {
  essential:string;
  noticeId: number;
  title: string;
  writerName?: string;
  createdAt: string;
  views?: number;
  hasAttachment?: boolean;
};
export type ApprovalItem = {
  approvalId: number;
  title: string;
  status: string;
  writerName?: string;
  createdAt: string;
};
export type ChatRoomItem = {
  roomId: number;
  roomName: string;
  lastMessage?: string;
  unreadCount?: number;
  updatedAt?: string;
};
export type MiniEvent = {
  date: string; // YYYY-MM-DD
  label: string;
  color?: "red" | "orange" | "blue";
};

const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const safeGet = async <T>(getter: () => Promise<T>, d: T): Promise<T> => {
  try { return await getter(); } catch { return d; }
};

// ── ✅ “실데이터” 달력 미니 이벤트
export async function fetchMiniEvents(monthYYYYMM: string): Promise<MiniEvent[]> {
  const month = dayjs(monthYYYYMM + "-01");
  const from = fmt(month.startOf("month").toDate());
  const to = fmt(month.endOf("month").toDate());

  const cals = await safeGet(fetchVisibleCalendars, [] as CalendarSummary[]);
  if (!cals.length) return [];

  const eventsLists = await Promise.all(
    cals.map((c) => safeGet(() => fetchEvents({ calendarId: c.calId, from, to }), [] as EventDto[]))
  );
  const events = eventsLists.flat();

  const byDay = new Map<string, MiniEvent[]>();
  for (const e of events) {
    const start = dayjs(e.startAt);
    const end = dayjs(e.endAt ?? e.startAt);
    const label = e.title || "일정";
    let color: "red" | "orange" | "blue" = /회의|미팅|meeting/i.test(label) ? "red"
      : /연차|휴가|leave/i.test(label) ? "orange" : "blue";

    for (let cur = start.startOf("day"), last = end.startOf("day");
         cur.isBefore(last) || cur.isSame(last);
         cur = cur.add(1, "day")) {
      const key = cur.format("YYYY-MM-DD");
      const arr = byDay.get(key) ?? [];
      if (arr.length < 3) arr.push({ date: key, label, color });
      byDay.set(key, arr);
    }
  }
  return Array.from(byDay.values()).flat();
}

// ── 전자결재(있으면 연동, 없으면 빈배열)
export async function fetchApprovals(limit = 8, opts?: { keyword?: string }): Promise<ApprovalItem[]> {
  const keyword = opts?.keyword?.trim() || undefined;

  // 1) 실제 쓰는 엔드포인트로 호출
  const { data } = await api.get("/approvals/my-documents", {
    params: { keyword }, // 서버가 지원하면 사용, 아니면 무시됨
  });

  // 2) 응답 표준화
  const list: any[] = Array.isArray(data) ? data : (data?.list ?? data?.items ?? []);
  const mapped = list.map((item) => {
    const statusNum = Number(item.approvalStatus ?? item.STATUS ?? 0);
    const status =
      statusNum === 2 ? "승인" :
      statusNum === 3 ? "반려" :
      "진행중"; // 1 또는 그 외 → 진행중

    return {
      approvalId: Number(item.approvalId ?? item.id ?? item.APPROVAL_ID ?? item.ID),
      title: String(item.approvalTitle ?? item.title ?? item.TITLE ?? ""),
      status,
      writerName:
        item.drafterName ??
        item.approvalDrafterName ??
        item.writerName ??
        item.WRITER_NAME ??
        undefined,
      createdAt: (() => {
        const raw = item.startDate ?? item.createdAt ?? item.CREATE_DATE ?? item.created_at;
        return raw ? dayjs(raw).format("YYYY-MM-DD HH:mm:ss") : "";
      })(),
    } as ApprovalItem;
  });

  // 3) 최신순 정렬 후 limit
  mapped.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  return mapped.slice(0, limit);
}

// ── 공지(있으면 연동)
export async function fetchNotices(limit = 8, params?: SearchParams): Promise<NoticeItem[]> {
  // 서버에는 SearchParams만 전달 (limit 전달 X)
  const list = (await notiList(params ?? {})) as NoticeResponse[];

  const mapped: NoticeItem[] = list.map((n) => ({
    essential:String(n.essential),
    noticeId: Number(n.notiId),
    title: String(n.title ?? ""),
    writerName: n.userName ?? undefined,
    createdAt: n.enrollDate
      ? dayjs(n.enrollDate).format("YYYY-MM-DD HH:mm:ss")
      : "",
    views: undefined,
    hasAttachment: undefined,
  }));

  // 최신순 정렬 후 limit 적용
  mapped.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  return mapped.slice(0, limit);
}

// ── 채팅방(있으면 연동)
export async function fetchChatRooms(limit = 8) {
  return safeGet(async () => {
    const r = await api.get("/chat/rooms", { params: { limit } });
    const data: any[] = Array.isArray(r.data) ? r.data : r.data?.list ?? [];
    return data.map((c) => ({
      roomId: num(c.roomId ?? c.id ?? c.ROOM_ID ?? c.ID),
      roomName: String(c.roomName ?? c.name ?? c.ROOM_NAME ?? c.NAME ?? ""),
      lastMessage: c.lastMessage ?? c.LAST_MESSAGE,
      unreadCount: num(c.unreadCount ?? c.UNREAD_COUNT),
      updatedAt: String(c.updatedAt ?? c.updated_at ?? c.UPDATE_DATE ?? ""),
    }));
  }, []);
}
