// // c:/FinalProject_Front/src/components/rooms/RoomList.tsx
// import { useEffect, useMemo, useState } from "react";
// import {
//   Box, Button, Chip, MenuItem, Stack, Paper,
//   Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
//   InputAdornment, IconButton, Skeleton, Tooltip, TablePagination,
//   useTheme, useMediaQuery, Snackbar, Alert
// } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";
// import ClearIcon from "@mui/icons-material/Clear";
// import VisibilityIcon from "@mui/icons-material/Visibility";
// import EditIcon from "@mui/icons-material/Edit";
// import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
// import HeightIcon from "@mui/icons-material/Height";

// import type { Room, RoomStatus, RoomCreateReq, RoomUpdateReq } from "../../types/rooms/room";
// import { fetchRooms, createRoom, updateRoom } from "../../api/roomApi";
// import RoomCreateDialog from "./RoomCreateDialog";
// import RoomDetailDialog from "./RoomDetailDialog";

// export default function RoomList() {
//   const theme = useTheme();
//   const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

//   const [items, setItems] = useState<Room[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [filters, setFilters] = useState<{
//     buildingName?: string;
//     floor?: string;
//     status?: RoomStatus | "";
//     minCapacity?: number | "";
//   }>({ status: "" });

//   // quickQuery (debounce input)
//   const [quickQuery, setQuickQuery] = useState("");

//   // 생성/수정 모달
//   const [openCreate, setOpenCreate] = useState(false);
//   const [editRoomId, setEditRoomId] = useState<number | null>(null);

//   // 상세 다이얼로그
//   const [detailRoomId, setDetailRoomId] = useState<number | null>(null);
//   const [detailOpen, setDetailOpen] = useState(false);

//   // pagination & sorting
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [sortBy, setSortBy] = useState<null | "name" | "capacity">("name");
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

//   // snackbar
//   const [snack, setSnack] = useState<{ open: boolean; msg?: string; severity?: "success" | "error" | "info" }>({ open: false });

//   // 스크롤
//   const scrollToRoom = (roomId?: number, roomName?: string) => {
//   // 시도: id 우선, 없으면 name으로 찾음
//   let sel: HTMLElement | null = null;
//   if (typeof roomId === "number") {
//     sel = document.querySelector<HTMLElement>(`[data-room-id="${roomId}"]`);
//   }
//   if (!sel && roomName) {
//     sel = Array.from(document.querySelectorAll<HTMLElement>('[data-room-name]'))
//       .find(el => el.getAttribute('data-room-name') === roomName) ?? null;
//   }
//   if (sel) {
//     sel.scrollIntoView({ behavior: "smooth", block: "center" });
//     // 잠깐 하이라이트(제품스러운 효과)
//     sel.animate(
//       [{ boxShadow: "0 0 0 0 rgba(59,130,246,0.0)" }, { boxShadow: "0 0 0 6px rgba(59,130,246,0.12)" }, { boxShadow: "0 0 0 0 rgba(59,130,246,0.0)" }],
//       { duration: 1200 }
//     );
//   }
// }

//   // helper load: accepts optional overrides to avoid race with setState
//   const load = async (override?: Partial<typeof filters>) => {
//     setLoading(true);
//     try {
//       const finalFilters = { ...filters, ...(override ?? {}) };
//       const data = await fetchRooms({
//         buildingName: finalFilters.buildingName || undefined,
//         floor: finalFilters.floor || undefined,
//         status: (finalFilters.status || undefined) as RoomStatus | undefined,
//         minCapacity:
//           typeof finalFilters.minCapacity === "number" ? finalFilters.minCapacity : undefined,
//       });
//       setItems(Array.isArray(data) ? data : []);
//       setSnack({ open: false }); // clear snack
//     } catch (e: any) {
//       setSnack({ open: true, msg: e?.message ?? "조회 실패", severity: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void load();
//     // eslint-disable-next-line
//   }, []);

//   // debounce quickQuery -> apply to buildingName + auto load
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setPage(0);
//       void load({ ...filters, buildingName: quickQuery });
//       setFilters(f => ({ ...f, buildingName: quickQuery }));
//     }, 350);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [quickQuery]);

