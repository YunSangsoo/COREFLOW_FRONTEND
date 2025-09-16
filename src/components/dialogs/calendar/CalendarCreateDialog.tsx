// src/components/dialogs/calendar/CalendarCreateDialog.tsx
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Select, MenuItem, InputLabel, FormControl, Button
} from "@mui/material";
import {
  COLOR_PALETTE, DEFAULT_ROLE_OPTIONS, DEFAULT_ROLE_LABELS, isValidHexColor
} from "../../../constants/calendar/calendar";
import type { CalendarDefaultRole } from "../../../types/calendar/calendar";

export default function CalendarCreateDialog({
  open, onClose, onSubmit,
  init = { name: "", color: "#4096ff", defaultRole: "READER" },
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: { name: string; color: string; defaultRole: CalendarDefaultRole }) => void;
  init?: { name: string; color: string; defaultRole: CalendarDefaultRole };
}) {
  const [form, setForm] = useState(init);
  const [err, setErr] = useState<{ name?: string; color?: string }>({});

  React.useEffect(() => {
    if (open) { setForm(init); setErr({}); }
  }, [open, init]);

  const handleSave = () => {
    const name = form.name.trim();
    const color = form.color.trim().toUpperCase();
    const nextErr: typeof err = {};
    if (!name) nextErr.name = "캘린더 이름을 입력하세요.";
    if (!isValidHexColor(color)) nextErr.color = "색상은 #RRGGBB 형식이어야 합니다.";
    setErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;
    onSubmit({ name, color, defaultRole: form.defaultRole });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>새 캘린더 만들기</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
        <TextField
          label="캘린더 이름"
          value={form.name}
          onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); if (err.name) setErr(p => ({ ...p, name: undefined })); }}
          error={!!err.name}
          helperText={err.name}
          autoFocus
          fullWidth
        />

        <Box sx={{ display: "grid", gap: 1 }}>
          <Box sx={{ fontSize: 14, color: "#6b7280" }}>색상</Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 28px)", gap: "8px 10px", alignItems: "center" }}>
            {COLOR_PALETTE.map((hex) => {
              const selected = form.color.toUpperCase() === hex.toUpperCase();
              return (
                <Box key={hex} role="button" aria-label={`색상 ${hex}`}
                  onClick={() => { setForm(f => ({ ...f, color: hex })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
                  sx={{ width: 28, height: 28, borderRadius: "50%", border: selected ? "3px solid #111827" : "1px solid #d1d5db", boxShadow: selected ? "0 0 0 2px #dbeafe" : "none", background: hex, cursor: "pointer" }}
                  title={hex}
                />
              );
            })}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <input
              type="color"
              value={form.color}
              onChange={(e) => { setForm(f => ({ ...f, color: e.target.value })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
              style={{ width: 44, height: 30, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
              aria-label="색상 선택기"
            />
            <TextField
              size="small"
              label="#RRGGBB"
              value={form.color}
              onChange={(e) => { setForm(f => ({ ...f, color: e.target.value })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
              error={!!err.color}
              helperText={err.color}
              sx={{ width: 140 }}
            />
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid #d1d5db", background: form.color }} />
          </Box>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="default-role-label">기본 권한</InputLabel>
          <Select
            labelId="default-role-label"
            label="기본 권한"
            value={form.defaultRole}
            onChange={(e) => setForm(f => ({ ...f, defaultRole: e.target.value as CalendarDefaultRole }))}
          >
            {DEFAULT_ROLE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{DEFAULT_ROLE_LABELS[opt]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSave}>만들기</Button>
      </DialogActions>
    </Dialog>
  );
}
