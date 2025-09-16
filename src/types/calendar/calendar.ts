// src/types/calendar/calendar.ts
export type CalendarDefaultRole = "NONE" | "BUSY_ONLY" | "READER" | "CONTRIBUTOR" | "EDITOR";

export type CalendarVisibilityItem = {
  calId: number;
  name: string;
  color?: string;
  checked: boolean;
};

export type Label = {
  labelId: number;
  labelName: string;
  labelColor: string;
};

export type CalendarEvent = {
  id: string;
  eventId: number;
  calId: number;
  labelId?: number | null;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

// ──────────────────────────────────────────────────────────────
// 반복등록 타입
// ──────────────────────────────────────────────────────────────
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurrenceEnd =
  | { mode: "NEVER" }
  | { mode: "UNTIL_DATE"; untilDate: string } // YYYY-MM-DD
  | { mode: "COUNT"; count: number };

export type RecurrenceRule = {
  enabled: boolean;
  freq: RecurrenceFrequency;         // 일/주/월/년
  interval: number;                  // 매 N 주기 (>=1)
  byWeekdays?: number[];             // WEEKLY일 때 사용, 0=일요일 ... 6=토요일 (dayjs 기준)
  end: RecurrenceEnd;                // 종료 조건
  maxInstances?: number;             // 안전 상한(기본 200)
};
