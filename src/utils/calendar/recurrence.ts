// src/utils/calendar/recurrence.ts
import dayjs, { Dayjs } from "dayjs";
import type { RecurrenceRule } from "../../types/calendar/calendar";

const FMT = "YYYY-MM-DDTHH:mm:ss";

export type Occurrence = { start: string; end: string };

function clampMax(rule?: RecurrenceRule) {
  return Math.max(1, rule?.maxInstances ?? 200);
}

function durationMs(start: Dayjs, end: Dayjs) {
  return Math.max(0, end.valueOf() - start.valueOf());
}

export function summarizeRecurrence(rule: RecurrenceRule): string {
  if (!rule.enabled) return "반복 없음";
  const unitLabel =
    rule.freq === "DAILY" ? "일" :
    rule.freq === "WEEKLY" ? "주" :
    rule.freq === "MONTHLY" ? "개월" : "년";
  const base = `매 ${rule.interval}${unitLabel}`;
  const weekly =
    rule.freq === "WEEKLY" && rule.byWeekdays && rule.byWeekdays.length > 0
      ? ` (${rule.byWeekdays.map(weekdayKo).join(", ")})`
      : "";
  const end =
    rule.end.mode === "NEVER" ? " / 종료: 없음" :
    rule.end.mode === "COUNT" ? ` / ${rule.end.count}회` :
    ` / ${rule.end.untilDate}까지`;
  return base + weekly + end;
}

function weekdayKo(d: number) {
  // 0=일,1=월,...6=토
  return ["일","월","화","수","목","금","토"][d] ?? "";
}

/**
 * rule에 따라 start~end(한 인스턴스의 시간 범위)를 기준으로 반복 인스턴스들을 계산
 * 반환값은 ISO(초 단위) 문자열
 */
export function generateOccurrences(
  rule: RecurrenceRule,
  start: Dayjs,
  end: Dayjs
): Occurrence[] {
  if (!rule.enabled) return [];
  const max = clampMax(rule);
  const dur = durationMs(start, end);

  // 종료 조건 해석
  const endMode = rule.end.mode;
  const until =
    endMode === "UNTIL_DATE" ? dayjs(rule.end.untilDate).endOf("day") : null;
  const targetCount = endMode === "COUNT" ? Math.max(1, rule.end.count) : Infinity;

  const out: Occurrence[] = [];

  const pushOcc = (s: Dayjs) => {
    const e = dayjs(s.valueOf() + dur);
    out.push({ start: s.format(FMT), end: e.format(FMT) });
  };

  const pushIfInRange = (s: Dayjs) => {
    if (out.length >= max) return false;
    if (endMode === "UNTIL_DATE" && s.isAfter(until!)) return false;
    pushOcc(s);
    return out.length < Math.min(max, targetCount);
  };

  // 포함 규칙: 최초 시작일의 인스턴스도 "1회"로 포함
  if (!pushIfInRange(start)) return out;

  // DAILY
  if (rule.freq === "DAILY") {
    let s = start;
    while (out.length < targetCount && out.length < max) {
      s = s.add(rule.interval, "day");
      if (!pushIfInRange(s)) break;
    }
    return out;
  }

  // WEEKLY
  if (rule.freq === "WEEKLY") {
    // 선택 요일 없으면 시작일 요일로
    const selected = new Set(
      (rule.byWeekdays && rule.byWeekdays.length > 0)
        ? rule.byWeekdays
        : [start.day()] // 0=Sun
    );

    // day-by-day 스캔 (간단하고 안전)
    let cursor = start.startOf("day");
    let guard = 0;
    while (out.length < targetCount && out.length < max && guard < 3650) {
      cursor = cursor.add(1, "day");
      const daysDiff = cursor.startOf("day").diff(start.startOf("day"), "day");
      const weekIndex = Math.floor(daysDiff / 7); // 시작일로부터 몇 번째 주인지
      const onInterval = weekIndex % rule.interval === 0;
      if (onInterval && selected.has(cursor.day())) {
        const s = cursor.hour(start.hour()).minute(start.minute()).second(start.second());
        if (!pushIfInRange(s)) break;
      }
      guard++;
    }
    return out;
  }

  // MONTHLY
  if (rule.freq === "MONTHLY") {
    let base = start;
    while (out.length < targetCount && out.length < max) {
      base = base.add(rule.interval, "month");
      // dayjs는 자동으로 말일 보정(= 31일 → 2월 말일) 처리
      if (!pushIfInRange(base)) break;
    }
    return out;
  }

  // YEARLY
  if (rule.freq === "YEARLY") {
    let base = start;
    while (out.length < targetCount && out.length < max) {
      base = base.add(rule.interval, "year");
      if (!pushIfInRange(base)) break;
    }
    return out;
  }

  return out;
}
