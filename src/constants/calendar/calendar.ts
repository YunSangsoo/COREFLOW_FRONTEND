// src/constants/calendar/calendar.ts
import type { CalendarDefaultRole } from "../../types/calendar/calendar";

export const DEFAULT_ROLE_OPTIONS: CalendarDefaultRole[] = [
  "NONE", "BUSY_ONLY", "READER", "CONTRIBUTOR", "EDITOR",
];

export const DEFAULT_ROLE_LABELS: Record<CalendarDefaultRole, string> = {
  NONE: "권한 없음",
  BUSY_ONLY: "바쁨만 표시",
  READER: "조회 전용",
  CONTRIBUTOR: "본인것만 편집",
  EDITOR: "전체 편집",
};

export const COLOR_PALETTE = [
  "#4096ff", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#a855f7",
  "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#64748b", "#ea580c",
] as const;

export const isValidHexColor = (val: string) =>
  /^#([0-9A-Fa-f]{6})$/.test(val?.trim?.() ?? "");
