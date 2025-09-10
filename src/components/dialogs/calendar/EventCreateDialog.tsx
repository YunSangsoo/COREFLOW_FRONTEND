// src/components/dialogs/calendar/EventCreateDialog.tsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Select, MenuItem, InputLabel, FormControl,
  FormControlLabel, Switch, Button, Divider, Stack, Typography
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { Dayjs } from "dayjs";
import LabelSelectWithManager from "../../inputs/calendar/LabelSelectWithManager";
import type {
  Label,
  CalendarVisibilityItem,
  RecurrenceRule,
} from "../../../types/calendar/calendar";

// 큰 카테고리(유형) 옵션
const EVENT_TYPE_OPTIONS = ["MEETING", "LEAVE", "TASK", "DEADLINE", "OTHER"] as const;

type Member = { userNo: number; userName: string; email?: string; depId?: number };

function recurrenceBadge(rule?: RecurrenceRule | null) {
  if (!rule || !rule.enabled) return null;
  const unit =
    rule.freq === "DAILY" ? "일" :
    rule.freq === "WEEKLY" ? "주" :
    rule.freq === "MONTHLY" ? "개월" : "년";
  const sub = rule.freq === "WEEKLY" && rule.byWeekdays && rule.byWeekdays.length > 0
    ? `(${rule.byWeekdays.map(d => ["일","월","화","수","목","금","토"][d]).join(",")})`
    : "";
  const end =
    rule.end.mode === "NEVER" ? "" :
    rule.end.mode === "COUNT" ? ` · ${rule.end.count}회` :
    ` · ${rule.end.untilDate}까지`;
  return `반복: 매 ${rule.interval}${unit}${sub}${end}`;
}

export default function EventCreateDialog({
  open, onClose, visibleCals, value, onChange, onSave,
  attendees, sharers, onQuickAdd, onOpenPeoplePicker,
  error,
  recurrence, onOpenRecurrence,
}: {
  open: boolean;
  onClose: () => void;
  visibleCals: CalendarVisibilityItem[];
  value: {
    calId: number | null;
    title: string;
    allDay: boolean;
    start: Dayjs;
    end: Dayjs;
    label: Label | null;          // 세부 카테고리
    eventType?: string;           // 큰 카테고리 (EVENT_TYPE)
    locationText?: string;
    note?: string;
  };
  onChange: (patch: Partial<typeof value>) => void;
  onSave: () => void;

  attendees: Member[];
  sharers: Member[];
  onQuickAdd: (mode: "ATTENDEE" | "SHARER", query: string) => void;
  onOpenPeoplePicker: (mode: "ATTENDEE" | "SHARER") => void;

  error?: { calId?: string; title?: string; time?: string };

  recurrence?: RecurrenceRule | null;
  onOpenRecurrence: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>새 일정</DialogTitle>

      <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
        {/* 캘린더 선택 */}
        <FormControl fullWidth error={!!error?.calId}>
          <InputLabel id="cal-sel-label">캘린더</InputLabel>
          <Select
            labelId="cal-sel-label"
            label="캘린더"
            value={value.calId ?? ""}
            onChange={(e) => onChange({ calId: Number(e.target.value) })}
          >
            {visibleCals.map((c) => (
              <MenuItem key={c.calId} value={c.calId}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: 6,
                    background: c.color || "#999",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)",
                    marginRight: 8,
                  }}
                />
                {c.name}
              </MenuItem>
            ))}
          </Select>
          {error?.calId && (
            <Box sx={{ color: "tomato", fontSize: 12, mt: 0.5 }}>
              {error.calId}
            </Box>
          )}
        </FormControl>

        {/* 제목 */}
        <TextField
          label="제목"
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          error={!!error?.title}
          helperText={error?.title}
          autoFocus
          fullWidth
        />

        {/* 라벨(세부) + 유형(큰) */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <LabelSelectWithManager
            value={value.label}
            onChange={(l) => onChange({ label: l })}
          />
          <FormControl fullWidth>
            <InputLabel id="etype-sel-label">유형</InputLabel>
            <Select
              labelId="etype-sel-label"
              label="유형"
              value={value.eventType ?? "MEETING"}
              onChange={(e) => onChange({ eventType: String(e.target.value) })}
            >
              {EVENT_TYPE_OPTIONS.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 시간/종일 + 반복등록 버튼 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={value.allDay}
                onChange={(e) => onChange({ allDay: e.target.checked })}
              />
            }
            label="종일"
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {recurrence && recurrence.enabled && (
              <Chip size="small" label={recurrenceBadge(recurrence) ?? ""} />
            )}
            <Button variant="outlined" onClick={onOpenRecurrence}>
              반복등록
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <DateTimePicker
            label="시작"
            ampm={false}
            value={value.start}
            onChange={(v) => v && onChange({ start: v })}
            format="YYYY-MM-DD HH:mm:ss"
          />
          <DateTimePicker
            label="종료"
            ampm={false}
            disabled={value.allDay}
            value={value.end}
            onChange={(v) => v && onChange({ end: v })}
            format="YYYY-MM-DD HH:mm:ss"
          />
        </Box>
        {error?.time && (
          <Box sx={{ color: "tomato", fontSize: 12 }}>{error.time}</Box>
        )}

        {/* 위치/메모 */}
        <TextField
          label="위치"
          value={value.locationText ?? ""}
          onChange={(e) => onChange({ locationText: e.target.value })}
          fullWidth
        />
        <TextField
          label="메모"
          value={value.note ?? ""}
          onChange={(e) => onChange({ note: e.target.value })}
          fullWidth
          multiline
          minRows={2}
        />

        {/* 참석자 */}
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="subtitle2">참석자</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {attendees.map((m) => (
              <Chip
                key={m.userNo}
                label={`${m.userName}${m.email ? ` (${m.email})` : ""}`}
              />
            ))}
            {attendees.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                선택된 참석자가 없습니다.
              </Typography>
            )}
          </Stack>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder="이름 입력 후 Enter 또는 추가"
              onKeyDown={(e) => {
                if (e.key === "Enter") onQuickAdd("ATTENDEE", (e.target as HTMLInputElement).value);
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={() => onOpenPeoplePicker("ATTENDEE")}
            >
              참석자 선택(부서별)
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* 공유자 */}
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="subtitle2">공유자</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {sharers.map((m) => (
              <Chip
                key={m.userNo}
                label={`${m.userName}${m.email ? ` (${m.email})` : ""}`}
              />
            ))}
            {sharers.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                선택된 공유자가 없습니다.
              </Typography>
            )}
          </Stack>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder="이름 입력 후 Enter 또는 추가"
              onKeyDown={(e) => {
                if (e.key === "Enter") onQuickAdd("ATTENDEE", (e.target as HTMLInputElement).value);
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={() => onOpenPeoplePicker("SHARER")}
            >
              공유자 선택(부서별)
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={onSave}>
          만들기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
