// src/components/dialogs/calendar/LabelManagerDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, List, ListItem, ListItemText, ListItemAvatar,
  IconButton, Stack, Divider, Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import type { Label } from "../../../types/calendar/calendar";
import { fetchLabels, createLabel, updateLabel, deleteLabel } from "../../../api/labelApi";

function SwatchDot({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: "50%",
      bgcolor: color, border: "1px solid rgba(0,0,0,0.18)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
    }} />
  );
}

export default function LabelManagerDialog({
  open, onClose, onPick, initialSelectedId = null,
}: {
  open: boolean;
  onClose: () => void;
  onPick?: (label: Label | null) => void;
  initialSelectedId?: number | null;
}) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Label | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [formOpen, setFormOpen] = useState(false);

  const selected = useMemo(() => labels.find((l) => l.labelId === selectedId) ?? null, [labels, selectedId]);

  async function reload() {
    try {
      setLoading(true);
      const data = await fetchLabels();
      setLabels(data);
      if (selectedId && !data.some((d) => d.labelId === selectedId)) setSelectedId(null);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "라벨 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setFormOpen(false);
      reload();
    }
  }, [open]);

  const handleStartEdit = (label: Label) => {
    setEditing(label);
    setName(label.labelName);
    setColor(label.labelColor);
    setFormOpen(true);
  };
  const handleStartAdd = () => {
    setEditing(null);
    setName("");
    setColor("#64748b");
    setFormOpen(true);
  };
  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateLabel(editing.labelId, { labelName: name.trim(), labelColor: color });
      } else {
        const created = await createLabel({ labelName: name.trim(), labelColor: color });
        setSelectedId(created.labelId);
      }
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "저장 실패");
      return;
    }
    setEditing(null);
    setName("");
    setColor("#64748b");
    setFormOpen(false);
  };
  const handleDelete = async (label: Label) => {
    if (!confirm(`'${label.labelName}' 라벨을 삭제할까요?`)) return;
    try {
      await deleteLabel(label.labelId);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "삭제 실패");
    }
  };
  const handlePick = () => { onPick?.(selected ?? null); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        라벨 관리
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={handleStartAdd}>새 라벨 추가</Button>
        </Stack>

        {formOpen && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TextField label="라벨 이름" value={name} onChange={(e) => setName(e.target.value)} size="small" />
            <TextField label="색상" type="color" value={color} onChange={(e) => setColor(e.target.value)} size="small" sx={{ width: 100 }} />
            <Button variant="contained" onClick={handleSave}>저장</Button>
            <Button variant="text" onClick={() => { setEditing(null); setName(""); setFormOpen(false); }}>취소</Button>
          </Stack>
        )}

        <List dense>
          {labels.map((l) => (
            <React.Fragment key={l.labelId}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={() => setSelectedId(l.labelId)} title="선택"><CheckIcon /></IconButton>
                    <IconButton onClick={() => handleStartEdit(l)} title="수정"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(l)} title="삭제"><DeleteIcon /></IconButton>
                  </Stack>
                }
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <SwatchDot color={l.labelColor} />
                </ListItemAvatar>
                <ListItemText primary={l.labelName} secondary={`${l.labelColor}${selectedId === l.labelId ? " (선택됨)" : ""}`} />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
          {!loading && labels.length === 0 && (
            <ListItem><ListItemText primary="라벨이 없습니다. '새 라벨 추가'를 눌러 만들어주세요." /></ListItem>
          )}
        </List>

        {error && <Stack sx={{ mt: 1, color: "error.main" }}>{error}</Stack>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" onClick={handlePick} disabled={!selected}>선택 적용</Button>
      </DialogActions>
    </Dialog>
  );
}