//   // create/update handler
//   const handleSubmit = async (form: RoomCreateReq) => {
//   try {
//     if (editRoomId) {
//       const updateBody: RoomUpdateReq = { ...form } as RoomUpdateReq;
//       await updateRoom(editRoomId, updateBody);
//       setSnack({ open: true, msg: "회의실이 수정되었습니다.", severity: "success" });
//       await load();
//       // 스크롤/하이라이트: 편집 시 편집한 항목으로 이동
//       scrollToRoom(editRoomId);
//     } else {
//       const res = await createRoom(form);
//       setSnack({ open: true, msg: "회의실이 생성되었습니다.", severity: "success" });
//       await load();
//       // res가 새 id를 반환하면 그걸 사용, 아니면 이름으로 찾아 스크롤
//       const newId = (res as any)?.roomId ?? (res as any)?.id ?? undefined;
//       if (newId) scrollToRoom(Number(newId));
//       else scrollToRoom(undefined, form.roomName);
//     }
//     setOpenCreate(false);
//     setEditRoomId(null);
//   } catch (e: any) {
//     setSnack({ open: true, msg: e?.message ?? "저장 실패", severity: "error" });
//   }
// };

//   const openDetail = (roomId: number) => {
//     setDetailRoomId(roomId);
//     setDetailOpen(true);
//   };

//   // sorting helper
//   const sortedItems = useMemo(() => {
//     const copy = [...items];
//     if (sortBy === "name") {
//       copy.sort((a, b) => {
//         const r = (a.roomName ?? "").localeCompare(b.roomName ?? "");
//         return sortDir === "asc" ? r : -r;
//       });
//     } else if (sortBy === "capacity") {
//       copy.sort((a, b) => {
//         const r = (Number(a.capacity ?? 0) - Number(b.capacity ?? 0));
//         return sortDir === "asc" ? r : -r;
//       });
//     }
//     return copy;
//   }, [items, sortBy, sortDir]);

//   // pagination slice
//   const visibleRows = useMemo(() => {
//     const start = page * rowsPerPage;
//     return sortedItems.slice(start, start + rowsPerPage);
//   }, [sortedItems, page, rowsPerPage]);

//   // clear filters
//   const clearFilters = () => {
//     setFilters({ status: "" });
//     setQuickQuery("");
//     setPage(0);
//     void load({ status: "", buildingName: "", floor: "", minCapacity: "" });
//   };

//   // header sort toggle
//   const toggleSort = (key: "name" | "capacity") => {
//     if (sortBy === key) {
//       setSortDir(d => (d === "asc" ? "desc" : "asc"));
//     } else {
//       setSortBy(key);
//       setSortDir("asc");
//     }
//     setPage(0);
//   };

//   return (
//     <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
//       {/* 상단 필터 바 (Box + Stack 레이아웃, Grid 대신) */}
//       <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
//         <Box sx={{ display: "flex", flex: 1, gap: 1, flexWrap: "wrap", alignItems: "center" }}>
//           <TextField
//             label="건물"
//             size="small"
//             value={filters.buildingName || ""}
//             onChange={(e) => {
//               const v = e.target.value;
//               setQuickQuery(v);
//             }}
//             sx={{ minWidth: 140 }}
//             InputProps={{
//               startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
//               endAdornment: filters.buildingName ? (
//                 <InputAdornment position="end">
//                   <IconButton size="small" onClick={() => { setQuickQuery(""); setFilters(f => ({ ...f, buildingName: "" })); void load({ ...filters, buildingName: "" }); }}>
//                     <ClearIcon fontSize="small" />
//                   </IconButton>
//                 </InputAdornment>
//               ) : null
//             }}
//             placeholder="자동 검색: 건물명 입력"
//           />

//           <TextField
//             label="층"
//             size="small"
//             value={filters.floor || ""}
//             onChange={(e) => setFilters((f) => ({ ...f, floor: e.target.value }))}
//             sx={{ minWidth: 100 }}
//           />

//           <TextField
//             select
//             label="상태"
//             size="small"
//             sx={{ minWidth: 140 }}
//             value={filters.status || ""}
//             onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
//           >
//             <MenuItem value="">전체</MenuItem>
//             <MenuItem value="ACTIVE">ACTIVE</MenuItem>
//             <MenuItem value="INACTIVE">INACTIVE</MenuItem>
//           </TextField>

//           <TextField
//             type="number"
//             label="최소 정원"
//             size="small"
//             value={filters.minCapacity ?? ""}
//             onChange={(e) =>
//               setFilters((f) => ({
//                 ...f,
//                 minCapacity: e.target.value === "" ? "" : Number(e.target.value),
//               }))
//             }
//             sx={{ width: 120 }}
//           />

//           <Button variant="outlined" onClick={() => { setPage(0); void load(); }} disabled={loading}>
//             검색
//           </Button>

