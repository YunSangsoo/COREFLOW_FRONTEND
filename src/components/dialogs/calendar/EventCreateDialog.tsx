// src/components/dialogs/calendar/EventCreateDialog.tsx
import React from "react";
import { useEffect, useState } from "react";
import { createEventType, fetchEventTypes } from "../../../api/calendarApi"; // ← API 경로 주의(components→api까지 ../../../)
import type { EventTypeOption } from "../../../api/calendarApi"; // 
import {
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  TextField, Box, Select, MenuItem, InputLabel, FormControl,
  FormControlLabel, Switch, Button, Divider, Stack, Typography, IconButton
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import SearchIcon from "@mui/icons-material/ManageSearch";
import { useSelector } from "react-redux";
import type { Dayjs } from "dayjs";
import LabelSelectWithManager from "../../inputs/calendar/LabelSelectWithManager";
import TypeManagerDialog from "./TypeManagerDialog";

import type {
  Label,
  CalendarVisibilityItem,
  RecurrenceRule,
} from "../../../types/calendar/calendar";

type Member = { userNo: number; userName: string; email?: string; depId?: number };

function recurrenceBadge(rule?: RecurrenceRule | null) {
  if (!rule || !rule.enabled) return null;
  const unit =
    rule.freq === "DAILY" ? "일" :
      rule.freq === "WEEKLY" ? "주" :
        rule.freq === "MONTHLY" ? "개월" : "년";
  const sub = rule.freq === "WEEKLY" && rule.byWeekdays && rule.byWeekdays.length > 0
    ? `(${rule.byWeekdays.map(d => ["일", "월", "화", "수", "목", "금", "토"][d]).join(",")})`
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
    label: Label | null;
    typeId?: number;
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
  // ===== 권한/유형 관리 훅들 (컴포넌트 시작 직후) =====
  const authUser = useSelector((state: any) => state.auth?.user);
  const roles: string[] = authUser?.roles ?? [];
  const canManageType = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_HR");

  // 유형 옵션: DB에서 로드(값=ID, 표시는 name)
  const [typeOptions, setTypeOptions] = useState<EventTypeOption[]>([]);
  // 목록 로드 + 기본값 세팅
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchEventTypes(); // [{typeId,typeCode,typeName}]
        if (!alive) return;
        setTypeOptions(list);
        // 부모 폼에 기본 typeId 없으면 첫 항목으로 세팅
        if (!value?.typeId && (value as any)?.typeId == null) {
          const first = list[0]?.typeId;
          if (first != null) onChange({ ...(value as any), typeId: first });
        }
      } catch {
        // 최소 폴백(유형이 1개도 없을 때)
        if (!alive) return;
        setTypeOptions([{ typeId: -1, typeCode: "OTHER", typeName: "기타" }]);
        if (!value?.typeId && (value as any)?.typeId == null) {
          onChange({ ...(value as any), typeId: -1 });
        }
      }
    })();
    return () => { alive = false; };
  }, []); // 최초 1회

  // 유형관리 모달 on/off
  const [typeManagerOpen, setTypeManagerOpen] = React.useState(false);

  return (
    <>
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

            <TextField
              select
              fullWidth
              label="유형"
              value={value.typeId ?? ""}
              onChange={(e) => onChange({ typeId: Number(e.target.value) })}
              slotProps={{
                input: {
                  startAdornment: canManageType ? (
                    <InputAdornment position="start" sx={{ ml: 0.5 }}>
                      <IconButton
                        size="small"
                        edge="start"
                        disableRipple
                        title="유형 관리"
                        onClick={() => setTypeManagerOpen(true)}
                        sx={{ p: 0.5, color: "action.active" }}
                      >
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}

              // 라벨과 동일한 좌측 여백 보정
              sx={{
                "& .MuiSelect-select": {
                  pl: canManageType ? 0 : 1.5,
                },
              }}
            >
              <MenuItem value="" disabled>유형 선택</MenuItem>
              {typeOptions.map((t) => (
                <MenuItem key={t.typeId} value={t.typeId}>
                  {t.typeName}
                </MenuItem>
              ))}
            </TextField>
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
                  if (e.key === "Enter") onQuickAdd("SHARER", (e.target as HTMLInputElement).value);
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

      {/* HR/ADMIN만 유형관리 모달 랜더 */}
      {canManageType && (
        <TypeManagerDialog
          open={typeManagerOpen}
          onClose={() => setTypeManagerOpen(false)}
          value={typeOptions.map(t => t.typeName)} // 다이얼로그가 이름 배열을 받는다면
          onChange={async (nextNames: string[]) => {
            // 1) 새로 추가된 이름만 추출
            const currentNames = new Set(typeOptions.map(t => t.typeName));
            const added = nextNames.filter(n => !currentNames.has(n));
            // 2) DB에 생성
            const created: EventTypeOption[] = [];
            for (const name of added) {
              const row = await createEventType(name);   // POST /api/events/event-types
              created.push(row);
            }
            // 3) 로컬 옵션 갱신 (기존 + 새로 만든 것)
            setTypeOptions(prev => [...prev, ...created]);

            // (선택) 이름 변경/삭제까지 지원하려면 diff를 더 계산해 update/delete 호출 추가
          }}
        />
      )}
    </>
  );
}
