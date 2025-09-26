// src/mainPage/MainPages.tsx
import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import {
  Box, Card, CardContent, CardHeader, Divider, IconButton,
  Stack, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  Link as MuiLink, Tooltip, Skeleton, GlobalStyles, Button
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PeopleAltRounded as PeopleIcon,
  DescriptionRounded as ApprovalIcon,
  MeetingRoomRounded as RoomIcon,
  GavelRounded as PolicyIcon,
  ChatBubbleRounded as ChatIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import dayjs from "dayjs";
import "dayjs/locale/ko";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import ChatManager from "../components/chat/ChatManager";
import NoticeMain from "../components/notice/NoticeMain";

// 대시보드 API
import {
  fetchApprovals, fetchNotices,
  type ApprovalItem, type NoticeItem
} from "../api/dashboardApi";

// 캘린더 API
import {
  fetchVisibleCalendars, fetchEvents, fetchLabels,
  type CalendarSummary, type EventDto
} from "../api/calendarApi";

import Header from "../components/Header";
import { menuItems, type MenuItem } from "../types/menuItems";
import NoticeDetail from "../components/notice/NoticeDetail";
import { clearGlobalUnreadCount, selectGlobalUnreadCount } from "../features/chatSlice";

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
  // busy-only 플래그(FullCalendar에서는 extendedProps로 들어감)
  isBusyOnly?: boolean;
};

type Props = { onChatClick?: () => void };

// 권한 판별(백엔드 필드 이름 다양성 방어)
const roleOf = (obj: any) =>
  String(obj?.defaultRole ?? obj?.role ?? obj?.myRole ?? obj?.shareRole ?? "").toUpperCase();
const isBusyRole = (obj: any) => roleOf(obj) === "BUSY_ONLY";