//           <Button variant="text" onClick={clearFilters} sx={{ ml: 1 }}>
//             초기화
//           </Button>
//         </Box>

//         <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, width: { xs: "100%", sm: "auto" } }}>
//           <Button
//             variant="contained"
//             onClick={() => {
//               setEditRoomId(null); // 생성 모드
//               setOpenCreate(true);
//             }}
//           >
//             회의실 생성
//           </Button>
//         </Box>
//       </Stack>

//       {/* 활성 필터 요약 */}
//       <Box sx={{ mb: 2 }}>
//         <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
//           <Typography variant="body2" color="text.secondary">활성 필터:</Typography>
//           {filters.buildingName ? <Chip label={`건물: ${filters.buildingName}`} size="small" /> : null}
//           {filters.floor ? <Chip label={`층: ${filters.floor}`} size="small" /> : null}
//           {filters.status ? <Chip label={`상태: ${filters.status}`} size="small" /> : null}
//           {typeof filters.minCapacity === "number" ? <Chip label={`최소정원: ${filters.minCapacity}`} size="small" /> : null}
//           {!filters.buildingName && !filters.floor && !filters.status && filters.minCapacity === "" && (
//             <Typography variant="body2" color="text.secondary">없음</Typography>
//           )}
//         </Stack>
//       </Box>

//       {/* 모바일: 카드형 리스트 */}
//       {isSmall ? (
//         <Stack spacing={1}>
//           {loading ? (
//             Array.from({ length: 4 }).map((_, i) => (
//               <Paper key={i} variant="outlined" sx={{ p: 2 }}>
//                 <Skeleton width="40%" height={24} />
//                 <Skeleton width="60%" />
//                 <Skeleton width="30%" />
//               </Paper>
//             ))
//           ) : items.length === 0 ? (
//             <Box sx={{ textAlign: "center", py: 6 }}>
//               <Typography sx={{ fontSize: 48, color: "action.disabled" }}>🏢</Typography>
//               <Typography variant="h6" sx={{ mt: 1 }}>등록된 회의실이 없습니다</Typography>
//               <Typography color="text.secondary" sx={{ mb: 2 }}>새 회의실을 추가해보세요.</Typography>
//               <Button variant="contained" onClick={() => { setOpenCreate(true); }}>회의실 생성</Button>
//             </Box>
//           ) : (
//             items.map((r) => (
//               <Paper key={r.roomId} variant="outlined" sx={{ p: 2 }}>
//                 <Stack direction="row" justifyContent="space-between" alignItems="center">
//                   <Box>
//                     <Typography sx={{ fontWeight: 700 }}>{r.roomName}</Typography>
//                     <Typography variant="caption" color="text.secondary">
//                       {r.buildingName || "-"} · {r.floor || "-"}층 · {r.roomNo || "-"}
//                     </Typography>
//                   </Box>
//                   <Stack direction="row" spacing={0.5}>
//                     <Tooltip title="상세 보기">
//                       <IconButton size="small" onClick={() => openDetail(r.roomId)}>
//                         <VisibilityIcon fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="편집">
//                       <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditRoomId(r.roomId); setOpenCreate(true); }}>
//                         <EditIcon fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                   </Stack>
//                 </Stack>
//               </Paper>
//             ))
//           )}
//         </Stack>
//       ) : (
//         // 데스크탑: 테이블
//         <Box sx={{ width: "100%", overflow: "auto" }}>
//           <Table size="small" sx={{ minWidth: 900 }}>
//             <TableHead>
//               <TableRow>
//                 <TableCell>
//                   <Stack direction="row" alignItems="center" spacing={1}>
//                     이름
//                     <Tooltip title="정렬">
//                       <IconButton size="small" onClick={() => toggleSort("name")}>
//                         <SortByAlphaIcon fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                   </Stack>
//                 </TableCell>
//                 <TableCell>건물</TableCell>
//                 <TableCell>층</TableCell>
//                 <TableCell>호수</TableCell>
//                 <TableCell align="right">
//                   <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
//                     정원
//                     <Tooltip title="정렬">
//                       <IconButton size="small" onClick={() => toggleSort("capacity")}>
//                         <HeightIcon fontSize="small" />
//                       </IconButton>
//                     </Tooltip>
//                   </Stack>
//                 </TableCell>
//                 <TableCell>상태</TableCell>
//                 <TableCell>상세/위치</TableCell>
//               </TableRow>
//             </TableHead>

