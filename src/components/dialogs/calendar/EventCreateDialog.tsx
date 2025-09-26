// src/components/dialogs/calendar/EventCreateDialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createEventType, fetchEventTypes } from "../../../api/calendarApi";
import type { EventTypeOption } from "../../../api/calendarApi";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  TextField, Box, Select, MenuItem, InputLabel, FormControl,
  FormControlLabel, Switch, Button, Divider, Stack, Typography,
  IconButton, List, ListItemButton, ListItemText
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import LabelOutlined from "@mui/icons-material/LabelOutlined";
import EventRepeatRounded from "@mui/icons-material/RepeatRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import MeetingRoomRounded from "@mui/icons-material/MeetingRoomRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import { useSelector } from "react-redux";
import type { Dayjs } from "dayjs";
import LabelSelectWithManager from "../../inputs/calendar/LabelSelectWithManager";
import TypeManagerDialog from "./TypeManagerDialog";
import { api } from "../../../api/coreflowApi";

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
  onBeforeSave,
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

  onBeforeSave?: (info: {
    needsRoom: boolean;
    selectedRoom: { roomId: number; roomName: string } | null;
  }) => void;
}) {
  const authUser = useSelector((state: any) => state.auth?.user);
  const roles: string[] = authUser?.roles ?? [];
  const canManageType = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_HR");

  // ===== 색상(액센트) : 라벨 > 캘린더 > 기본 =====
  const accentColor = useMemo(() => {
    const labelHex = value.label?.labelColor;
    if (labelHex) return labelHex;
    const calHex = visibleCals.find(c => Number(c.calId) === Number(value.calId))?.color;
    return calHex || "#4096ff";
  }, [value.label, value.calId, visibleCals]);

  // ===== 유형 옵션 로딩 =====
  const [typeOptions, setTypeOptions] = useState<EventTypeOption[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchEventTypes();
        if (!alive) return;
        setTypeOptions(list);
        if (!value?.typeId && (value as any)?.typeId == null) {
          const first = list[0]?.typeId;
          if (first != null) onChange({ ...(value as any), typeId: first });
        }
      } catch {
        if (!alive) return;
        setTypeOptions([{ typeId: -1, typeCode: "OTHER", typeName: "기타" }]);
        if (!value?.typeId && (value as any)?.typeId == null) {
          onChange({ ...(value as any), typeId: -1 });
        }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [typeManagerOpen, setTypeManagerOpen] = useState(false);

  // ===== 회의실 =====
  const [needsRoom, setNeedsRoom] = useState(false);
  const [roomFinderOpen, setRoomFinderOpen] = useState(false);
  const [isFindingRooms, setIsFindingRooms] = useState(false);
  const [roomOptions, setRoomOptions] = useState<
    { roomId:number; roomName:string; capacity?:number; buildingName?:string; floor?:string; available:boolean }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<{ roomId:number; roomName: string } | null>(null);
  const [roomErr, setRoomErr] = useState<string | null>(null);
  const findRoomBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { if (value.allDay) setNeedsRoom(false); }, [value.allDay]);

  const focusOutsideModals = () => {
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    const el = document.createElement("button");
    el.tabIndex = -1;
    el.style.position = "fixed"; el.style.opacity = "0"; el.style.pointerEvents = "none";
    document.body.appendChild(el); el.focus({ preventScroll: true }); setTimeout(() => el.remove(), 0);
  };

  async function fetchRoomAvailability() {
    try {
      setRoomErr(null); setIsFindingRooms(true);
      const r = await api.get("/rooms/availability", {
        params: {
          startAt: value.start.format("YYYY-MM-DD HH:mm:ss"),
          endAt:   value.end.format("YYYY-MM-DD HH:mm:ss"),
        }
      });
      setRoomOptions(r.data || []);
    } catch (e: any) {
      setRoomErr(e?.response?.data?.message || "회의실 가용성 조회 실패");
      setRoomOptions([]);
    } finally { setIsFindingRooms(false); }
  }
  function selectRoom(roomId: number) {
    const picked = roomOptions.find(o => o.roomId === roomId);
    setSelectedRoom({ roomId, roomName: picked?.roomName || "" });
    focusOutsideModals(); setRoomFinderOpen(false);
    setTimeout(() => findRoomBtnRef.current?.focus(), 0);
  }

  // ===== 저장 가능 =====
  const timeInvalid = !value.start || !value.end || value.start.isAfter(value.end);
  const canSubmit = !!value.calId && !!value.title?.trim() && !timeInvalid;

  const handleSave = () => {
    onBeforeSave?.({ needsRoom, selectedRoom });
    onSave();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {/* 헤더: 색 점 + 타이틀 */}
        <DialogTitle sx={{ py: 2.25, pr: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{
              width: 12, height: 12, borderRadius: "50%",
              background: accentColor,
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)"
            }} />
            <Box sx={{ fontWeight: 800 }}>새 일정</Box>
          </Box>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2.5, pb: 1.5, display: "grid", gap: 2.25 }}>
          {/* 제목 + 미리보기 */}
          <Box>
            <TextField
              label="제목"
              placeholder="예: 주간 스탠드업"
              value={value.title}
              onChange={(e) => onChange({ title: e.target.value })}
              error={!!error?.title}
              helperText={error?.title}
              fullWidth
              variant="outlined"
              slotProps={{
                input: { notched: true },
                inputLabel: { shrink: true, sx: { overflow: "visible" } },
              }}
            />
            {/* <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: "50%",
                background: accentColor,
                boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.1)"
              }} />
              <Typography variant="body2" color="text.secondary">
                {(value.title?.trim() || "새 일정")}
              </Typography>
            </Box> */}
          </Box>

       {/* ✅ 캘린더 (한 줄 전체) */}
