import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Stack, FormControlLabel, Switch, Alert, Link
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { getEventDetail, type EventDetail, updateEvent, deleteEvent } from "../../../api/calendarApi";
import { api } from "../../../api/coreflowApi";

// 디버그 패널(도면 URL/경고)을 보여줄지 여부
const SHOW_DEBUG = false;

// 절대 URL 보정
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

/** 다양한 키 이름을 지원하며, 사용자 배열을 통일된 형태로 변환 */
type SimpleMember = { id: number; name: string; email?: string };
function normalizeMembers(source: any, keys: string[]): SimpleMember[] {
  if (!source) return [];
  const found = keys.map(k => (source as any)[k]).find(v => Array.isArray(v));
  const arr: any[] = Array.isArray(found) ? found : [];
  return arr.map((m: any, i: number) => {
    const id =
      Number(m.userNo ?? m.USER_NO ?? m.id ?? m.ID ?? i);
    const name =
      String(
        m.userName ?? m.USER_NAME ?? m.name ?? m.NAME ??
        m.displayName ?? m.DISPLAY_NAME ?? "이름없음"
      );
    const email = m.email ?? m.EMAIL ?? undefined;
    return { id, name, email };
  });
}

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
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState<Dayjs | null>(null);
  const [end, setEnd] = useState<Dayjs | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 참석자/공유자 목록(여러 키명 대응)
  const attendees = useMemo(
    () =>
      normalizeMembers(detail, [
        "attendees", "attendeeList", "attendeeUsers", "participants",
        "ATTENDEES", "ATTENDEE_LIST", "PARTICIPANTS"
      ]),
    [detail]
  );
  const sharers = useMemo(
    () =>
      normalizeMembers(detail, [
        "sharers", "shareUsers", "shareMembers",
        "SHARERS", "SHARE_USERS", "SHARE_MEMBERS"
      ]),
    [detail]
  );

  // 도면 상태
  const room = detail?.room;
  const rawUrl = room?.detailLocation ?? null;
  const absUrl = useMemo(() => (rawUrl ? toAbsoluteMapUrl(rawUrl) : null), [rawUrl]);
  const cacheBustUrl = useMemo(
    () => (absUrl ? `${absUrl}${absUrl.includes("?") ? "&" : "?"}t=${Date.now()}` : null),
    [absUrl]
  );

  const [imgErr, setImgErr] = useState<string | null>(null);
  const [imgInfo, setImgInfo] = useState<{ w: number; h: number } | null>(null);

  // SVG를 직접 텍스트로 로드해서 렌더
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

  // SVG면 텍스트로 불러오기
  useEffect(() => {
    setSvgMarkup(null);
    setSvgErr(null);
    setImgErr(null);
    setImgInfo(null);

    if (!cacheBustUrl || !isSvgUrl(cacheBustUrl)) return;

    let alive = true;
    (async () => {
      try {
        // 절대 URL이므로 baseURL 무시하고 그대로 요청
        const r = await api.get(cacheBustUrl, { responseType: "text" as any });
        const txt = String(r.data ?? "");
        if (!alive) return;
        setSvgMarkup(patchSvgResponsive(txt));
      } catch {
        if (!alive) return;
        // 메시지는 내부적으로만 유지(화면 표시 X)
        setSvgErr("SVG 텍스트 로드 실패 — IMG 경로로 폴백합니다.");
      }
    })();

    return () => { alive = false; };
  }, [cacheBustUrl]);

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>일정 상세</DialogTitle>
      <DialogContent sx={{ pt: 1, display: "grid", gap: 2 }}>
        {loading && <div>불러오는 중…</div>}
        {error && <Alert severity="error">{error}</Alert>}

        {detail && (
          <>
            {/* 제목 + 권한 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "space-between" }}>
              {!edit ? (
                <Typography variant="h6">{detail.title}</Typography>
              ) : (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ fontSize: 18, padding: "6px 8px", width: "100%", border: "1px solid #e5e7eb", borderRadius: 6 }}
                />
              )}
              <Stack direction="row" spacing={1}>
                {detail.canEdit && !edit && <Button onClick={() => setEdit(true)}>수정</Button>}
                {detail.canDelete && <Button color="error" onClick={handleDelete}>삭제</Button>}
              </Stack>
            </Box>

            {/* 시간 */}
            {!edit ? (
              <Typography variant="body1">
                {dayjs(detail.startAt).format("YYYY-MM-DD HH:mm")} ~ {dayjs(detail.endAt).format("YYYY-MM-DD HH:mm")}
                {detail.allDayYn === "Y" && " (종일)"}
              </Typography>
            ) : (
              <>
                <FormControlLabel
                  control={<Switch checked={allDay} onChange={(e) => {
                    const c = e.target.checked; setAllDay(c);
                    if (c && start) setEnd(start.startOf("day").add(1, "day"));
                  }} />}
                  label="종일"
                />
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <DateTimePicker ampm={false} label="시작" value={start}
                    onChange={(v) => { if (!v) return; setStart(v); if (allDay) setEnd(v.startOf("day").add(1, "day")); }} />
                  <DateTimePicker ampm={false} label="종료" value={end} disabled={allDay}
                    onChange={(v) => { if (v) setEnd(v); }} />
                </Box>
              </>
            )}

            {/* 위치/메모 */}
            {!!detail.locationText && !edit && <Typography color="text.secondary">장소: {detail.locationText}</Typography>}
            {!!detail.note && !edit && <Typography color="text.secondary">메모: {detail.note}</Typography>}

            {/* 참석자 */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">참석자</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {detail.attendees?.length
                  ? detail.attendees.map(m => (
                    <Chip key={m.userNo} label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
                  ))
                  : <Typography variant="body2" color="text.secondary">없음</Typography>}
              </Stack>
            </Box>

            {/* 공유자 */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2">공유자</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {detail.sharers?.length
                  ? detail.sharers.map(m => (
                    <Chip key={m.userNo} label={`${m.userName}${m.email ? ` (${m.email})` : ""}`} />
                  ))
                  : <Typography variant="body2" color="text.secondary">없음</Typography>}
              </Stack>
            </Box>

            {/* 회의실 + 도면 */}
            {room ? (
              <Box sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>회의실</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  <Chip label={`방: ${room.roomName}`} />
                  {room.buildingName && <Chip label={`건물: ${room.buildingName}`} />}
                  {room.floor && <Chip label={`층: ${room.floor}`} />}
                  {room.roomNo && <Chip label={`호: ${room.roomNo}`} />}
                  {typeof room.capacity === "number" && <Chip label={`정원: ${room.capacity}명`} />}
                </Stack>

                {/* 도면 미리보기 */}
                {cacheBustUrl ? (
                  <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden", height: 420, background: "#fff" }}>
                    {svgMarkup && isSvgUrl(cacheBustUrl) ? (
                      // SVG를 직접 렌더 (하얀 화면 방지)
                      <div
                        style={{ width: "100%", height: "100%" }}
                        dangerouslySetInnerHTML={{ __html: svgMarkup }}
                      />
                    ) : (
                      // SVG 로드 실패 또는 비-SVG → IMG 폴백
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
              <Typography color="text.secondary">연결된 회의실이 없습니다.</Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
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
