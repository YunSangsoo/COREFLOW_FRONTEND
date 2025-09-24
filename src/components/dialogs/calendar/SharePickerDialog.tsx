// src/components/calendar/SharePickerDialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Box, TextField, List, ListItemButton, ListItemText,
  ListItemIcon, Checkbox, Button, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Chip
} from "@mui/material";

// calendarApi만 사용 (axios 직접 import 없음)
import * as calApi from "../../../api/calendarApi";

/* ───────────────────────────────────────────────────────────
 * 로컬 유틸
 * ─────────────────────────────────────────────────────────── */
const DEBUG = false;

const toNum = (v: any) => {
  const n = typeof v === "string" ? Number(v) : (typeof v === "number" ? v : NaN);
  return Number.isFinite(n) ? n : NaN;   // 0으로 폴백 금지
};
const toStr = (v: any) => (v == null ? "" : String(v));

const arrayFromAny = <T = any>(v: any, depth = 0): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== "object") return [];
  const keys = ["data", "list", "rows", "items", "content", "result", "nodes", "children", "departments", "positions", "records"];
  for (const k of keys) {
    const a = (v as any)[k];
    if (Array.isArray(a)) return a as T[];
  }
  if (depth < 3) {
    for (const k of keys) {
      const a = (v as any)[k];
      if (a && typeof a === "object") {
        const inner = arrayFromAny<T>(a, depth + 1);
        if (inner.length) return inner;
      }
    }
  }
  return [];
};

const log = (...args: any[]) => { if (DEBUG) console.log("[SharePicker]", ...args); };

/* ───────────────────────────────────────────────────────────
 * 타입 (컴파일 전용)
 * ─────────────────────────────────────────────────────────── */
type CalendarDefaultRole = "NONE" | "BUSY_ONLY" | "READER" | "CONTRIBUTOR" | "EDITOR";

type ShareUpsertReq = {
  members?: Array<{ userNo: number; role: CalendarDefaultRole }>;
  departments?: Array<{ depId: number; role: CalendarDefaultRole }>;
  positions?: Array<{ posId: number; role: CalendarDefaultRole }>;
};

type MemberLike = {
  userNo: number;
  userName: string;
  email?: string;
  depId?: number;
  posId?: number;
};

type DeptNode = {
  depId: number;
  depName: string;
  parentId: number | null;
};

type PositionLike = {
  posId: number;
  posName: string;
};

type TabKey = "members" | "departments" | "positions";

/* ───────────────────────────────────────────────────────────
 * calendarApi 함수 연결
 * ─────────────────────────────────────────────────────────── */
const searchMembersFn =
  (calApi as any).searchMembersForSharePicker ??
  (calApi as any).searchMembers;

const fetchDeptFlatFn =
  (calApi as any).fetchDepartments ??
  (calApi as any).fetchDeptChildren;

const fetchPositionsFn =
  (calApi as any).fetchPositions ??
  (calApi as any).fetchAllPositions;

/* ───────────────────────────────────────────────────────────
 * 응답 어댑터
 * ─────────────────────────────────────────────────────────── */
const mapMember = (raw: any): MemberLike => ({
  userNo: toNum(raw?.userNo ?? raw?.USER_NO ?? raw?.id),
  userName: toStr(raw?.userName ?? raw?.USER_NAME ?? raw?.name),
  email: toStr(raw?.email ?? raw?.EMAIL ?? ""),
  depId:
    ("depId" in (raw ?? {}) || "DEP_ID" in (raw ?? {}) || "DEPT_ID" in (raw ?? {}))
      ? toNum(raw?.depId ?? raw?.DEP_ID ?? raw?.DEPT_ID)
      : undefined,
  posId:
    ("posId" in (raw ?? {}) || "POS_ID" in (raw ?? {}) || "id" in (raw ?? {}))
      ? toNum(raw?.posId ?? raw?.POS_ID ?? raw?.id)
      : undefined,
});

