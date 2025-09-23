import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { Room, RoomStatus } from "../../types/rooms/room";
import { fetchRooms, createRoom } from "../../api/roomApi";
import RoomCreateDialog from "./RoomCreateDialog";
import RoomDetailDrawer from "./RoomDetailDrawer";

export default function RoomList() {
    const [items, setItems] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<{ buildingName?: string; floor?: string; status?: RoomStatus | ""; minCapacity?: number | "" }>({ status: "" });
    const [openCreate, setOpenCreate] = useState(false);
    const [detailRoomId, setDetailRoomId] = useState<number | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchRooms({
                buildingName: filters.buildingName || undefined,
                floor: filters.floor || undefined,
                status: (filters.status || undefined) as RoomStatus | undefined,
                minCapacity: typeof filters.minCapacity === "number" ? filters.minCapacity : undefined,
            });
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (form: Parameters<typeof createRoom>[0]) => {
        await createRoom(form);
        setOpenCreate(false);
        await load();
    };
    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField label="건물" size="small" value={filters.buildingName || ""} onChange={(e) => setFilters(f => ({ ...f, buildingName: e.target.value }))} />
                <TextField label="층" size="small" value={filters.floor || ""} onChange={(e) => setFilters(f => ({ ...f, floor: e.target.value }))} />
                <TextField select label="상태" size="small" sx={{ minWidth: 140 }} value={filters.status || ""} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}>
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </TextField>
                <TextField type="number" label="최소 정원" size="small" value={filters.minCapacity ?? ""} onChange={(e) => setFilters(f => ({ ...f, minCapacity: e.target.value === "" ? "" : Number(e.target.value) }))} />
                <Button variant="outlined" onClick={load} disabled={loading}>검색</Button>
                <Box flex={1} />
                <Button variant="contained" onClick={() => setOpenCreate(true)}>회의실 생성</Button>
            </Stack>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>이름</TableCell>
                        <TableCell>건물</TableCell>
                        <TableCell>층</TableCell>
                        <TableCell>호수</TableCell>
                        <TableCell align="right">정원</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>상세/이미지</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((r) => (
                        <TableRow key={r.roomId} hover>
                            <TableCell>{r.roomName}</TableCell>
                            <TableCell>{r.buildingName || "-"}</TableCell>
                            <TableCell>{r.floor || "-"}</TableCell>
                            <TableCell>{r.roomNo || "-"}</TableCell>
                            <TableCell align="right">{r.capacity ?? "-"}</TableCell>
                            <TableCell>
                                <Chip size="small" label={r.status} color={r.status === "ACTIVE" ? "success" : "default"} />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.detailLocation || "-"}
                            </TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={7}><Typography color="text.secondary">데이터가 없습니다.</Typography></TableCell></TableRow>
                    )}
                </TableBody>
            </Table>

            <RoomCreateDialog open={openCreate} onClose={() => setOpenCreate(false)} onSubmit={handleCreate} />

            <RoomDetailDrawer roomId={detailRoomId} open={detailOpen} onClose={() => setDetailOpen(false)} />
        </Box>
    );
}