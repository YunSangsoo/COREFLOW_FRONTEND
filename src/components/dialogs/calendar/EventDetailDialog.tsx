// src/components/dialogs/calendar/EventDetailDialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Stack, FormControlLabel, Switch,
  Alert, Link, Divider, Skeleton, TextField, Avatar
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  getEventDetail,
  type EventDetail,
  updateEvent,
  deleteEvent
} from "../../../api/calendarApi";
import { api } from "../../../api/coreflowApi";

// Icons
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import NotesOutlined from "@mui/icons-material/NotesOutlined";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import MeetingRoomRounded from "@mui/icons-material/MeetingRoomRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

// 디버그 패널(도면 URL/경고)을 보여줄지 여부
const SHOW_DEBUG = false;

/* ─────────────────────────────────────────────────────────
 * 유틸
 * ───────────────────────────────────────────────────────── */
function toAbsoluteMapUrl(u?: string | null) {
  if (!u) return null;
  const s = u.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s; // 이미 절대
  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (s.startsWith("/")) return `${base}${s}`;
  if (/\.(svg|png|jpe?g|gif)$/i.test(s)) return `${base}/rooms/floormaps/${s}`;
  return `${base}/${s.replace(/^\/?api\//, "")}`;
}
const isSvgUrl = (url: string) => /\.svg(\?|#|$)/i.test(url);

// SVG에 width/height/viewBox가 없어서 안 나오는 경우 보정
function patchSvgResponsive(svg: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const el = doc.documentElement;

    el.setAttribute("preserveAspectRatio", el.getAttribute("preserveAspectRatio") || "xMidYMid meet");
    el.setAttribute("width", "100%");
    el.setAttribute("height", "100%");

    if (!el.getAttribute("viewBox")) {
      const w = parseFloat(el.getAttribute("width") || "0");
      const h = parseFloat(el.getAttribute("height") || "0");
      if (w > 0 && h > 0) el.setAttribute("viewBox", `0 0 ${w} ${h}`);
    }

    const ser = new XMLSerializer();
    return ser.serializeToString(doc);
  } catch {
    return svg;
  }
}

// 다양한 키 이름을 지원하며, 사용자 배열을 통일된 형태로 변환
type SimpleMember = { id: number; name: string; email?: string };
function normalizeMembers(source: any, keys: string[]): SimpleMember[] {
  if (!source) return [];
  const found = keys.map(k => (source as any)[k]).find(v => Array.isArray(v));
  const arr: any[] = Array.isArray(found) ? found : [];
  return arr.map((m: any, i: number) => {
    const id = Number(m.userNo ?? m.USER_NO ?? m.id ?? m.ID ?? i);
    const name = String(
      m.userName ?? m.USER_NAME ?? m.name ?? m.NAME ??
      m.displayName ?? m.DISPLAY_NAME ?? "이름없음"
    );
    const email = m.email ?? m.EMAIL ?? undefined;
    return { id, name, email };
  });
}