const mapDept = (raw: any): DeptNode => ({
  depId: toNum(raw?.depId ?? raw?.deptId ?? raw?.DEP_ID ?? raw?.DEPT_ID ?? raw?.id),
  depName: toStr(raw?.depName ?? raw?.deptName ?? raw?.DEP_NAME ?? raw?.DEPT_NAME ?? raw?.name),
  parentId: (raw?.parentId ?? raw?.PARENT_ID ?? raw?.parent ?? null) != null
    ? toNum(raw?.parentId ?? raw?.PARENT_ID ?? raw?.parent)
    : null,
});

const mapPos = (raw: any): PositionLike => ({
  posId: toNum(raw?.posId ?? raw?.POS_ID ?? raw?.id ?? raw?.positionId ?? raw?.POSITION_ID),
  posName: toStr(raw?.posName ?? raw?.POS_NAME ?? raw?.positionName ?? raw?.POSITION_NAME ?? raw?.name ?? raw?.NAME ?? ""),
});

/* ───────────────────────────────────────────────────────────
 * 컴포넌트
 * ─────────────────────────────────────────────────────────── */
export default function SharePickerDialog({
  open,
  onClose,
  onApply,
  onConfirm,
  init,
  initial,
  defaultAudienceRole,
}: {
  open: boolean;
  onClose: () => void;
  onApply?: (shares: ShareUpsertReq) => void;
  onConfirm?: (shares: ShareUpsertReq) => void;
  init?: ShareUpsertReq;
  initial?: ShareUpsertReq;
  defaultAudienceRole?: CalendarDefaultRole;
}) {
  const [tab, setTab] = useState<TabKey>("members");

  const BASE_ROLE: CalendarDefaultRole = defaultAudienceRole ?? "READER";
  const initShares: ShareUpsertReq = useMemo(
    () => (init ?? initial ?? { members: [], departments: [], positions: [] }),
    [init, initial]
  );

  // 목록
  const [keyword, setKeyword] = useState("");
  const [memberList, setMemberList] = useState<MemberLike[]>([]);
  const [deptList, setDeptList] = useState<DeptNode[]>([]);
  const [posList, setPosList] = useState<PositionLike[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingPos, setLoadingPos] = useState(false);

  // 선택 상태 Map (id → role)
  const [pickedMembers, setPickedMembers] = useState<Map<number, CalendarDefaultRole>>(new Map());
  const [pickedDepts, setPickedDepts] = useState<Map<number, CalendarDefaultRole>>(new Map());
  const [pickedPositions, setPickedPositions] = useState<Map<number, CalendarDefaultRole>>(new Map());

  // 선택 이름 Map (id → displayName)
  const [memberNameMap, setMemberNameMap] = useState<Map<number, string>>(new Map());
  const [deptNameMap, setDeptNameMap] = useState<Map<number, string>>(new Map());
  const [posNameMap, setPosNameMap] = useState<Map<number, string>>(new Map());

  const roleText: Record<string, string> = {
    NONE: "권한없음",
    BUSY_ONLY: "바쁨만",
    READER: "조회 전용",
    CONTRIBUTOR: "편집 가능",
    EDITOR: "관리자",
  };

  // open 시 초기화 + 첫 로드
  useEffect(() => {
    if (!open) return;

    const mInit = (initShares.members ?? []) as Array<{ userNo: number; role: CalendarDefaultRole }>;
    const dInit = (initShares.departments ?? []) as Array<{ depId: number; role: CalendarDefaultRole }>;
    const pInit = (initShares.positions ?? []) as Array<{ posId: number; role: CalendarDefaultRole }>;

    const m = new Map<number, CalendarDefaultRole>();
    mInit.forEach((x) => { const id = toNum(x.userNo); if (Number.isFinite(id)) m.set(id, x.role); });
    const d = new Map<number, CalendarDefaultRole>();
    dInit.forEach((x) => { const id = toNum(x.depId); if (Number.isFinite(id)) d.set(id, x.role); });
    const p = new Map<number, CalendarDefaultRole>();
    pInit.forEach((x) => { const id = toNum(x.posId); if (Number.isFinite(id)) p.set(id, x.role); });

    setPickedMembers(m);
    setPickedDepts(d);
    setPickedPositions(p);

    // 이름 맵은 비워두고, 각 목록 로딩 시 보강
    setMemberNameMap(new Map());
    setDeptNameMap(new Map());
    setPosNameMap(new Map());

    if (tab === "members") void loadMembers(keyword, m);
    if (tab === "departments") void loadDepartments(d);
    if (tab === "positions") void loadPositions(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 탭 전환 시 로딩
  useEffect(() => {
    if (!open) return;
    if (tab === "members") void loadMembers(keyword, pickedMembers);
    if (tab === "departments") void loadDepartments(pickedDepts);
    if (tab === "positions") void loadPositions(pickedPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ─────────────────────────────────────────────────────────
   * 데이터 로더 (+ 선택 이름 보강)
   * ───────────────────────────────────────────────────────── */
  const loadMembers = async (q: string, selectedMap?: Map<number, CalendarDefaultRole>) => {
    setLoadingMembers(true);
    try {
      const raw = await (searchMembersFn ? searchMembersFn(q.trim(), 50, undefined) : Promise.resolve([]));
      const list = arrayFromAny<any>(raw).map(mapMember);
      setMemberList(list);

      // 선택된 항목의 이름 보강
      const next = new Map(memberNameMap);
      const sel = selectedMap ?? pickedMembers;
      list.forEach(m => {
        const id = toNum(m.userNo);
        if (Number.isFinite(id) && sel.has(id)) next.set(id, m.userName || m.email || `#${id}`);
      });
      setMemberNameMap(next);

      if (DEBUG) log("members length:", list.length);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("loadMembers failed:", e);
      setMemberList([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadDepartments = async (selectedMap?: Map<number, CalendarDefaultRole>) => {
    setLoadingDepts(true);
    try {
      const raw = await (fetchDeptFlatFn ? fetchDeptFlatFn() : []);
      const arr = arrayFromAny<any>(raw);
      const list = arr.map(mapDept).filter(d => Number.isFinite(d.depId) && toStr(d.depName).length > 0);
      setDeptList(list);

      const next = new Map(deptNameMap);
      const sel = selectedMap ?? pickedDepts;
      list.forEach(d => {
        if (sel.has(d.depId)) next.set(d.depId, d.depName || `#${d.depId}`);
      });
      setDeptNameMap(next);

      if (DEBUG) log("departments length:", list.length);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("loadDepartments failed:", e);
      setDeptList([]);
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadPositions = async (selectedMap?: Map<number, CalendarDefaultRole>) => {
    setLoadingPos(true);
    try {
      const raw = await (fetchPositionsFn ? fetchPositionsFn() : []);
      const list = (Array.isArray(raw) ? raw : arrayFromAny<any>(raw)).map(mapPos).filter(p => Number.isFinite(p.posId));
      setPosList(list);

      const next = new Map(posNameMap);
      const sel = selectedMap ?? pickedPositions;
      list.forEach(p => {
        if (sel.has(p.posId)) next.set(p.posId, p.posName || `#${p.posId}`);
      });
      setPosNameMap(next);

      if (DEBUG) log("positions length:", list.length);
    } catch (e) {
      setPosList([]);
    } finally {
      setLoadingPos(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
   * 선택/권한 (버블링 차단 + 이름맵 갱신)
   * ───────────────────────────────────────────────────────── */
  const toggleMember = (u: MemberLike) => {
    const id = toNum(u.userNo);
    if (!Number.isFinite(id)) return;
    setPickedMembers(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        setMemberNameMap(prevNames => { const n = new Map(prevNames); n.delete(id); return n; });
      } else {
        next.set(id, BASE_ROLE);
        setMemberNameMap(prevNames => { const n = new Map(prevNames); n.set(id, u.userName || u.email || `#${id}`); return n; });
      }
      return next;
    });
  };
  const setMemberRole = (userNo: number, role: CalendarDefaultRole) => {
    setPickedMembers(prev => {
      const next = new Map(prev);
      if (next.has(userNo)) next.set(userNo, role);
      return next;
    });
  };

  const toggleDept = (d: DeptNode) => {
    const id = toNum(d.depId);
    if (!Number.isFinite(id)) return;
    setPickedDepts(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        setDeptNameMap(prevNames => { const n = new Map(prevNames); n.delete(id); return n; });
      } else {
        next.set(id, BASE_ROLE);
        setDeptNameMap(prevNames => { const n = new Map(prevNames); n.set(id, d.depName || `#${id}`); return n; });
      }
      return next;
    });
  };
  const setDeptRole = (depId: number, role: CalendarDefaultRole) => {
    setPickedDepts(prev => {
      const next = new Map(prev);
      if (next.has(depId)) next.set(depId, role);
      return next;
    });
  };

  const togglePos = (p: PositionLike) => {
    const id = toNum(p.posId);
    if (!Number.isFinite(id)) return;
    setPickedPositions(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        setPosNameMap(prevNames => { const n = new Map(prevNames); n.delete(id); return n; });
      } else {
        next.set(id, BASE_ROLE);
        setPosNameMap(prevNames => { const n = new Map(prevNames); n.set(id, p.posName || `#${id}`); return n; });
      }
      return next;
    });
  };
  const setPosRole = (posId: number, role: CalendarDefaultRole) => {
    setPickedPositions(prev => {
      const next = new Map(prev);
      if (next.has(posId)) next.set(posId, role);
      return next;
    });
  };

  // 적용(대상선택)
  const handleApply = () => {
  const users = Array.from(pickedMembers.entries()).map(([userNo, role]) => ({
    userNo,
    role,
    userName: memberNameMap.get(userNo) ?? undefined,   // ✅ 이름 포함
  }));
  const departments = Array.from(pickedDepts.entries()).map(([depId, role]) => ({
    depId,
    role,
    depName: deptNameMap.get(depId) ?? undefined,        // ✅ 부서명 포함
  }));
  const positions = Array.from(pickedPositions.entries()).map(([posId, role]) => ({
    posId,
    role,
    posName: posNameMap.get(posId) ?? undefined,         // ✅ 직급명 포함
  }));

  // 호환성 위해 members/users 둘 다 담아줌 (백엔드는 무시해도 OK)
  const payload = { members: users as any, users, departments, positions } as any;

  (onApply ?? onConfirm)?.(payload);
  onClose();
};

  const roleOptions: CalendarDefaultRole[] = ["READER", "CONTRIBUTOR", "EDITOR", "BUSY_ONLY", "NONE"];

  /* ─────────────────────────────────────────────────────────
   * Row 렌더 (버블링 차단)
   * ───────────────────────────────────────────────────────── */
  const renderMemberRow = (m: MemberLike) => {
    const id = toNum(m.userNo);
    const checked = pickedMembers.has(id);
    const role = pickedMembers.get(id) ?? BASE_ROLE;
    const sub = [
      m.email ? ` ${m.email}` : "",
      Number.isFinite(m.depId) ? ` · dep:${m.depId}` : "",
      Number.isFinite(m.posId) ? ` · pos:${m.posId}` : "",
    ].join("");

    return (
      <ListItemButton key={id} onClick={() => toggleMember(m)} dense>
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={checked}
            tabIndex={-1}
            disableRipple
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={() => toggleMember(m)}
          />
        </ListItemIcon>
        <ListItemText primary={toStr(m.userName)} secondary={sub.trim()} />
        {checked && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>권한</InputLabel>
            <Select
              label="권한"
              value={role}
              onChange={(e) => setMemberRole(id, e.target.value as CalendarDefaultRole)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {roleOptions.map(r => <MenuItem key={r} value={r}>{roleText[r]}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </ListItemButton>
    );
  };

  const renderDeptRow = (d: DeptNode) => {
    const id = toNum(d.depId);
    const checked = pickedDepts.has(id);
    const role = pickedDepts.get(id) ?? BASE_ROLE;
    return (
      <ListItemButton key={id} dense onClick={() => toggleDept(d)}>
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={checked}
            tabIndex={-1}
            disableRipple
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={() => toggleDept(d)}
          />
        </ListItemIcon>
        <ListItemText primary={toStr(d.depName)} />
        {checked && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>권한</InputLabel>
            <Select
              label="권한"
              value={role}
              onChange={(e) => setDeptRole(id, e.target.value as CalendarDefaultRole)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {roleOptions.map(r => <MenuItem key={r} value={r}>{roleText[r]}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </ListItemButton>
    );
  };

  const renderPosRow = (p: PositionLike) => {
    const id = toNum(p.posId);
    const checked = pickedPositions.has(id);
    const role = pickedPositions.get(id) ?? BASE_ROLE;
    return (
      <ListItemButton key={id} dense onClick={() => togglePos(p)}>
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={checked}
            tabIndex={-1}
            disableRipple
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={() => togglePos(p)}
          />
        </ListItemIcon>
        <ListItemText primary={toStr(p.posName)} />
        {checked && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>권한</InputLabel>
            <Select
              label="권한"
              value={role}
              onChange={(e) => setPosRole(id, e.target.value as CalendarDefaultRole)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {roleOptions.map(r => <MenuItem key={r} value={r}>{roleText[r]}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </ListItemButton>
    );
  };

  /* ─────────────────────────────────────────────────────────
   * 선택 요약(칩) - 이름 맵 사용
   * ───────────────────────────────────────────────────────── */
  const renderPickedChips = () => {
    const m = Array.from(pickedMembers.entries()).map(([id, role]) => (
      <Chip
        key={`m-${id}`}
        label={`${memberNameMap.get(id) ?? `개인#${id}`} · ${roleText[role] ?? role}`}
        onDelete={() => setPickedMembers(prev => { const next = new Map(prev); next.delete(id); return next; })}
        sx={{ mr: 1, mb: 1 }}
      />
    ));
    const d = Array.from(pickedDepts.entries()).map(([id, role]) => (
      <Chip
        key={`d-${id}`}
        label={`${deptNameMap.get(id) ?? `부서#${id}`} · ${roleText[role] ?? role}`}
        onDelete={() => setPickedDepts(prev => { const next = new Map(prev); next.delete(id); return next; })}
        sx={{ mr: 1, mb: 1 }}
      />
    ));
    const p = Array.from(pickedPositions.entries()).map(([id, role]) => (
      <Chip
        key={`p-${id}`}
        label={`${posNameMap.get(id) ?? `직급#${id}`} · ${roleText[role] ?? role}`}
        onDelete={() => setPickedPositions(prev => { const next = new Map(prev); next.delete(id); return next; })}
        sx={{ mr: 1, mb: 1 }}
      />
    ));
    if (m.length + d.length + p.length === 0) return <Typography variant="body2" color="text.secondary">선택된 대상이 없습니다.</Typography>;
    return <Stack direction="row" spacing={1} flexWrap="wrap">{[...m, ...d, ...p]}</Stack>;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>대상 선택</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="members" label="개인" />
          <Tab value="departments" label="부서" />
          <Tab value="positions" label="직급" />
        </Tabs>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>선택 요약</Typography>
          {renderPickedChips()}
        </Box>

        {tab === "members" && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="이름/이메일 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void loadMembers(keyword); }}
              />
              <Button variant="outlined" onClick={() => void loadMembers(keyword)} disabled={loadingMembers}>검색</Button>
            </Stack>
            <List dense sx={{ maxHeight: 380, overflowY: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 1 }}>
              {memberList.map(renderMemberRow)}
              {!loadingMembers && memberList.length === 0 && (
                <Box p={2}><Typography variant="body2" color="text.secondary">검색 결과가 없습니다.</Typography></Box>
              )}
            </List>
          </Box>
        )}

        {tab === "departments" && (
          <Box>
            <List dense sx={{ maxHeight: 420, overflowY: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 1 }}>
              {deptList.map(renderDeptRow)}
              {!loadingDepts && deptList.length === 0 && (
                <Box p={2}><Typography variant="body2" color="text.secondary">부서 데이터가 없습니다.</Typography></Box>
              )}
            </List>
          </Box>
        )}

        {tab === "positions" && (
          <Box>
            <List dense sx={{ maxHeight: 420, overflowY: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 1 }}>
              {posList.map(renderPosRow)}
              {!loadingPos && posList.length === 0 && (
                <Box p={2}><Typography variant="body2" color="text.secondary">직급 데이터가 없습니다.</Typography></Box>
              )}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleApply}>대상선택</Button>
      </DialogActions>
    </Dialog>
  );
}