<Box>
  {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
    <LabelOutlined fontSize="small" /> 캘린더
  </Box> */}
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
              width: 10, height: 10, borderRadius: 6,
              background: c.color || "#999",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)",
              marginRight: 8,
            }}
          />
          {c.name}
        </MenuItem>
      ))}
    </Select>
    {error?.calId && <Box sx={{ color: "tomato", fontSize: 12, mt: 0.5 }}>{error.calId}</Box>}
  </FormControl>
</Box>

{/* ✅ 라벨 · 유형 (한 줄 나란히) */}
<Box>
  {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
    <LabelOutlined fontSize="small" /> 라벨 · 유형
  </Box> */}

  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
    {/* ⬇️ 첫 칸: 유형 */}
    <TextField
      select
      fullWidth
      label="유형"
      value={value.typeId ?? ""}
      onChange={(e) => onChange({ typeId: Number(e.target.value) })}
      slotProps={{
        input: canManageType ? {
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 0.5 }}>
              <IconButton
                size="small"
                edge="start"
                disableRipple
                title="유형 관리"
                onClick={() => setTypeManagerOpen(true)}
                sx={{ p: 0.5, color: "action.active" }}
              >
                <ManageSearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        } : undefined,
      }}
      sx={{ "& .MuiSelect-select": { pl: canManageType ? 0 : 1.5 } }}
    >
      <MenuItem value="" disabled>유형 선택</MenuItem>
      {typeOptions.map((t) => (
        <MenuItem key={t.typeId} value={t.typeId}>{t.typeName}</MenuItem>
      ))}
    </TextField>

    {/* ⬇️ 두 번째 칸: 라벨 */}
    <LabelSelectWithManager
      value={value.label}
      onChange={(l) => onChange({ label: l })}
    />
  </Box>