//             <TableBody>
//               {loading ? (
//                 Array.from({ length: rowsPerPage }).map((_, i) => (
//                   <TableRow key={i}>
//                     <TableCell><Skeleton width="60%" /></TableCell>
//                     <TableCell><Skeleton width="40%" /></TableCell>
//                     <TableCell><Skeleton width="40%" /></TableCell>
//                     <TableCell><Skeleton width="40%" /></TableCell>
//                     <TableCell align="right"><Skeleton width="30%" /></TableCell>
//                     <TableCell><Skeleton width="40%" /></TableCell>
//                     <TableCell><Skeleton width="80%" /></TableCell>
//                   </TableRow>
//                 ))
//               ) : visibleRows.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7}>
//                     <Box sx={{ textAlign: "center", py: 6 }}>
//                       <Typography sx={{ fontSize: 48, color: "action.disabled" }}>🏢</Typography>
//                       <Typography variant="h6" sx={{ mt: 1 }}>등록된 회의실이 없습니다</Typography>
//                       <Typography color="text.secondary" sx={{ mb: 2 }}>새 회의실을 추가해보세요.</Typography>
//                       <Button variant="contained" onClick={() => { setOpenCreate(true); }}>회의실 생성</Button>
//                     </Box>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 visibleRows.map((r) => (
//                   <TableRow key={r.roomId} hover sx={{ "&:hover": { background: "action.hover" } }} onClick={() => openDetail(r.roomId)}>
//                     <TableCell sx={{ width: 240 }}>{r.roomName}</TableCell>
//                     <TableCell sx={{ width: 140 }}>{r.buildingName || "-"}</TableCell>
//                     <TableCell sx={{ width: 100 }}>{r.floor || "-"}</TableCell>
//                     <TableCell sx={{ width: 100 }}>{r.roomNo || "-"}</TableCell>
//                     <TableCell align="right">{r.capacity ?? "-"}</TableCell>
//                     <TableCell>
//                       <Chip size="small" label={r.status} color={r.status === "ACTIVE" ? "success" : "default"} />
//                     </TableCell>
//                     <TableCell sx={{
//                       maxWidth: 260,
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                       whiteSpace: "nowrap",
//                     }}>
//                       <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
//                         <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pr: 1 }}>
//                           {r.detailLocation || "-"}
//                         </Box>
//                         <Stack direction="row" spacing={0.5}>
//                           <Tooltip title="상세 보기">
//                             <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetail(r.roomId); }}>
//                               <VisibilityIcon fontSize="small" />
//                             </IconButton>
//                           </Tooltip>
//                           <Tooltip title="편집">
//                             <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditRoomId(r.roomId); setOpenCreate(true); }}>
//                               <EditIcon fontSize="small" />
//                             </IconButton>
//                           </Tooltip>
//                         </Stack>
//                       </Stack>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>

//           {/* pagination */}
//           <TablePagination
//             component="div"
//             count={sortedItems.length}
//             page={page}
//             onPageChange={(e, p) => setPage(p)}
//             rowsPerPage={rowsPerPage}
//             onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
//             rowsPerPageOptions={[5, 10, 25, 50]}
//             sx={{ mt: 1 }}
//           />
//         </Box>
//       )}

//       {/* 생성/수정 공용 모달 */}
//       <RoomCreateDialog
//         open={openCreate}
//         onClose={() => {
//           setOpenCreate(false);
//           setEditRoomId(null);
//         }}
//         onSubmit={handleSubmit}
//         mode={editRoomId ? "edit" : "create"}
//         editRoomId={editRoomId ?? undefined}
//       />

//       {/* 상세 다이얼로그: 수정/삭제 연동 */}
//       <RoomDetailDialog
//         roomId={detailRoomId}
//         open={detailOpen}
//         onClose={() => setDetailOpen(false)}
//         onEditRoom={(rid) => {
//           setDetailOpen(false);
//           setEditRoomId(rid);
//           setOpenCreate(true);
//         }}
//         onDeleted={async () => {
//           setDetailOpen(false);
//           await load();
//           setSnack({ open: true, msg: "삭제되었습니다.", severity: "success" });
//         }}
//       />

//       <Snackbar
//         open={snack.open}
//         autoHideDuration={3000}
//         onClose={() => setSnack(s => ({ ...s, open: false }))}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//       >
//         <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity ?? "info"} sx={{ width: "100%" }}>
//           {snack.msg}
//         </Alert>
//       </Snackbar>
//     </Paper>
//   );
// }
