import React, { useEffect, useState } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogActions,
  DialogContent, DialogTitle, List, ListItemButton,
  ListItemIcon, ListItemText, TextField,
} from "@mui/material";
import type { chatProfile } from "../../types/chat"; // 채팅 유저 타입
import { api } from "../../api/coreflowApi"; // 채팅 유저 API

// 디바운스 훅 (검색어 입력 시 API 호출 지연)
function useDebounce<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// 이 컴포넌트가 받을 props 타입
export type ChatPeoplePickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (picked: chatProfile[]) => void;
  initialSelected?: chatProfile[];
  excludeNos?: number[]; // 목록에서 제외할 사용자 번호 (나 자신 등)
};

export default function ChatPeoplePickerDialog({
  open, onClose, onConfirm, initialSelected = [], excludeNos = []
}: ChatPeoplePickerDialogProps) {
  
  const [q, setQ] = useState("");
  const debouncedQuery = useDebounce(q, 250);

  const [searchedUsers, setSearchedUsers] = useState<chatProfile[]>([]);
  const [selected, setSelected] = useState<Map<number, chatProfile>>(new Map());

  // 모달이 열릴 때 초기 선택된 사용자 목록을 복원
  useEffect(() => {
    if (!open) return;
    const map = new Map<number, chatProfile>();
    initialSelected.forEach((m) => map.set(m.userNo, m));
    setSelected(map);
  }, [initialSelected, open]);

  // 사용자 검색 실행 (검색어가 바뀔 때마다)
  useEffect(() => {
    if (!open) return;
    // 채팅 가능한 전체 유저를 불러오는 API (백엔드에 /chatting/user가 이미 존재)
    api.get<chatProfile[]>('/chatting/searchUser', { params: { query: debouncedQuery } })
      .then(res => {
        // 제외할 유저(excludeNos)와 이미 선택된 유저를 제외하고 목록 필터링
        const availableUsers = res.data.filter(
          (user) => !excludeNos.includes(user.userNo)
        );
        setSearchedUsers(availableUsers);
      })
      .catch(() => setSearchedUsers([]));
  }, [open, debouncedQuery, excludeNos]);

  // 사용자 선택/해제 함수
  const toggle = (user: chatProfile) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.userNo)) {
        next.delete(user.userNo);
      } else {
        next.set(user.userNo, user);
      }
      return next;
    });
  };

  // '선택 완료' 버튼 클릭 시
  const handleConfirm = () => onConfirm(Array.from(selected.values()));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>채팅 참여자 선택</DialogTitle>
      <DialogContent>
        {/* 검색 UI */}
        <Box sx={{ p: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="이름 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Box>

        {/* 사용자 목록 */}
        <Box sx={{ height: 320, overflow: "auto" }}>
          <List dense>
            {searchedUsers.map((user) => {
              const isChecked = selected.has(user.userNo);
              return (
                <ListItemButton key={user.userNo} onClick={() => toggle(user)}>
                  <ListItemIcon>
                    <Checkbox edge="start" checked={isChecked} />
                  </ListItemIcon>
                  <ListItemText primary={user.userName} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleConfirm}>
          선택 완료
        </Button>
      </DialogActions>
    </Dialog>
  );
}