</Box>
          {/* 시간/반복 */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
              <AccessTimeRounded fontSize="small" /> 시간 · 반복
              <Box sx={{ flex: 1 }} />
              {recurrence?.enabled && <Chip size="small" icon={<EventRepeatRounded />} label={recurrenceBadge(recurrence) ?? ""} />}
              <Button variant="outlined" size="small" onClick={onOpenRecurrence}>반복등록</Button>
            </Box>

            <Stack direction="row" spacing={2}>
              <DateTimePicker
                label="시작" ampm={false}
                value={value.start}
                onChange={(v) => v && onChange({ start: v })}
                format="YYYY-MM-DD HH:mm:ss"
              />
              <DateTimePicker
                label="종료" ampm={false} disabled={value.allDay}
                value={value.end}
                onChange={(v) => v && onChange({ end: v })}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
              <FormControlLabel
                control={<Switch checked={value.allDay} onChange={(e) => onChange({ allDay: e.target.checked })} />}
                label="종일"
              />
              {error?.time && <Typography variant="caption" color="error">{error.time}</Typography>}
            </Stack>
          </Box>

          {/* 회의실 */}
          <Divider sx={{ my: 1 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
              <MeetingRoomRounded fontSize="small" /> 회의실
            </Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <FormControlLabel
                control={<Switch checked={needsRoom} onChange={(e) => setNeedsRoom(e.target.checked)} />}
                label="회의실 예약"
              />
              {selectedRoom
                ? <Typography variant="body2">선택됨: {selectedRoom.roomName}</Typography>
                : <Typography variant="body2" color="text.secondary">회의실 미선택</Typography>}
              <Box sx={{ flex: 1 }} />
              <Button
                ref={findRoomBtnRef}
                variant="outlined" size="small"
                disabled={!needsRoom || value.allDay || timeInvalid}
                onClick={() => { setRoomFinderOpen(true); void fetchRoomAvailability(); }}
              >
                가용 회의실 찾기
              </Button>
            </Stack>
            {roomErr && <Typography variant="caption" color="error">{roomErr}</Typography>}
          </Box>

          {/* 위치/메모 (2열) */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="위치" value={value.locationText ?? ""}
              onChange={(e) => onChange({ locationText: e.target.value })} fullWidth
              variant="outlined"
              slotProps={{ input: { notched: true }, inputLabel: { shrink: true, sx: { overflow: "visible" } } }}
            />
            <TextField
              label="메모" value={value.note ?? ""}
              onChange={(e) => onChange({ note: e.target.value })} fullWidth
              variant="outlined"
              slotProps={{ input: { notched: true }, inputLabel: { shrink: true, sx: { overflow: "visible" } } }}
            />
          </Box>

          {/* 참석자 */}
          <Divider sx={{ my: 1 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
              <GroupsRounded fontSize="small" /> 참석자
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {attendees.map((m) => (
                <Chip key={m.userNo} size="small" label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
              ))}
              {attendees.length === 0 && <Typography variant="body2" color="text.secondary">선택된 참석자가 없습니다.</Typography>}
            </Stack>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small" placeholder="이름 입력 후 Enter 또는 추가"
                onKeyDown={(e) => {
                  const q = (e.target as HTMLInputElement).value;
                  if (e.key === "Enter" && q.trim()) onQuickAdd("ATTENDEE", q);
                }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={() => onOpenPeoplePicker("ATTENDEE")}>
                참석자 선택(부서별)
              </Button>
            </Box>
          </Box>

          {/* 공유자 */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
              <GroupsRounded fontSize="small" /> 공유자
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {sharers.map((m) => (
                <Chip key={m.userNo} size="small" label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
              ))}
              {sharers.length === 0 && <Typography variant="body2" color="text.secondary">선택된 공유자가 없습니다.</Typography>}
            </Stack>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small" placeholder="이름 입력 후 Enter 또는 추가"
                onKeyDown={(e) => {
                  const q = (e.target as HTMLInputElement).value;
                  if (e.key === "Enter" && q.trim()) onQuickAdd("SHARER", q);
                }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={() => onOpenPeoplePicker("SHARER")}>
                공유자 선택(부서별)
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>취소</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSubmit}>
            만들기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 회의실 찾기 모달 */}
      <Dialog
        open={roomFinderOpen}
        onClose={() => { focusOutsideModals(); setRoomFinderOpen(false); setTimeout(() => findRoomBtnRef.current?.focus(), 0); }}
        fullWidth maxWidth="sm" keepMounted disableRestoreFocus transitionDuration={{ exit: 0 }}
      >
        <DialogTitle>가용 회의실</DialogTitle>
        <DialogContent dividers>
          {isFindingRooms && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>조회 중…</Typography>}
          <List dense>
            {roomOptions.map((o, idx) => (
              <ListItemButton key={o.roomId} onClick={() => selectRoom(o.roomId)} disabled={!o.available} autoFocus={idx === 0}>
                <ListItemText
                  primary={`${o.roomName}${o.capacity ? ` · ${o.capacity}명` : ""}`}
                  secondary={`${o.buildingName ?? ""} ${o.floor ?? ""} ${o.available ? "(예약 가능)" : "(불가)"}`}
                />
              </ListItemButton>
            ))}
            {roomOptions.length === 0 && !isFindingRooms && (
              <Typography variant="body2" color="text.secondary">해당 시간에 가용한 회의실이 없습니다.</Typography>
            )}
          </List>
          {roomErr && <Typography variant="caption" color="error">{roomErr}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { focusOutsideModals(); setRoomFinderOpen(false); setTimeout(() => findRoomBtnRef.current?.focus(), 0); }}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 유형 관리 (권한자) */}
      {canManageType && (
        <TypeManagerDialog
          open={typeManagerOpen}
          onClose={() => setTypeManagerOpen(false)}
          value={typeOptions.map(t => t.typeName)}
          onChange={async (nextNames: string[]) => {
            const currentNames = new Set(typeOptions.map(t => t.typeName));
            const added = nextNames.filter(n => !currentNames.has(n));
            const created: EventTypeOption[] = [];
            for (const name of added) {
              const row = await createEventType(name);
              created.push(row);
            }
            setTypeOptions(prev => [...prev, ...created]);
          }}
        />
      )}
    </>
  );
}
