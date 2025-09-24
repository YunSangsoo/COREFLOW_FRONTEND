import { useEffect, useRef, useState } from "react";
import { createEventType, fetchEventTypes } from "../../../api/calendarApi";
import type { EventTypeOption } from "../../../api/calendarApi";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  TextField, Box, Select, MenuItem, InputLabel, FormControl,
  FormControlLabel, Switch, Button, Divider, Stack, Typography, IconButton,
  List, ListItemButton, ListItemText
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import SearchIcon from "@mui/icons-material/ManageSearch";
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
  // ===== 권한/유형 관리 =====
  const authUser = useSelector((state: any) => state.auth?.user);
  const roles: string[] = authUser?.roles ?? [];
  const canManageType = roles.includes("ROLE_ADMIN") || roles.includes("ROLE_HR");

  // 유형 옵션
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
  }, []); // 1회

  const [typeManagerOpen, setTypeManagerOpen] = useState(false);

  // ======================================================
  // ✅ 회의실 예약(옵션)
  // ======================================================
  const [needsRoom, setNeedsRoom] = useState(false);
  const [roomFinderOpen, setRoomFinderOpen] = useState(false);
  const [isFindingRooms, setIsFindingRooms] = useState(false);
  const [roomOptions, setRoomOptions] = useState<
    { roomId:number; roomName:string; capacity?:number; buildingName?:string; floor?:string; available:boolean }[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<{ roomId:number; roomName: string } | null>(null);
  const [roomErr, setRoomErr] = useState<string | null>(null);
  const findRoomBtnRef = useRef<HTMLButtonElement | null>(null);

  // 종일이면 회의실 사용 X (자동 OFF)
  useEffect(() => {
    if (value.allDay) setNeedsRoom(false);
  }, [value.allDay]);

  // ── 닫기/선택 전, 포커스를 모달 “바깥”으로 잠깐 이동 (경고 방지)
  const focusOutsideModals = () => {
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    const sentinel = document.createElement("button");
    sentinel.type = "button";
    sentinel.tabIndex = -1;
    sentinel.style.position = "fixed";
    sentinel.style.opacity = "0";
    sentinel.style.pointerEvents = "none";
    sentinel.setAttribute("data-focus-sentinel", "true");
    document.body.appendChild(sentinel);
    sentinel.focus({ preventScroll: true });
    // 다음 틱에 정리
    setTimeout(() => sentinel.remove(), 0);
  };

  // 가용성 조회 (조회만; 선점 없음) — 모달은 먼저 열고, 데이터는 뒤이어 로딩
  async function fetchRoomAvailability() {
    try {
      setRoomErr(null);
      setIsFindingRooms(true);
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
    } finally {
      setIsFindingRooms(false);
    }
  }

  // 목록에서 회의실 클릭 → 상태만 세팅 (서버 호출 없음)
  function selectRoom(roomId: number) {
    const picked = roomOptions.find(o => o.roomId === roomId);
    setSelectedRoom({ roomId, roomName: picked?.roomName || "" });

    // ⬇️ 먼저 포커스를 바깥으로 옮긴 뒤 닫기
    focusOutsideModals();
    setRoomFinderOpen(false);

    // 닫힌 뒤 이전 버튼으로 포커스 복원
    setTimeout(() => findRoomBtnRef.current?.focus(), 0);
  }

  // 저장: 부모에게 선택 정보 전달
  const handleSave = () => {
    onBeforeSave?.({ needsRoom, selectedRoom });
    onSave();
  };

  const timeInvalid = !value.start || !value.end || value.start.isAfter(value.end);

  return (
    <>
      {/* 부모 다이얼로그: 자식 모달이 열려있을 때 포커스 트랩/오토포커스/복원 비활성화 */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        disableEnforceFocus={roomFinderOpen}
        disableAutoFocus={roomFinderOpen}
        disableRestoreFocus={roomFinderOpen}
      >
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

          {/* 라벨 + 유형 */}
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
              sx={{ "& .MuiSelect-select": { pl: canManageType ? 0 : 1.5 } }}
            >
              <MenuItem value="" disabled>유형 선택</MenuItem>
              {typeOptions.map((t) => (
                <MenuItem key={t.typeId} value={t.typeId}>{t.typeName}</MenuItem>
              ))}
            </TextField>
          </Box>

          {/* 시간/종일 + 반복 */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={value.allDay} onChange={(e) => onChange({ allDay: e.target.checked })} />}
              label="종일"
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {recurrence && recurrence.enabled && (
                <Chip size="small" label={recurrenceBadge(recurrence) ?? ""} />
              )}
              <Button variant="outlined" onClick={onOpenRecurrence}>반복등록</Button>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <DateTimePicker
              label="시작" ampm={false}
              value={value.start}
              onChange={(v) => v && onChange({ start: v })}
              format="YYYY-MM-DD HH:mm:ss"
            />
            <DateTimePicker
              label="종료" ampm={false}
              disabled={value.allDay}
              value={value.end}
              onChange={(v) => v && onChange({ end: v })}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Box>
          {error?.time && <Box sx={{ color: "tomato", fontSize: 12 }}>{error.time}</Box>}

          {/* ✅ 회의실 예약(옵션) — 선택만 */}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "grid", gap: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <FormControlLabel
                control={<Switch checked={needsRoom} onChange={(e) => setNeedsRoom(e.target.checked)} />}
                label="회의실 예약"
              />
              {selectedRoom ? (
                <Typography variant="body2">선택됨: {selectedRoom.roomName}</Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">회의실 미선택</Typography>
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                ref={findRoomBtnRef}
                variant="outlined"
                size="small"
                disabled={!needsRoom || value.allDay || timeInvalid}
                onClick={() => {
                  setRoomFinderOpen(true);             // 모달 먼저 열기
                  void fetchRoomAvailability();        // 데이터 로딩
                }}
              >
                가용 회의실 찾기
              </Button>
            </Stack>
            {roomErr && <Typography variant="caption" color="error">{roomErr}</Typography>}
          </Box>

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
                <Chip key={m.userNo} label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
              ))}
              {attendees.length === 0 && (
                <Typography variant="body2" color="text.secondary">선택된 참석자가 없습니다.</Typography>
              )}
            </Stack>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small" placeholder="이름 입력 후 Enter 또는 추가"
                onKeyDown={(e) => { if (e.key === "Enter") onQuickAdd("ATTENDEE", (e.target as HTMLInputElement).value); }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={() => onOpenPeoplePicker("ATTENDEE")}>
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
                <Chip key={m.userNo} label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
              ))}
              {sharers.length === 0 && (
                <Typography variant="body2" color="text.secondary">선택된 공유자가 없습니다.</Typography>
              )}
            </Stack>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small" placeholder="이름 입력 후 Enter 또는 추가"
                onKeyDown={(e) => { if (e.key === "Enter") onQuickAdd("SHARER", (e.target as HTMLInputElement).value); }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={() => onOpenPeoplePicker("SHARER")}>
                공유자 선택(부서별)
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>취소</Button>
          <Button variant="contained" onClick={handleSave}>만들기</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ 가용 회의실 모달 — 클릭하면 선택만 */}
      <Dialog
        open={roomFinderOpen}
        onClose={() => {
          // ⬇️ 닫기 직전 포커스를 바깥으로 이동
          focusOutsideModals();
          setRoomFinderOpen(false);
          setTimeout(() => findRoomBtnRef.current?.focus(), 0);
        }}
        fullWidth
        maxWidth="sm"
        keepMounted
        disableRestoreFocus
        transitionDuration={{ exit: 0 }}  // 닫힘 애니메이션 제거 → 경고 레이스 완화
      >
        <DialogTitle>가용 회의실</DialogTitle>
        <DialogContent dividers>
          {isFindingRooms && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              조회 중…
            </Typography>
          )}
          <List dense>
            {roomOptions.map((o, idx) => (
              <ListItemButton
                key={o.roomId}
                onClick={() => selectRoom(o.roomId)}
                disabled={!o.available}
                autoFocus={idx === 0}
              >
                <ListItemText
                  primary={`${o.roomName}${o.capacity ? ` · ${o.capacity}명` : ""}`}
                  secondary={`${o.buildingName ?? ""} ${o.floor ?? ""} ${o.available ? "(예약 가능)" : "(불가)"}`}
                />
              </ListItemButton>
            ))}
            {roomOptions.length === 0 && !isFindingRooms && (
              <Typography variant="body2" color="text.secondary">
                해당 시간에 가용한 회의실이 없습니다.
              </Typography>
            )}
          </List>
          {roomErr && (
            <Typography variant="caption" color="error">
              {roomErr}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            focusOutsideModals();
            setRoomFinderOpen(false);
            setTimeout(() => findRoomBtnRef.current?.focus(), 0);
          }}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 유형관리 모달 (HR/ADMIN만) */}
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
