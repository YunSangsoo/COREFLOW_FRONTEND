import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItem, ListItemText,
  IconButton, Stack, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 현재 유형 목록 (예: ["MEETING","LEAVE","TASK"]) */
  value: string[];
  /** 모달 내에서 추가/수정/삭제 후 최종 목록 돌려줌 */
  onChange: (next: string[]) => void;
};

/** 라벨 관리자와 동일 UX: 이름만 있는 간단한 리스트 관리(추가/수정/삭제) */
export default function TypeManagerDialog({ open, onClose, value, onChange }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (open) {
      setItems(value);
      setNewName("");
      setEditingIdx(null);
      setEditingName("");
    }
  }, [open, value]);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    if (items.includes(name)) return alert("이미 존재하는 이름입니다.");
    const next = [name, ...items];
    setItems(next);
    setNewName("");
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditingName(items[idx]);
  };

  const applyEdit = () => {
    if (editingIdx === null) return;
    const name = editingName.trim();
    if (!name) return;
    if (items.some((v, i) => i !== editingIdx && v === name)) return alert("이미 존재하는 이름입니다.");
    const next = items.slice();
    next[editingIdx] = name;
    setItems(next);
    setEditingIdx(null);
    setEditingName("");
  };

  const removeItem = (idx: number) => {
    if (!confirm(`'${items[idx]}' 유형을 삭제할까요?`)) return;
    const next = items.slice();
    next.splice(idx, 1);
    setItems(next);
  };

  const handleClose = () => {
    onChange(items);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        유형 관리
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="새 유형명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem}>
            추가
          </Button>
        </Stack>

        <List dense>
          {items.map((name, idx) => (
            <React.Fragment key={`${name}:${idx}`}>
              <ListItem
                disableGutters
                secondaryAction={
                  editingIdx === idx ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={applyEdit}>저장</Button>
                      <Button size="small" onClick={() => { setEditingIdx(null); setEditingName(""); }}>
                        취소
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={0.5}>
                      <IconButton onClick={() => startEdit(idx)} title="수정"><EditIcon /></IconButton>
                      <IconButton onClick={() => removeItem(idx)} title="삭제"><DeleteIcon /></IconButton>
                    </Stack>
                  )
                }
              >
                {editingIdx === idx ? (
                  <TextField
                    size="small"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    sx={{ width: "70%" }}
                  />
                ) : (
                  <ListItemText primary={name} />
                )}
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
          {items.length === 0 && (
            <ListItem><ListItemText primary="등록된 유형이 없습니다. 상단에서 추가하세요." /></ListItem>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" onClick={handleClose}>변경 적용</Button>
      </DialogActions>
    </Dialog>
  );
}