export default function MainPages({ onChatClick }: Props) {
  const dispatch = useDispatch();
  // ── 헤더 높이(겹침 방지)
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState(140);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setHeaderH(h);
      document.documentElement.style.setProperty("--cf-header-h", `${h}px`);
    };
    // @ts-ignore
    if (document.fonts?.ready) {
      // @ts-ignore
      document.fonts.ready.then(update).catch(() => update());
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  // ── 공통 상태
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);

  // ── 달력 상태
  const fcRef = useRef<FullCalendar | null>(null);
  const [visibleCals, setVisibleCals] = useState<CalendarSummary[]>([]);
  const [fcEvents, setFcEvents] = useState<FCEvent[]>([]);
  const [labelColorMap, setLabelColorMap] = useState<Map<number, string>>(new Map());
  const [busyOnlyMap, setBusyOnlyMap] = useState<Map<number, boolean>>(new Map());

  // 텍스트 대비 색
  const pickTextColor = (hex = "#64748b") => {
    const n = (h: string) => parseInt(h, 16);
    const m = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "64748b";
    const r = n(m.slice(0, 2)), g = n(m.slice(2, 4)), b = n(m.slice(4, 6));
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y < 140 ? "#fff" : "#111";
  };
  const findCalColor = (calId: number) =>
    visibleCals.find(c => c.calId === calId)?.color || "#64748b";

  // 데이터 새로고침
  const refreshAll = async () => {
    setLoading(true);
    try {
      const [n, a] = await Promise.all([
        fetchNotices(8),
        fetchApprovals(8),
      ]);
      setNotices(n);
      setApprovals(a);

      try {
        const labels = await fetchLabels();
        const m = new Map<number, string>();
        labels.forEach(l => m.set(Number(l.labelId), String(l.labelColor)));
        setLabelColorMap(m);
      } catch { }

      const cals = await fetchVisibleCalendars();
      setVisibleCals(cals);

      // BUSY_ONLY 맵 구성
      const bm = new Map<number, boolean>();
      cals.forEach(c => bm.set(Number(c.calId), isBusyRole(c)));
      setBusyOnlyMap(bm);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (accessToken) refreshAll(); }, [accessToken]);

  // 현재 보이는 기간 이벤트 조회
  const loadRange = useCallback(async () => {
    const api = fcRef.current?.getApi();
    if (!api) return;
    const start = dayjs(api.view.activeStart).format("YYYY-MM-DD HH:mm:ss");
    const end = dayjs(api.view.activeEnd).format("YYYY-MM-DD HH:mm:ss");
    if (!visibleCals.length) { setFcEvents([]); return; }
    try {
      const lists: EventDto[][] = [];
      for (const cal of visibleCals) {
        const data = await fetchEvents({ calendarId: cal.calId, from: start, to: end });
        lists.push(data);
      }
      const all = lists.flat().map((e) => {
        const base = e.labelId ? labelColorMap.get(Number(e.labelId)) ?? findCalColor(e.calId) : findCalColor(e.calId);
        const text = pickTextColor(base);

        const busy = (e as any).__busyMasked === true;
        const idStr = busy ? String((e as any).__clickBlockId ?? `busy:${e.eventId}`) : String(e.eventId);

        return {
          id: idStr,
          eventId: e.eventId,
          calId: e.calId,
          title: busy ? "바쁨" : e.title,   // ← 제목 마스킹
          start: e.startAt,
          end: e.endAt,
          allDay: e.allDayYn === "Y",
          backgroundColor: base, borderColor: base, textColor: text,
        } as FCEvent;
      });
      setFcEvents(all);
    } catch {
      setFcEvents([]);
    }
  }, [visibleCals, labelColorMap, busyOnlyMap]);
  useEffect(() => { if (!visibleCals.length) { setFcEvents([]); return; } loadRange(); }, [visibleCals, labelColorMap, busyOnlyMap, loadRange]);

  const eventClassNames = () => ["cf-calstripe"];
  const eventDidMount = (info: any) => {
    const calId = info.event.extendedProps?.calId as number;
    const calHex = findCalColor(calId) || "#64748b";
    (info.el as HTMLElement).style.setProperty("--cf-cal", calHex);
  };

  // ── 이동/모달/채팅
  const navigate = useNavigate();
  const PATH = {
    calendar: "/calendar",
    approvals: "/approvals/my-documents",
    members: "/members",
    rooms: "/rooms",
    policies: "/cpolicies",
    noticeDetail: (id: number | string) => `/notices/${id}`,
    approvalDetail: (id: number | string) => `/approvals/${id}`, // 예: /approvals/:id
  } as const;
  const goCalendar = () => navigate(PATH.calendar);
  const goApprovalsRoot = () => navigate(PATH.approvals);
  const goMembers = () => navigate(PATH.members);
  const goRooms = () => navigate(PATH.rooms);
  const goPolicies = () => navigate(PATH.policies);
  const handleApprovalClick = (approvalId: number) => {
    navigate(`/approvals/${approvalId}`)
  }

  const [noticeOpen, setNoticeOpen] = useState(false);
  const openNotice = () => setNoticeOpen(true);
  const closeNotice = () => setNoticeOpen(false);
  const [noticeDetailOpen, setNoticeDetailOpen] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);
      const totalUnreadCount = useSelector(selectGlobalUnreadCount);
  const openNoticeDetail = (notiId: number) => {
    setSelectedNoticeId(notiId);
    setNoticeDetailOpen(true);
  }

  const closeNoticeDetail = () => {
    setSelectedNoticeId(null);
    setNoticeDetailOpen(false);
  }

  const [chatOpen, setChatOpen] = useState(false);
  const openChatLocal = () => setChatOpen(true);
  const closeChatLocal = () => setChatOpen(false);
  const openChat = () => { if (onChatClick) {
    if (totalUnreadCount > 0) {
            dispatch(clearGlobalUnreadCount());
    }
    onChatClick();
  }
   else openChatLocal(); };

  // 아이콘바(토글형 서브메뉴) 상태
  const [openCard, setOpenCard] = useState<string | null>(null);
  const handleQuickClick = (item: MenuItem) => {
    if (item.path) { navigate(item.path); return; }
    if (item.action === "chat") { openChat(); return; }
    if (item.action === "notice") { openNotice(); return; }
    if (item.action === "toggleSubMenu" && item.subItems) {
      setOpenCard(prev => (prev === item.name ? null : item.name));
      return;
    }
  };
  const handleSubItemClick = (sub: Omit<MenuItem, "subItems">, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sub.path) navigate(sub.path);
  };

  // 아이콘바에 표시할 5개(공지/캘린더 제외)
  const quickItems = menuItems.filter(m => !["공지", "캘린더"].includes(m.name));

  // 공통 카드 스타일
  const cardSx = {
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
    background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)"
  };

  // 아이콘 (아이콘바 높이에 맞춰 크게)
  const iconOf = (name: string) => {
    const common = { sx: { fontSize: { xs: 34, lg: "clamp(34px, 7vh, 56px)" } } };
    switch (name) {
      case "인사관리": return <PeopleIcon {...common} />;
      case "전자결재": return <ApprovalIcon {...common} />;
      case "회의실": return <RoomIcon {...common} />;
      case "회사 규정": return <PolicyIcon {...common} />;
      case "채팅": return <ChatIcon {...common} />;
      default: return <PeopleIcon {...common} />;
    }
  };

  return (
    <>
      {/* 헤더 */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 bg-gray-800 text-white flow-root" style={{ zIndex: 1000 }}>
        <p className="px-4 py-2 font-bold text-5xl leading-tight m-0">CoreFlow</p>
        {accessToken && <Header />}
      </div>

      {/* FullCalendar 톤 보정 */}
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
        ".cf-calstripe::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: "7px", background: "var(--cf-cal)" }
      }} />

      {/* 본문 레이아웃: 좌/우 50:50 */}
      <Box
        sx={{
          position: "fixed",
          top: `${headerH}px`,
          left: 0, right: 0, bottom: 0,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 2, px: 2, pb: 2,
          overflow: "hidden", zIndex: 1,
        }}
      >
        {/* 좌: 일정관리 (50%) */}
        <Box sx={{ flex: { xs: "0 0 auto", lg: "1 1 50%" }, minWidth: 0, height: "100%" }}>
          <Card sx={{ ...cardSx, height: "100%", display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={800}>일정관리</Typography>}
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="새로고침">
                    <span><IconButton size="small" disabled={loading} onClick={refreshAll}><RefreshIcon /></IconButton></span>
                  </Tooltip>
                  <Tooltip title="캘린더로 이동">
                    <IconButton size="small" onClick={goCalendar}><OpenInNewIcon /></IconButton>
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
                  locale="ko" timeZone="local" initialView="dayGridMonth"
                  headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
                  height="100%" expandRows stickyHeaderDates
                  views={{
                    dayGridMonth: { dayMaxEventRows: 3 },
                    timeGridWeek: { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
                    timeGridDay: { slotMinTime: "08:00:00", slotMaxTime: "20:00:00", slotDuration: "00:30:00", expandRows: true },
                  }}
                  weekends navLinks nowIndicator eventDisplay="block"
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                  dayHeaderFormat={{ weekday: "short" }}
                  events={fcEvents}
                  datesSet={loadRange}
                  eventClassNames={eventClassNames}
                  eventDidMount={eventDidMount}
                  // BUSY_ONLY 이벤트 클릭 무시
                  eventClick={(arg) => {
                    if ((arg.event.extendedProps as any)?.isBusyOnly) {
                      arg.jsEvent.preventDefault();
                      arg.jsEvent.stopPropagation?.();
                      return;
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 우: (50%) — 공지 → 전자결재 → 아이콘바 */}
        <Box
          sx={{
            flex: { xs: "0 0 auto", lg: "1 1 50%" },
            display: "flex", flexDirection: "column",
            gap: 2, minHeight: 0, mt: { xs: 2, lg: 0 },
          }}
        >
          {/* 공지사항 (상단) */}
          <Card sx={{ ...cardSx, flex: "2 1 0%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={800}>공지사항</Typography>}
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="새로고침">
                    <span><IconButton size="small" disabled={loading} onClick={refreshAll}><RefreshIcon /></IconButton></span>
                  </Tooltip>
                  <Tooltip title="공지 전체보기">
                    <IconButton size="small" onClick={openNotice}><OpenInNewIcon /></IconButton>
                  </Tooltip>
                </Stack>
              }
              sx={{ pb: 0.5 }}
            />
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
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton height={24} /></TableCell></TableRow>
                  ))}
                  {!loading && notices.map(n => (

                    <TableRow key={n.noticeId} hover onClick={() => openNoticeDetail(n.noticeId)}>

                      <TableCell><MuiLink underline="hover" component="button">{n.title}</MuiLink></TableCell>
                      <TableCell>{dayjs(n.createdAt).format("YYYY/MM/DD")}</TableCell>
                      <TableCell>{n.writerName ?? "-"}</TableCell>
                      <TableCell align="center">{n.views ?? "-"}</TableCell>
                      <TableCell align="center">{n.hasAttachment ? "📎" : ""}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && notices.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center">공지사항이 없습니다.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 전자결재 (중단) */}
          <Card sx={{ ...cardSx, flex: "2 1 0%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={<Typography variant="h6" fontWeight={800}>전자결재</Typography>}
              action={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="새로고침">
                    <span><IconButton size="small" disabled={loading} onClick={refreshAll}><RefreshIcon /></IconButton></span>
                  </Tooltip>
                  <Tooltip title="전자결재 바로가기">
                    <IconButton size="small" onClick={goApprovalsRoot}><OpenInNewIcon /></IconButton>
                  </Tooltip>
                </Stack>
              }
              sx={{ pb: 0.5 }}
            />
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
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton height={24} /></TableCell></TableRow>
                  ))}
                  {!loading && approvals.map(a => (
                    <TableRow key={a.approvalId} hover onClick={() => handleApprovalClick(a.approvalId)}>
                      <TableCell><MuiLink component="button" underline="hover">{a.title}</MuiLink></TableCell>
                      <TableCell><Chip size="small" label={a.status} sx={{ borderRadius: 1, bgcolor: "grey.200" }} /></TableCell>
                      <TableCell>{a.writerName ?? "-"}</TableCell>
                      <TableCell>{dayjs(a.createdAt).format("YYYY/MM/DD")}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && approvals.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">표시할 결재 문서가 없습니다.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 아이콘바 (하단) */}
          <Card sx={{ ...cardSx, flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <CardContent
              sx={{
                pt: 1,
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1.5,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  width: "100%",
                  minHeight: 110,
                }}
              >
                {quickItems.map((item) => (
                  <Box
                    key={item.name}
                    onClick={() => handleQuickClick(item)}
                    sx={{
                      flex: "1 1 20%",
                      minWidth: 0,
                      display: "flex",
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 1,
                      borderRadius: 2,
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                  >
                    {item.action === "toggleSubMenu" && item.subItems && openCard === item.name ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 0.75,
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {item.subItems.map((sub) => (
                          <Button
                            key={sub.name}
                            variant="outlined"
                            size="small"
                            onClick={(e) => handleSubItemClick(sub, e)}
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 1.2,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "text.primary",
                              borderColor: "divider",
                              "&:hover": { bgcolor: "grey.50" },
                            }}
                          >
                            {sub.name}
                          {(item.action==='chat')&&(totalUnreadCount > 0) && (
                                <span className="w-2 h-2 float-right bg-red-500 rounded-full"></span>
                          )}
                          </Button>
                        ))}
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
                          {iconOf(item.name)}
                          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>{item.name}</Typography>
                        </Box>
                        {item.action === "toggleSubMenu" && (
                          <Box sx={{ position: "absolute", right: 6, bottom: 6, color: "text.secondary" }}>
                            {openCard === item.name ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 로컬 채팅 모달(부모 핸들러 없을 때만) */}
      {chatOpen && <ChatManager onClose={closeChatLocal} />}

      {/* 공지 전체보기 모달 */}
      {noticeOpen && <NoticeMain onClose={closeNotice} />}

      {/* 공지 상세보기 모달 */}
      {noticeDetailOpen && selectedNoticeId !== null && (<NoticeDetail notiId={selectedNoticeId} onClose={closeNoticeDetail} />)}
    </>
  );
}