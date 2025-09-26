import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Chip, MenuItem, Stack, Paper,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
  IconButton, Skeleton, Tooltip, TablePagination, Snackbar, Alert,
  useTheme, useMediaQuery, Divider, TableSortLabel
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import MapIcon from "@mui/icons-material/Map";

import type { Room, RoomStatus, RoomCreateReq, RoomUpdateReq } from "../../types/rooms/room";
import { fetchRooms, createRoom, updateRoom } from "../../api/roomApi";
import RoomCreateDialog from "./RoomCreateDialog";
import RoomDetailDialog from "./RoomDetailDialog";
import { api } from "../../api/coreflowApi";

/* -------------------------
   경로 보정 유틸 (RoomDetailDialog와 동일)
   ------------------------- */
const fixDoubleApi = (u: string) => (u || "").replace(/\/api\/api\//i, "/api/");
const extractFilename = (u?: string | null) => {
  if (!u) return "";
  const cleaned = fixDoubleApi(String(u)).split("#")[0].split("?")[0];
  const pathOnly = cleaned.replace(/^https?:\/\/[^/]+/i, "");
  try {
    return decodeURIComponent(pathOnly.split("/").pop() || "");
  } catch {
    return pathOnly.split("/").pop() || "";
  }
};

/* -------------------------
   Component
   ------------------------- */
export default function RoomList() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<{
    buildingName?: string;
    floor?: string;
    status?: RoomStatus | "";
    minCapacity?: number | "";
  }>({ status: "" });

  const [quickQuery, setQuickQuery] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [editRoomId, setEditRoomId] = useState<number | null>(null);

  const [detailRoomId, setDetailRoomId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<null | "name" | "capacity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [snack, setSnack] = useState<{ open: boolean; msg?: string; severity?: "success" | "error" | "info" }>({ open: false });

  // 인라인 SVG 캐시
  const [svgMap, setSvgMap] = useState<Record<number, string | null>>({});
  const [svgErrMap, setSvgErrMap] = useState<Record<number, string | null>>({});

  /* 데이터 로드 */
  const load = async (override?: Partial<typeof filters>) => {
    setLoading(true);
    try {
      const finalFilters = { ...filters, ...(override ?? {}) };
      const data = await fetchRooms({
        buildingName: finalFilters.buildingName || undefined,
        floor: finalFilters.floor || undefined,
        status: (finalFilters.status || undefined) as RoomStatus | undefined,
        minCapacity: typeof finalFilters.minCapacity === "number" ? finalFilters.minCapacity : undefined,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "조회 실패", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setFilters(f => ({ ...f, buildingName: quickQuery }));
      void load({ ...filters, buildingName: quickQuery });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickQuery]);

  /* 정렬/페이지 계산 */
  const sortedItems = useMemo(() => {
    const copy = [...items];
    if (sortBy === "name") {
      copy.sort((a, b) => ((a.roomName ?? "")).localeCompare(b.roomName ?? "") * (sortDir === "asc" ? 1 : -1));
    } else if (sortBy === "capacity") {
      copy.sort((a, b) => (Number(a.capacity ?? 0) - Number(b.capacity ?? 0)) * (sortDir === "asc" ? 1 : -1));
    }
    return copy;
  }, [items, sortBy, sortDir]);

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  /* SVG lazy load */
  useEffect(() => {
    let alive = true;
    const controllers: Record<number, AbortController> = {};

    async function fetchSvgForRow(r: Room) {
      const filename = extractFilename(r.detailLocation ?? "");
      if (!filename || !/\.svg$/i.test(filename)) return;
      if (svgMap[r.roomId] !== undefined || svgErrMap[r.roomId]) return;

      const path = `/rooms/floormaps/${encodeURIComponent(filename)}`;
      const ac = new AbortController();
      controllers[r.roomId] = ac;

      try {
        const res = await api.get<string>(path, {
          responseType: "text" as any,
          headers: { Accept: "image/svg+xml" },
          signal: ac.signal as any,
        });
        if (!alive) return;
        setSvgMap(prev => ({ ...prev, [r.roomId]: String(res.data ?? "") }));
      } catch (e: any) {
        if (!alive) return;
        setSvgErrMap(prev => ({ ...prev, [r.roomId]: e?.message ?? "SVG 로드 실패" }));
        setSvgMap(prev => ({ ...prev, [r.roomId]: null }));
      }
    }

    visibleRows.forEach(r => { void fetchSvgForRow(r); });

    return () => {
      alive = false;
      Object.values(controllers).forEach(c => c.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRows.map(r => r.roomId).join("|"), items]);

  /* 스크롤/하이라이트 helper */
  const scrollToRoom = (roomId?: number, roomName?: string) => {
    let sel: HTMLElement | null = null;
    if (typeof roomId === "number") {
      sel = document.querySelector<HTMLElement>(`[data-room-id="${roomId}"]`);
    }
    if (!sel && roomName) {
      sel = Array.from(document.querySelectorAll<HTMLElement>('[data-room-name]'))
        .find(el => el.getAttribute('data-room-name') === roomName) ?? null;
    }
    if (sel) {
      sel.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        sel.animate(
          [
            { boxShadow: "0 0 0 0 rgba(59,130,246,0.0)" },
            { boxShadow: "0 0 0 8px rgba(59,130,246,0.12)" },
            { boxShadow: "0 0 0 0 rgba(59,130,246,0.0)" }
          ],
          { duration: 1200 }
        );
      } catch { }
    }
  };

  /* 생성/수정 핸들러 */
  const handleSubmit = async (form: RoomCreateReq) => {
    try {
      if (editRoomId) {
        const updateBody: RoomUpdateReq = { ...form } as RoomUpdateReq;
        await updateRoom(editRoomId, updateBody);
        setSnack({ open: true, msg: "회의실이 수정되었습니다.", severity: "success" });
        await load();
        scrollToRoom(editRoomId);
      } else {
        const res: any = await createRoom(form);
        setSnack({ open: true, msg: "회의실이 생성되었습니다.", severity: "success" });
        await load();
        const newId = Number((res ?? {})?.roomId ?? (res ?? {})?.id ?? NaN);
        if (Number.isFinite(newId)) scrollToRoom(newId);
        else scrollToRoom(undefined, form.roomName ?? "");
      }
      setOpenCreate(false);
      setEditRoomId(null);
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "저장 실패", severity: "error" });
    }
  };

  const toggleSort = (key: "name" | "capacity") => {
    if (sortBy === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ status: "" });
    setQuickQuery("");
    setPage(0);
    void load({ status: "", buildingName: "", floor: "", minCapacity: "" });
  };

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      {/* 필터바 */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", flex: 1, gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <SearchIcon color="action" />
          <TextField
            label="건물 (자동검색)"
            size="small"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="건물명을 입력하면 자동으로 필터됩니다"
            sx={{ minWidth: 220 }}
          />

          <TextField
            label="층"
            size="small"
            value={filters.floor || ""}
            onChange={(e) => setFilters((f) => ({ ...f, floor: e.target.value }))}
            sx={{ minWidth: 100 }}
          />

          <TextField
            select
            label="상태"
            size="small"
            sx={{ minWidth: 140 }}
            value={filters.status || ""}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
          </TextField>

          <TextField
            type="number"
            label="최소 정원"
            size="small"
            value={filters.minCapacity ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minCapacity: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            sx={{ width: 120 }}
          />

          <Button variant="outlined" onClick={() => { setPage(0); void load(); }} disabled={loading}>
            검색
          </Button>

          <Button variant="text" onClick={clearFilters}>초기화</Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="contained"
            onClick={() => {
              setEditRoomId(null);
              setOpenCreate(true);
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('div[role="dialog"] input:not([type="checkbox"]):not([type="radio"])');
                input?.focus();
              }, 220);
            }}
          >
            회의실 생성
          </Button>
        </Box>
      </Stack>

      {/* 활성 필터 Chips */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="text.secondary">활성 필터:</Typography>
          {filters.buildingName ? <Chip label={`건물: ${filters.buildingName}`} size="small" /> : null}
          {filters.floor ? <Chip label={`층: ${filters.floor}`} size="small" /> : null}
          {filters.status ? <Chip label={`상태: ${filters.status}`} size="small" /> : null}
          {typeof filters.minCapacity === "number" ? <Chip label={`최소정원: ${filters.minCapacity}`} size="small" /> : null}
          {!filters.buildingName && !filters.floor && !filters.status && filters.minCapacity === "" && (
            <Typography variant="body2" color="text.secondary">없음</Typography>
          )}
        </Stack>
      </Box>

      {isSmall ? (
        /* 모바일 카드 */
        <Stack spacing={1}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Skeleton width="40%" height={24} />
                <Skeleton width="60%" />
                <Skeleton width="30%" />
              </Paper>
            ))
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ fontSize: 48, color: "action.disabled" }}>🏢</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>등록된 회의실이 없습니다</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>새 회의실을 추가해보세요.</Typography>
              <Button variant="contained" onClick={() => { setOpenCreate(true); }}>회의실 생성</Button>
            </Box>
          ) : (
            items.map((r) => (
              <Paper key={r.roomId} variant="outlined" sx={{ p: 2 }} data-room-id={r.roomId} data-room-name={r.roomName}>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{r.roomName}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.buildingName || "-"} · {r.floor || "-"}층 · {r.roomNo || "-"}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip size="small" label={r.status} color={r.status === "ACTIVE" ? "success" : "default"} />
                      <Typography variant="body2" sx={{ mt: 1 }}>{r.detailLocation || "-"}</Typography>
                    </Box>
                  </Box>
                  <Stack spacing={0.5} alignItems="center">
                    <Tooltip title="상세 보기"><IconButton size="small" onClick={() => setDetailRoomId(r.roomId)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="편집"><IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditRoomId(r.roomId); setOpenCreate(true); setTimeout(() => { const input = document.querySelector<HTMLInputElement>('div[role="dialog"] input:not([type="checkbox"]):not([type="radio"])'); input?.focus(); }, 220); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      ) : (
        // 데스크톱 테이블
        <Box sx={{ width: "100%", overflow: "auto" }}>
          <Table
            size="small"
            sx={{
              minWidth: 1200,             // 살짝 넉넉히
              tableLayout: "fixed",

              // 기본 패딩 동일
              "& th, & td": { py: 1.25, px: 1.5 },

              // 헤더 아이콘 절대배치 준비
              "& thead th": { position: "relative" },

              // ⑤ 정원: 헤더/바디 동일한 우측 패딩 + 아이콘은 절대배치
              "& thead th:nth-of-type(5), & tbody td:nth-of-type(5)": {
                textAlign: "right",
                paddingRight: 3.5,        // 약 28px
              },
              "& thead th:nth-of-type(5) .MuiTableSortLabel-root": {
                width: "100%",
                justifyContent: "flex-end",
              },
              "& thead th:nth-of-type(5) .MuiTableSortLabel-icon": {
                position: "absolute",
                right: 12,
              },

              // ⑥ 상태 / ⑦ 미리보기: 살짝 왼쪽으로
              "& thead th:nth-of-type(6), & tbody td:nth-of-type(6)": { paddingLeft: 1 },
              "& thead th:nth-of-type(7), & tbody td:nth-of-type(7)": { paddingLeft: 1 },

              // ⑧ 보기 / ⑨ 편집: 가운데 정렬, 고정폭(헤더/바디 동일)
              "& thead th:nth-of-type(7), & tbody td:nth-of-type(7), \
                 & thead th:nth-of-type(9), & tbody td:nth-of-type(9)": {
                textAlign: "center",
                paddingLeft: 0.5,
                paddingRight: 0.5,
              },
              "& tbody td:nth-of-type(5)": {
                textAlign: "left !important",
                transform: "translateX(8px)",   // 숫자 바꿔 미세조정: -는 왼쪽, +는 오른쪽
              },

              /* 6열: 상태(바디만) — 왼쪽으로 6px 이동 */
              "& tbody td:nth-of-type(6)": {
                transform: "translateX(-12px)",
              },

              /* 7열: 도면 미리보기(바디만) — 왼쪽으로 8px 이동 */
              "& thead th:nth-of-type(7)": {
                transform: "translateX(-65px)",
              },
            }}
          >
            {/* ✅ 열 너비를 헤더/바디 공통으로 고정 */}
            <colgroup>
              <col style={{ width: 300 }} />  {/* 이름 */}
              <col style={{ width: 140 }} />  {/* 건물 */}
              <col style={{ width: 90 }} />  {/* 층 */}
              <col style={{ width: 100 }} />  {/* 호수 */}
              <col style={{ width: 110 }} />  {/* 정원 */}
              <col style={{ width: 120 }} />  {/* 상태 */}
              <col />                          {/* 도면 미리보기(가변) */}
              {/* <col style={{ width: 48 }} />    보기 */}
              {/* <col style={{ width: 48 }} />    편집 */}
            </colgroup>

            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortBy === "name" ? sortDir : false} sx={{ whiteSpace: "nowrap" }}>
                  <TableSortLabel
                    active={sortBy === "name"}
                    direction={sortBy === "name" ? sortDir : "asc"}
                    onClick={() => toggleSort("name")}
                  >
                    이름
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ whiteSpace: "nowrap" }}>건물</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>층</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>호수</TableCell>

                <TableCell
                  align="right"
                  sortDirection={sortBy === "capacity" ? sortDir : false}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <TableSortLabel
                    active={sortBy === "capacity"}
                    direction={sortBy === "capacity" ? sortDir : "asc"}
                    onClick={() => toggleSort("capacity")}
                  >
                    정원
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ whiteSpace: "nowrap" }}>상태</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>도면 미리보기</TableCell>

                {/* 보기/편집 열 헤더(빈칸) → 열 개수 맞춤용 */}
                {/* <TableCell sx={{ whiteSpace: "nowrap" }} />
                <TableCell sx={{ whiteSpace: "nowrap" }} /> */}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width="60%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell align="right"><Skeleton width="30%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="80%" /></TableCell>
                    {/* <TableCell><Skeleton width={24} /></TableCell>
                    <TableCell><Skeleton width={24} /></TableCell> */}
                  </TableRow>
                ))
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box sx={{ textAlign: "center", py: 6 }}>
                      <Typography sx={{ fontSize: 48, color: "action.disabled" }}>🏢</Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>등록된 회의실이 없습니다</Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>새 회의실을 추가해보세요.</Typography>
                      <Button variant="contained" onClick={() => { setOpenCreate(true); }}>회의실 생성</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((r) => {
                  const filename = extractFilename(r.detailLocation ?? "");
                  const isSvg = !!filename && /\.svg$/i.test(filename);
                  const svgMarkup = svgMap[r.roomId];

                  return (
                    <TableRow
                      key={r.roomId}
                      hover
                      sx={{ "&:hover": { background: "action.hover" } }}
                      onClick={() => setDetailRoomId(r.roomId)}
                      data-room-id={r.roomId}
                      data-room-name={r.roomName}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.roomName}</Typography>
                      </TableCell>

                      <TableCell>{r.buildingName || "-"}</TableCell>
                      <TableCell>{r.floor || "-"}</TableCell>
                      <TableCell>{r.roomNo || "-"}</TableCell>

                      <TableCell /* align="left" 생략해도 기본값이 left */>
                        {r.capacity ?? "-"}
                      </TableCell>

                      <TableCell>
                        <Chip size="small" label={r.status} color={r.status === "ACTIVE" ? "success" : "default"} />
                      </TableCell>

                      {/* 도면 미리보기 */}
                      <TableCell sx={{ verticalAlign: "top" }}>
  {/* ⬇️ 컨테이너: flex → inline-flex 로 변경, 폭을 컨텐츠에 맞춤 */}
  <Box
    sx={{
      display: "inline-flex",        // ← 핵심: 컨텐츠만큼만 차지
      alignItems: "flex-start",
      gap: 1,
      width: "auto",
      maxWidth: "100%",
    }}
  >
    {/* 썸네일 박스 (고정 160x100) */}
    <Box
      sx={{
        width: 160,
        height: 100,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#f8fafc",
        border: "1px solid #eef2f7",
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",            // ← 썸네일도 커지지 않게
      }}
    >
      {isSvg ? (
        svgMarkup === undefined ? (
          <Skeleton variant="rectangular" width="80%" height={48} />
        ) : svgMarkup === null ? (
          <Typography variant="caption" color="error">SVG 로드 실패</Typography>
        ) : (
          <>
            <div
              key={`${r.roomId}-${filename}`}
              style={{ width: "100%", height: "100%", display: "block" }}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
            <style>{`td div svg { max-width: 100%; height: 100%; }`}</style>
          </>
        )
      ) : (
        <MapIcon color="action" />
      )}
    </Box>

    {/* 오른쪽 액션 영역: 절대로 늘어나지 않게 */}
    <Box
      sx={{
        flex: "0 0 auto",            // ← 핵심: 남는 공간을 먹지 말 것
        minWidth: "auto",
        display: "inline-flex",
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
        <Tooltip title="상세 보기">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setDetailOpen(true); setDetailRoomId(r.roomId); }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="편집">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEditRoomId(r.roomId);
              setOpenCreate(true);
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('div[role="dialog"] input:not([type="checkbox"]):not([type="radio"])');
                input?.focus();
              }, 220);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  </Box>
</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={sortedItems.length}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1 }}
          />
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <RoomCreateDialog
        open={openCreate}
        onClose={() => { setOpenCreate(false); setEditRoomId(null); }}
        onSubmit={handleSubmit}
        mode={editRoomId ? "edit" : "create"}
        editRoomId={editRoomId ?? undefined}
      />

      <RoomDetailDialog
        roomId={detailRoomId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEditRoom={(rid) => {
          setDetailOpen(false);
          setEditRoomId(rid);
          setOpenCreate(true);
          setTimeout(() => { const input = document.querySelector<HTMLInputElement>('div[role="dialog"] input:not([type="checkbox"]):not([type="radio"])'); input?.focus(); }, 220);
        }}
        onDeleted={async () => {
          setDetailOpen(false);
          await load();
          setSnack({ open: true, msg: "삭제되었습니다.", severity: "success" });
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity ?? "info"} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