// 이름 이니셜 (칩 아바타용)
const initials = (full?: string) =>
  (full ?? "")
    .trim()
    .split(/\s+/)
    .map(s => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ─────────────────────────────────────────────────────────
 * 컴포넌트
 * ───────────────────────────────────────────────────────── */
export default function EventDetailDialog({
  open, eventId, onClose,
  onUpdated, onDeleted,
}: {
  open: boolean;
  eventId: number | null;
  onClose: () => void;
  onUpdated?: (patch: Partial<{ title: string; startAt: string; endAt: string; allDayYn: "Y" | "N"; }>) => void;
  onDeleted?: () => void;
}) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [edit,    setEdit]    = useState(false);
  const [title,   setTitle]   = useState("");
  const [allDay,  setAllDay]  = useState(false);
  const [start,   setStart]   = useState<Dayjs | null>(null);
  const [end,     setEnd]     = useState<Dayjs | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  // 참석자/공유자 목록(키명 다양성 대응)
  const attendees = useMemo(
    () => normalizeMembers(detail, ["attendees","attendeeList","attendeeUsers","participants","ATTENDEES","ATTENDEE_LIST","PARTICIPANTS"]),
    [detail]
  );
  const sharers = useMemo(
    () => normalizeMembers(detail, ["sharers","shareUsers","shareMembers","SHARERS","SHARE_USERS","SHARE_MEMBERS"]),
    [detail]
  );

  // 헤더/프리뷰용 액센트 컬러 (라벨 > 캘린더 > 기본)
  const accent = useMemo(() => {
    const anyDetail: any = detail ?? {};
    return (anyDetail.labelColor || anyDetail.calColor || anyDetail.color || "#4096ff") as string;
  }, [detail]);

  // 도면 상태
  const room = (detail as any)?.room;
  const rawUrl = room?.detailLocation ?? null;
  const absUrl = useMemo(() => (rawUrl ? toAbsoluteMapUrl(rawUrl) : null), [rawUrl]);
  const cacheBustUrl = useMemo(() => (absUrl ? `${absUrl}${absUrl.includes("?") ? "&" : "?"}t=${Date.now()}` : null), [absUrl]);

  const [imgErr, setImgErr] = useState<string | null>(null);
  const [imgInfo, setImgInfo] = useState<{ w: number; h: number } | null>(null);

  // SVG 텍스트 로드
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [svgErr, setSvgErr] = useState<string | null>(null);

  // 상세 로드
  useEffect(() => {
    if (!open || !eventId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true); setError(null);
        const d = await getEventDetail(eventId);
        if (!alive) return;
        setDetail(d);
        setTitle(d.title ?? "");
        const s = dayjs(d.startAt); const e = dayjs(d.endAt);
        setStart(s); setEnd(e); setAllDay(d.allDayYn === "Y");
        setEdit(false);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "상세 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, eventId]);

  // SVG면 텍스트로 미리 로드
  useEffect(() => {
    setSvgMarkup(null); setSvgErr(null);
    setImgErr(null); setImgInfo(null);
    if (!cacheBustUrl || !isSvgUrl(cacheBustUrl)) return;

    let alive = true;
    (async () => {
      try {
        const r = await api.get(cacheBustUrl, { responseType: "text" as any });
        const txt = String(r.data ?? "");
        if (!alive) return;
        setSvgMarkup(patchSvgResponsive(txt));
      } catch {
        if (!alive) return;
        setSvgErr("SVG 텍스트 로드 실패 — IMG 경로로 폴백합니다.");
      }
    })();

    return () => { alive = false; };
  }, [cacheBustUrl]);

  // 저장/삭제
  const handleSave = async () => {
    if (!detail) return;
    if (!start || !end || !end.isAfter(start)) { setError("시작/종료 시간을 확인하세요."); return; }
    try {
      setLoading(true); setError(null);
      await updateEvent(String(detail.eventId), {
        title: title.trim() || detail.title,
        startAt: start.format("YYYY-MM-DD HH:mm:ss"),
        endAt: end.format("YYYY-MM-DD HH:mm:ss"),
        allDayYn: allDay ? "Y" : "N",
      });
      onUpdated?.({
        title: title.trim(),
        startAt: start.format("YYYY-MM-DD HH:mm:ss"),
        endAt: end.format("YYYY-MM-DD HH:mm:ss"),
        allDayYn: allDay ? "Y" : "N",
      });
      setEdit(false);
    } catch (e: any) {
      setError(e?.message ?? "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!confirm("이 일정을 삭제할까요?")) return;
    try {
      setLoading(true); setError(null);
      await deleteEvent(String(detail.eventId));
      onDeleted?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  const Header = (
    <>
      <DialogTitle sx={{ py: 2.25, pr: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Box sx={{
              width: 12, height: 12, borderRadius: "50%", background: accent,
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)"
            }} />
            {!edit ? (
              <Typography variant="h6" sx={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {detail?.title ?? "일정"}
              </Typography>
            ) : (
              <TextField
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                variant="standard"
                fullWidth
                inputProps={{ style: { fontSize: 18, fontWeight: 700 } }}
              />
            )}
          </Box>

          {/* 우측 액션 (권한에 따라) */}
          {detail && (
            <Stack direction="row" spacing={1}>
              {detail.canEdit && !edit && <Button onClick={() => setEdit(true)}>수정</Button>}
              {detail.canDelete && <Button color="error" onClick={handleDelete}>삭제</Button>}
            </Stack>
          )}
        </Box>
      </DialogTitle>
      <Divider />
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      {Header}

      <DialogContent sx={{ pt: 2, pb: 1.5, display: "grid", gap: 2.25 }}>
        {loading && (
          <>
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={160} />
            <Skeleton variant="rounded" height={48} />
          </>
        )}

        {error && <Alert severity="error"><InfoOutlined sx={{ mr: .5 }} /> {error}</Alert>}

        {!loading && detail && (
          <>
            {/* 시간/반복/종일 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
                <AccessTimeRounded fontSize="small" /> 시간
              </Box>

              {!edit ? (
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarMonthRounded fontSize="small" />
                    {dayjs(detail.startAt).format("YYYY-MM-DD HH:mm")} ~ {dayjs(detail.endAt).format("YYYY-MM-DD HH:mm")}
                    {detail.allDayYn === "Y" && <Chip size="small" label="종일" sx={{ ml: 1 }} />}
                  </Typography>
                </Stack>
              ) : (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={allDay}
                        onChange={(e) => {
                          const c = e.target.checked; setAllDay(c);
                          if (c && start) setEnd(start.startOf("day").add(1, "day"));
                        }}
                      />
                    }
                    label="종일"
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <DateTimePicker
                      ampm={false} label="시작" value={start}
                      onChange={(v) => { if (!v) return; setStart(v); if (allDay) setEnd(v.startOf("day").add(1, "day")); }}
                    />
                    <DateTimePicker
                      ampm={false} label="종료" value={end} disabled={allDay}
                      onChange={(v) => { if (v) setEnd(v); }}
                    />
                  </Box>
                </>
              )}
            </Box>

            {/* 위치/메모 */}
            {(!!detail.locationText || !!detail.note || edit) && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
                  <PlaceOutlined fontSize="small" /> 위치 · 메모
                </Box>

                {!edit ? (
                  <Stack spacing={0.5}>
                    {!!detail.locationText && (
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <PlaceOutlined fontSize="small" /> {detail.locationText}
                      </Typography>
                    )}
                    {!!detail.note && (
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <NotesOutlined fontSize="small" /> {detail.note}
                      </Typography>
                    )}
                    {!detail.locationText && !detail.note && (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </Stack>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <TextField
                      label="위치" value={detail.locationText ?? ""} onChange={() => {}}
                      placeholder={detail.locationText ?? "장소를 입력하거나 비워둘 수 있어요"} disabled
                    />
                    <TextField
                      label="메모" value={detail.note ?? ""} onChange={() => {}}
                      placeholder={detail.note ?? "메모를 입력하거나 비워둘 수 있어요"} disabled
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
                      * 위치/메모는 이 화면에서 편집하지 않아요. (상세 편집 화면에서 변경)
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* 참석자 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
                <GroupsRounded fontSize="small" /> 참석자
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {attendees.length > 0 ? (
                  attendees.map((m) => (
                    <Chip
                      key={m.id}
                      size="small"
                      label={`${m.name}${m.email ? ` (${m.email})` : ""}`}
                      avatar={<Avatar sx={{ width: 20, height: 20 }}>{initials(m.name)}</Avatar>}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">없음</Typography>
                )}
              </Stack>
            </Box>

            {/* 공유자 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .5, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
                <ShareOutlined fontSize="small" /> 공유자
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {sharers.length > 0 ? (
                  sharers.map((m) => (
                    <Chip
                      key={m.id}
                      size="small"
                      label={`${m.name}${m.email ? ` (${m.email})` : ""}`}
                      avatar={<Avatar sx={{ width: 20, height: 20 }}>{initials(m.name)}</Avatar>}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">없음</Typography>
                )}
              </Stack>
            </Box>

            {/* 회의실 + 도면 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: .75, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
                <MeetingRoomRounded fontSize="small" /> 회의실
              </Box>

              {room ? (
                <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 2, bgcolor: "#fff" }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                    <Chip size="small" label={`방: ${room.roomName}`} />
                    {room.buildingName && <Chip size="small" label={`건물: ${room.buildingName}`} />}
                    {room.floor && <Chip size="small" label={`층: ${room.floor}`} />}
                    {room.roomNo && <Chip size="small" label={`호: ${room.roomNo}`} />}
                    {typeof room.capacity === "number" && <Chip size="small" label={`정원: ${room.capacity}명`} />}
                  </Stack>

                  {/* 도면 미리보기 카드 */}
                  {cacheBustUrl ? (
                    <Box sx={{
                      position: "relative",
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                      overflow: "hidden",
                      height: 420,
                      background: "#fff"
                    }}>
                      {svgMarkup && isSvgUrl(cacheBustUrl) ? (
                        <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                      ) : (
                        <img
                          src={cacheBustUrl}
                          alt="회의실 도면"
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: imgErr ? "none" : "block" }}
                          onError={() => setImgErr("load_error")}
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            setImgErr(null);
                            setImgInfo({ w: el.naturalWidth, h: el.naturalHeight });
                          }}
                        />
                      )}
                      {/* 캡션 */}
                      <Box sx={{
                        position: "absolute",
                        left: 8, bottom: 8,
                        px: 1, py: .25,
                        bgcolor: "rgba(17,24,39,.6)",
                        color: "#fff", borderRadius: 1, fontSize: 12
                      }}>
                        도면 미리보기
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">도면 정보가 없습니다.</Typography>
                  )}

                  {/* 디버그 패널(기본 비표시) */}
                  {SHOW_DEBUG && cacheBustUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        도면 URL: <Link href={cacheBustUrl} target="_blank" rel="noopener">{cacheBustUrl}</Link>
                      </Typography>
                      {imgInfo && (
                        <Typography variant="body2" color="text.secondary">
                          로드됨: {imgInfo.w}×{imgInfo.h}px
                        </Typography>
                      )}
                      {svgErr && <Alert severity="info" sx={{ mt: 1 }}>{svgErr}</Alert>}
                      {imgErr && <Alert severity="warning" sx={{ mt: 1 }}>도면 이미지를 불러오지 못했습니다.</Alert>}
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">연결된 회의실이 없습니다.</Typography>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        {edit ? (
          <>
            <Button onClick={() => setEdit(false)} disabled={loading}>취소</Button>
            <Button variant="contained" onClick={handleSave} disabled={loading}>저장</Button>
          </>
        ) : (
          <Button onClick={onClose}>닫기</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
