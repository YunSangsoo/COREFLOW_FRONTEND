// src/components/rooms/RoomDetailDrawer.tsx
import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, Divider, Stack, Chip } from "@mui/material";
import { fetchRoom } from "../../api/roomApi";
import type { Room } from "../../types/rooms/room";
import FloorPlanSVG from "./FloorPlanSVG";

export default function RoomDetailDrawer({
  roomId, open, onClose,
}: { roomId: number | null; open: boolean; onClose: () => void }) {
  const [room, setRoom] = useState<Room | null>(null);
  useEffect(() => {
    if (open && roomId != null) fetchRoom(roomId).then(setRoom);
  }, [open, roomId]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 720, p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">회의실 상세</Typography>
        <Divider />
        <Stack direction="row" spacing={2}>
          <Typography sx={{ minWidth: 80, color: "text.secondary" }}>이름</Typography>
          <Typography>{room?.roomName ?? "-"}</Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Typography sx={{ minWidth: 80, color: "text.secondary" }}>위치</Typography>
          <Typography>
            {(room?.buildingName ?? "-")} / {(room?.floor ?? "-")} / {(room?.roomNo ?? "-")}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Typography sx={{ minWidth: 80, color: "text.secondary" }}>정원</Typography>
          <Typography>{room?.capacity ?? "-"}</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography sx={{ minWidth: 80, color: "text.secondary" }}>상태</Typography>
          <Chip size="small" label={room?.status ?? "-"} color={room?.status === "ACTIVE" ? "success" : "default"} />
        </Stack>

        <Divider />
        <Typography variant="subtitle1">상세 위치</Typography>
        <Box sx={{ border: "1px solid #eee", borderRadius: 1, p: 1, bgcolor: "background.default" }}>
          <FloorPlanSVG svgUrl={room?.detailLocation || undefined} height={520} />
        </Box>
      </Box>
    </Drawer>
  );
}
