// src/pages/main/MainPage.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box, Card, CardContent, CardHeader, Container, Divider, IconButton,
  Stack, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  Link as MuiLink, List, ListItem, ListItemText, Badge, Tooltip, Skeleton, GlobalStyles
} from "@mui/material";
import { Refresh as RefreshIcon, OpenInNew as OpenInNewIcon } from "@mui/icons-material";

import dayjs from "dayjs";
import "dayjs/locale/ko";

// ✅ FullCalendar (CalendarPage와 동일 계열)
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Button } from "@mui/material";
import { Chat as ChatIcon } from "@mui/icons-material";
import ChatManager from "../components/chat/ChatManager";

// 대시보드 API: 공지/결재/채팅
import {
  fetchApprovals, fetchChatRooms, fetchNotices,
  type ApprovalItem, type ChatRoomItem, type NoticeItem
} from "../api/dashboardApi";

// 캘린더 API: 목록/이벤트/라벨 (이미 구현되어 있는 것 그대로 사용)
import {
  fetchVisibleCalendars, fetchEvents, fetchLabels,
  type CalendarSummary, type EventDto
} from "../api/calendarApi";

import Header from "../components/Header";

// ────────────────────────────────────────────────
// 메인 달력에서 사용할 이벤트 타입(FullCalendar 용)
type FCEvent = {
  id: string;
  eventId: number;
  calId: number;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

export default function MainPages() {
  // ── 공통 상태
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>([]);

  // ── 달력 상태
  const fcRef = useRef<FullCalendar | null>(null);
  const [visibleCals, setVisibleCals] = useState<CalendarSummary[]>([]);
  const [fcEvents, setFcEvents] = useState<FCEvent[]>([]);
  const [labelColorMap, setLabelColorMap] = useState<Map<number, string>>(new Map());

  // 색 대비
  const pickTextColor = (hex = "#64748b") => {
    const n = (h: string) => parseInt(h, 16);
    const m = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "64748b";
    const r = n(m.slice(0, 2)), g = n(m.slice(2, 4)), b = n(m.slice(4, 6));
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y < 140 ? "#fff" : "#111";
  };
  const findCalColor = (calId: number) =>
    visibleCals.find(c => c.calId === calId)?.color || "#64748b";

  // 공지/결재/채팅 + (아래) 라벨/캘린더/이벤트 한번에 갱신
  const refreshAll = async () => {
  setLoading(true);
  try {
    const [n, a, c] = await Promise.all([
      fetchNotices(8),
      fetchApprovals(8),
      fetchChatRooms(8),
    ]);
    setNotices(n);
    setApprovals(a);
    setChatRooms(c);

    // 라벨 → 맵 캐시
    try {
      const labels = await fetchLabels();
      const m = new Map<number, string>();
      labels.forEach(l => m.set(Number(l.labelId), String(l.labelColor)));
      setLabelColorMap(m);
    } catch {}

    // 가시 캘린더 목록
    const cals = await fetchVisibleCalendars();
    setVisibleCals(cals);

    // ⚠ 여기서 loadRange() 호출하지 말기!
    // setVisibleCals가 비동기라, 아직 빈 배열 상태로 조회될 수 있음
  } finally {
    setLoading(false);
  }
};

const [chatOpen, setChatOpen] = useState(false);
const openChat = () => setChatOpen(true);
const closeChat = () => setChatOpen(false);

  // 최초 로딩
  useEffect(() => { refreshAll(); /* eslint-disable-next-line */ }, []);

  // 현재 보이는 기간의 이벤트 조회
  const loadRange = useCallback(async () => {
  const api = fcRef.current?.getApi();
  if (!api) return;

  const start = dayjs(api.view.activeStart).format("YYYY-MM-DD HH:mm:ss");
  const end   = dayjs(api.view.activeEnd).format("YYYY-MM-DD HH:mm:ss");

  if (!visibleCals.length) { setFcEvents([]); return; }

  try {
    const lists: EventDto[][] = [];
    for (const cal of visibleCals) {
      const data = await fetchEvents({ calendarId: cal.calId, from: start, to: end });
      lists.push(data);
    }

    const all = lists.flat().map((e) => {
      const base = e.labelId ? labelColorMap.get(Number(e.labelId)) ?? findCalColor(e.calId)
                             : findCalColor(e.calId);
      const text = pickTextColor(base);
      return {
        id: String(e.eventId),
        eventId: e.eventId,
        calId: e.calId,
        title: e.title,
        start: e.startAt,
        end: e.endAt,
        allDay: e.allDayYn === "Y",
        backgroundColor: base,
        borderColor: base,
        textColor: text,
      } as FCEvent;
    });
    setFcEvents(all);
  } catch {
    setFcEvents([]);
  }
}, [visibleCals, labelColorMap]);   // ← 의존성


  // 캘린더 색 스트라이프 용 클래스
  const eventClassNames = () => ["cf-calstripe"];
  const eventDidMount = (info: any) => {
    const calId = info.event.extendedProps?.calId as number;
    const calHex = findCalColor(calId) || "#64748b";
    (info.el as HTMLElement).style.setProperty("--cf-cal", calHex);
  };

  // 카드 공통 스타일
  const cardSx = {
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
    background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)"
  };

  useEffect(() => {
  if (!visibleCals.length) { setFcEvents([]); return; }
  loadRange();
}, [visibleCals, labelColorMap, loadRange]);

// ───────────────── 캘린더 월/주/일 전환·이동 시 재조회
<FullCalendar
  // ...
  datesSet={loadRange}     // ← 함수 참조를 넘겨야 함 (괄호 X)
/>
return (
  <>
    {/* 고정 헤더(그대로) */}
    <div
      className="fixed top-0 left-0 w-screen flex flex-col justify-between bg-gray-800 text-white h-32"
      style={{ zIndex: 1000 }}
    >
      <p className="p-4 font-bold text-5xl">CoreFlow</p>
      <Header />
    </div>

    {/* FullCalendar 톤 보정(그대로) */}
    <GlobalStyles styles={{
      ".fc .fc-toolbar-title": { fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px" },
      ".fc .fc-button": { borderRadius: 8, padding: "4px 10px" },
      ".fc-theme-standard td, .fc-theme-standard th": { borderColor: "#e5e7eb" },
      ".fc .fc-col-header-cell-cushion": { padding: "8px 4px", fontWeight: 600, color: "#374151" },
      ".fc .fc-daygrid-day-number": { fontSize: 13, fontWeight: 600, color: "#374151", padding: "6px 8px" },
      ".fc .fc-daygrid-day.fc-day-today": { background: "#fff7ed" },
      ".fc .fc-daygrid-day.fc-day-other": { opacity: 0.45 },
      ".fc .fc-daygrid-block-event": { margin: "2px 6px" },
      ".fc .fc-event": { borderRadius: 8, padding: "1px 4px", fontSize: 12, border: "none" },
      ".fc .fc-event .fc-event-main": { padding: "0 2px" },
      ".cf-calstripe": { position: "relative" },
      ".cf-calstripe::before": {
        content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: "7px", background: "var(--cf-cal)"
      }
    }} />

    {/* ===== App.tsx의 레이아웃 클래스 영향 완전 차단 ===== */}
    <Box
      sx={{
        position: "fixed",
        top: "140px",          // 헤더 여유 포함. 필요 시 136~148px 조정
        left: 0,
        right: 0,
        bottom: 0,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 440px" }, // 좌:가변, 우:440px 고정
        gap: 2,
        px: 2,
        pb: 2,
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {/* 좌: 달력(높이 100%) */}
      <Card
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 10px 30px rgba(0,0,0,.06)",
          background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <CardHeader
          title={<Typography variant="h6" fontWeight={800}>일정관리</Typography>}
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="새로고침">
                <span>
                  <IconButton size="small" disabled={loading} onClick={refreshAll}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="캘린더로 이동">
                <IconButton size="small"><OpenInNewIcon /></IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <Divider />
        <CardContent sx={{ pt: 1, flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Box sx={{ height: "100%", minHeight: 0 }}>
            <FullCalendar
              ref={fcRef as any}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              locale="ko"
              timeZone="local"
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="100%"   // 부모 높이 100%
              expandRows
              stickyHeaderDates
              views={{
                dayGridMonth: { dayMaxEventRows: 3 },
                timeGridWeek: { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
                timeGridDay:   { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
              }}
              weekends
              navLinks
              nowIndicator
              eventDisplay="block"
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              dayHeaderFormat={{ weekday: "short" }}
              events={fcEvents}
              datesSet={loadRange}
              eventClassNames={() => ["cf-calstripe"]}
              eventDidMount={(info) => {
                const calId = info.event.extendedProps?.calId as number;
                const calHex = visibleCals.find(c => c.calId === calId)?.color || "#64748b";
                (info.el as HTMLElement).style.setProperty("--cf-cal", calHex);
              }}
            />
          </Box>
        </CardContent>
      </Card>

    {/* 우: 전자결재 + 공지 + 채팅 (캘린더 높이 기준 2/5, 2/5, 1/5) */}
<Box
  sx={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minHeight: 0,      // ← flex 자식이 제대로 높이 계산하도록 필수
    overflow: "hidden" // ← 개별 카드에서만 스크롤
  }}
>
  {/* 전자결재: 2/5 */}
  <Card
    sx={{
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "0 10px 30px rgba(0,0,0,.06)",
      background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)",
      flex: "2 1 0%",
      minHeight: 0,                // ← 이 카드 자체가 줄어들 때 0밑으로 안 가게
      display: "flex",
      flexDirection: "column"
    }}
  >
    <CardHeader
      title={<Typography variant="h6" fontWeight={800}>전자결재</Typography>}
      action={
        <Stack direction="row" spacing={1}>
          <Tooltip title="새로고침">
            <span>
              <IconButton size="small" disabled={loading} onClick={refreshAll}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="전자결재 바로가기">
            <IconButton size="small"><OpenInNewIcon /></IconButton>
          </Tooltip>
        </Stack>
      }
      sx={{ pb: 0.5 }}
    />
    {/* 카드 내부 스크롤 영역 */}
    <CardContent sx={{ pt: 1, flex: 1, minHeight: 0, overflow: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "grey.50" } }}>
            <TableCell sx={{ width: "56%" }}>제목</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>기안자</TableCell>
            <TableCell>일자</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && [...Array(4)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={4}><Skeleton height={24} /></TableCell>
            </TableRow>
          ))}
          {!loading && approvals.map(a => (
            <TableRow key={a.approvalId} hover>
              <TableCell>
                <MuiLink component="button" underline="hover">{a.title}</MuiLink>
              </TableCell>
              <TableCell>
                <Chip size="small" label={a.status} sx={{ borderRadius: 1, bgcolor: "grey.200" }} />
              </TableCell>
              <TableCell>{a.writerName ?? "-"}</TableCell>
              <TableCell>{dayjs(a.createdAt).format("YYYY/MM/DD")}</TableCell>
            </TableRow>
          ))}
          {!loading && approvals.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">표시할 결재 문서가 없습니다.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  {/* 공지사항: 2/5 */}
  <Card
    sx={{
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "0 10px 30px rgba(0,0,0,.06)",
      background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)",
      flex: "2 1 0%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column"
    }}
  >
    <CardHeader
      title={<Typography variant="h6" fontWeight={800}>공지사항</Typography>}
      action={
        <Stack direction="row" spacing={1}>
          <Tooltip title="새로고침">
            <span>
              <IconButton size="small" disabled={loading} onClick={refreshAll}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="공지 전체보기">
            <IconButton size="small"><OpenInNewIcon /></IconButton>
          </Tooltip>
        </Stack>
      }
      sx={{ pb: 0.5 }}
    />
    {/* 카드 내부 스크롤 영역 */}
    <CardContent sx={{ pt: 1, flex: 1, minHeight: 0, overflow: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "grey.50" } }}>
            <TableCell sx={{ width: "60%" }}>제목</TableCell>
            <TableCell>작성일</TableCell>
            <TableCell>작성자</TableCell>
            <TableCell align="center">조회</TableCell>
            <TableCell align="center">첨부</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && [...Array(4)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={5}><Skeleton height={24} /></TableCell>
            </TableRow>
          ))}
          {!loading && notices.map(n => (
            <TableRow key={n.noticeId} hover>
              <TableCell><MuiLink underline="hover" component="button">{n.title}</MuiLink></TableCell>
              <TableCell>{dayjs(n.createdAt).format("YYYY/MM/DD")}</TableCell>
              <TableCell>{n.writerName ?? "-"}</TableCell>
              <TableCell align="center">{n.views ?? "-"}</TableCell>
              <TableCell align="center">{n.hasAttachment ? "📎" : ""}</TableCell>
            </TableRow>
          ))}
          {!loading && notices.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">공지사항이 없습니다.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  {/* 채팅: 1/5 (카드 클릭 시 모달 오픈) */}
  <Card
    onClick={openChat}
    sx={{
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      boxShadow: "0 10px 30px rgba(0,0,0,.06)",
      background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)",
      flex: "1 1 0%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      cursor: "pointer",
      userSelect: "none"
    }}
  >
    {/* <CardHeader title={<Typography variant="h6" fontWeight={800}>채팅</Typography>} /> */}
    {/* <Divider /> */}
    <CardContent sx={{ pt: 2, flex: 1, minHeight: 0, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography color="text.secondary">여기를 클릭하면 채팅이 열립니다.</Typography>
    </CardContent>
  </Card>
</Box>

{/* 채팅 모달 */}
{chatOpen && <ChatManager onClose={closeChat} />}
    </Box>

    {/* 채팅 모달 */}
    {/* {chatOpen && <ChatManager onClose={closeChat} />} */}
  </>
);

}
