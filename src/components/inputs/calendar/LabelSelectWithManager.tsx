// src/components/inputs/calendar/LabelSelectWithManager.tsx
import { useCallback, useEffect, useState } from "react";
import {
  FormControl, Select, MenuItem, OutlinedInput, InputAdornment, IconButton, InputLabel, Box
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LabelManagerDialog from "../../dialogs/calendar/LabelManagerDialog";
import type { Label } from "../../../types/calendar/calendar";
import { fetchLabels } from "../../../api/labelApi";

function SwatchDot({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: "50%",
      bgcolor: color, border: "1px solid rgba(0,0,0,0.18)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
    }} />
  );
}

export default function LabelSelectWithManager({
  value, onChange,
}: {
  value: Label | null;
  onChange: (label: Label | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);

  const loadLabels = useCallback(async () => {
    try {
      const list = await fetchLabels();
      setLabels(list);
    } catch {
      setLabels([]);
    }
  }, []);

  useEffect(() => { loadLabels(); }, [loadLabels]);
  const handleCloseDialog = () => { setOpen(false); loadLabels(); };

  const renderSelected = (selectedId: unknown) => {
    if (selectedId === "" || selectedId === null || selectedId === undefined) return <em>없음</em>;
    const picked = labels.find(l => l.labelId === Number(selectedId));
    if (!picked) return <em>없음</em>;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SwatchDot color={picked.labelColor} size={14} />
        {picked.labelName}
      </Box>
    );
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="label-select-inline">라벨</InputLabel>
        <Select
          labelId="label-select-inline"
          label="라벨"
          value={value?.labelId ?? ""}
          onOpen={loadLabels}
          onChange={(e) => {
            const id = Number(e.target.value) || 0;
            const picked = labels.find(l => l.labelId === id) ?? null;
            onChange(picked);
          }}
          input={
            <OutlinedInput
              label="라벨"
              startAdornment={
                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                  <IconButton
                    size="small"
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onClick={(ev) => { ev.stopPropagation(); setOpen(true); }}
                    title="라벨 검색/관리"
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              }
            />
          }
          renderValue={renderSelected}
          MenuProps={{ PaperProps: { style: { maxHeight: 360 } } }}
        >
          <MenuItem value="">
            <em>없음</em>
          </MenuItem>
          {labels.map((l) => (
            <MenuItem key={l.labelId} value={l.labelId}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SwatchDot color={l.labelColor} size={14} />
                {l.labelName}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <LabelManagerDialog
        open={open}
        onClose={handleCloseDialog}
        onPick={(l) => onChange(l)}
        initialSelectedId={value?.labelId ?? null}
      />
    </>
  );
}
