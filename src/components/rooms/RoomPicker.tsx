import { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { fetchRooms } from "../../api/roomApi";
import type { Room } from "../../types/rooms/room";

export default function RoomPicker({
    value,
    onChange,
    minCapacity,
}: {
    value?: number | null; // roomId
    onChange: (roomId: number | null) => void;
    minCapacity?: number;
}) {
    const [options, setOptions] = useState<Room[]>([]);

    useEffect(() => {
        fetchRooms({ status: "ACTIVE", minCapacity }).then(setOptions);
    }, [minCapacity]);

    const selected = useMemo(() => options.find(o => o.roomId === value) || null, [options, value]);

    return (
        <Autocomplete
            options={options}
            value={selected}
            onChange={(_, v) => onChange(v ? v.roomId : null)}
            getOptionLabel={(o) => `${o.roomName}${o.roomNo ? ` (${o.roomNo})` : ""}`}
            renderInput={(params) => <TextField {...params} label="회의실" placeholder="회의실 검색" />}
            sx={{ minWidth: 260 }}
            isOptionEqualToValue={(a, b) => a.roomId === b.roomId}
        />
    );
}