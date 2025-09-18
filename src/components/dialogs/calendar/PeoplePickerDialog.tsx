// src/components/dialogs/calendar/PeoplePickerDialog.tsx
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItemButton,
  Checkbox, ListItemText, Box, Button, ListItem, Typography
} from "@mui/material";

type Department = { depId: number; depName: string; parentId?: number | null };
type Member = { userNo: number; userName: string; email?: string; depId?: number };

export default function PeoplePickerDialog({
  open, mode, departments, members, selected, blockedUserNos = [],
  loadingDepts, loadingMembers,
  onClose, onConfirm, onToggle, onQueryChange, onDeptChange,
}: {
  open: boolean;
  mode: "ATTENDEE" | "SHARER";
  departments: Department[];
  members: Member[];
  selected: Member[];                 // 현재 모드(참여자 또는 공유자)의 선택 목록
  blockedUserNos?: number[];          // 🔹 반대 목록의 userNo 목록(선택 차단용)
  loadingDepts?: boolean;
  loadingMembers?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onToggle: (m: Member) => void;      // 체크/해제 토글
  onQueryChange: (q: string) => void;
  onDeptChange: (depId: number | null) => void;
}) {

  // 간단한 트리 플랫 변환
  const deptTree = React.useMemo(() => {
    const byParent = new Map<number | null | undefined, Department[]>();
    departments.forEach(d => {
      const key = (d.parentId ?? null) as any;
      byParent.set(key, [...(byParent.get(key) || []), d]);
    });
    const rows: Array<{ dep: Department; depth: number }> = [];
    const walk = (parentId: number | null, depth: number) => {
      for (const d of (byParent.get(parentId as any) || [])) {
        rows.push({ dep: d, depth });
        walk(d.depId, depth + 1);
      }
    };
    walk(null, 0);
    return rows;
  }, [departments]);

  const selectedSet = React.useMemo(() => new Set(selected.map(s => s.userNo)), [selected]);
  const blockedSet  = React.useMemo(() => new Set(blockedUserNos), [blockedUserNos]);

  // 🔹 반대 목록에 이미 있다면 "새로 선택"은 불가하지만, 현재 체크된 항목의 해제는 가능해야 함
  const isDisabledToSelect = (userNo: number, isChecked: boolean) =>
    !isChecked && blockedSet.has(userNo);

  const blockedReason =
    mode === "ATTENDEE" ? "공유자로 이미 선택됨" : "참여자로 이미 선택됨";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "ATTENDEE" ? "참석자 선택" : "공유자 선택"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 2, minHeight: 360 }}>
          {/* 왼: 부서 트리 */}
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>부서</Box>
            <List dense disablePadding sx={{ maxHeight: 400, overflow: "auto" }}>
              <ListItemButton selected onClick={() => onDeptChange(null)}>
                <ListItemText primary="전체" />
              </ListItemButton>
              {deptTree.map(({ dep, depth }) => (
                <ListItemButton
                  key={dep.depId}
                  onClick={() => onDeptChange(dep.depId)}
                  sx={{ pl: 2 + depth * 2 }}
                >
                  <ListItemText primary={dep.depName} />
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* 오른: 검색 + 사원 목록 */}
          <Box sx={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="이름/이메일 검색"
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </Box>

            <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
                {loadingMembers ? "불러오는 중…" : "사원 목록"}
              </Box>
              <List dense disablePadding sx={{ maxHeight: 400, overflow: "auto" }}>
                {members.map((m) => {
                  const checked = selectedSet.has(m.userNo);
                  const disabled = isDisabledToSelect(m.userNo, checked);
                  return (
                    <ListItemButton
                      key={m.userNo}
                      onClick={() => { if (!disabled) onToggle(m); }}
                      disabled={disabled}
                    >
                      <Checkbox
                        edge="start"
                        tabIndex={-1}
                        disableRipple
                        checked={checked}
                        disabled={disabled}
                      />
                      <ListItemText
                        primary={`${m.userName}${m.email ? ` (${m.email})` : ""}`}
                        secondary={
                          disabled ? blockedReason : (m.depId ? `DEP:${m.depId}` : undefined)
                        }
                      />
                    </ListItemButton>
                  );
                })}
                {!loadingMembers && members.length === 0 && (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary">
                      조회 결과가 없습니다.
                    </Typography>
                  </ListItem>
                )}
              </List>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={onConfirm}>선택 완료</Button>
      </DialogActions>
    </Dialog>
  );
}
