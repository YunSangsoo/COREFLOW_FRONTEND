// src/components/dialogs/calendar/CalendarCreateDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Button,
  Stack, Chip, Typography
} from "@mui/material";
import {
  COLOR_PALETTE, DEFAULT_ROLE_LABELS, isValidHexColor
} from "../../../constants/calendar/calendar";
import type { CalendarDefaultRole, ShareUpsertReq } from "../../../types/calendar/calendar";

// ✅ 피커는 components/calendar/ 에 있으니 경로 주의
import SharePickerDialog from "../calendar/SharePickerDialog";

type Props = {
  open: boolean;
  onClose: () => void;

  // 생성/수정 공통 제출 콜백 (백엔드 호출은 부모에서)
  onSubmit: (form: {
    name: string;
    color: string;
    // 기본권한 UI는 제거했지만, 호출부 호환을 위해 항상 'NONE'을 보냄
    defaultRole: CalendarDefaultRole;
    shares?: {
      users?: { userNo: number; role: CalendarDefaultRole }[];
      departments?: { depId: number; role: CalendarDefaultRole }[];
      positions?: { posId: number; role: CalendarDefaultRole }[];
      mode?: "merge" | "replace";
    };
  }) => void;

  // 🔹 추가: 편집/삭제 지원
  mode?: "create" | "edit";                        // 기본 "create"
  onDelete?: () => void;                           // 편집 모드에서만 사용
  init?: { name: string; color: string; defaultRole?: CalendarDefaultRole };

  // 🔹 추가: 편집 모드 초기 공유값 (이름 보존 포맷: ShareUpsertReq)
  sharesInit?: ShareUpsertReq;
};

export default function CalendarCreateDialog({
  open, onClose, onSubmit,
  init = { name: "", color: "#4096ff" },
  mode = "create",
  onDelete,
  sharesInit
}: Props) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(init);
  const [err, setErr] = useState<{ name?: string; color?: string }>({});

  // 공유 피커 상태
  const [shareOpen, setShareOpen] = useState(false);
  const [shares, setShares] = useState<ShareUpsertReq | undefined>(undefined);
  const [audRoleInit] = useState<CalendarDefaultRole>("READER");

  useEffect(() => {
    if (!open) return;
    setForm(init);
    setErr({});
    // 편집 모드에서 넘어온 초기 공유값을 그대로 주입 (이름 보존됨)
    setShares(sharesInit);
  }, [open, init, sharesInit]);

  /* ─────────────────────────────────────────────────────────
   * 제출: 유효성 + shares를 서버 포맷으로 정규화
   * ───────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    const name = (form.name ?? "").trim();
    const color = (form.color ?? "").trim().toUpperCase();
    const nextErr: typeof err = {};
    if (!name) nextErr.name = "캘린더 이름을 입력하세요.";
    if (!isValidHexColor(color)) nextErr.color = "색상은 #RRGGBB 형식이어야 합니다.";
    setErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    // 서버용 정규화 (id + role만)
    const normalizedShares = shares
      ? {
        users:
          (Array.isArray((shares as any).users) ? (shares as any).users
            : Array.isArray((shares as any).members) ? (shares as any).members : []
          ).map((u: any) => ({ userNo: Number(u.userNo), role: u.role as CalendarDefaultRole })),

        departments: (shares as any).departments?.map((d: any) => ({
          depId: Number(d.depId), role: d.role as CalendarDefaultRole
        })) ?? [],

        positions: (shares as any).positions?.map((p: any) => ({
          posId: Number(p.posId), role: p.role as CalendarDefaultRole
        })) ?? [],

        // ✅ 생성 시 merge, 편집 시 replace
        mode: (isEdit ? "replace" : "merge") as "replace" | "merge",
      }
      : undefined;

    onSubmit({
      name,
      color,
      // ✅ 기본권한 UI 제거: 항상 'NONE' 전송
      defaultRole: "NONE",
      shares: normalizedShares,
    });
  };

  /* ─────────────────────────────────────────────────────────
   * SharePicker <-> Dialog 데이터 변환 (이름 보존)
   * ───────────────────────────────────────────────────────── */
  function toPickerPayload(sh: any) {
    const arr = (v: any) => (Array.isArray(v) ? v : []);

    const srcMembers = arr(sh?.members).length ? arr(sh?.members) : arr(sh?.users);
    const srcDepts = arr(sh?.departments).length ? arr(sh?.departments) : arr(sh?.depts);
    const srcPos = arr(sh?.positions);

    const members = srcMembers.map((u: any) => ({
      userNo: Number(u.userNo ?? u.id ?? u.USER_NO ?? 0),
      // 이름/이메일 유지 (칩에서 #숫자 대신 이름 나오게)
      name: u.userName ?? u.name ?? u.email ?? null,
      userName: u.userName ?? u.name ?? u.email ?? null,
      role: (u.role ?? "READER") as CalendarDefaultRole,
      label: (u.userName ?? u.name ?? u.email) ?? undefined,
    }));

    const departments = srcDepts.map((d: any) => ({
      depId: Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID ?? 0),
      depName: d.depName ?? d.name ?? null,
      role: (d.role ?? "READER") as CalendarDefaultRole,
      label: (d.depName ?? d.name) ?? undefined,
    }));

    const positions = srcPos.map((p: any) => ({
      posId: Number(p.posId ?? p.id ?? p.POS_ID ?? 0),
      posName: p.posName ?? p.name ?? null,
      role: (p.role ?? "READER") as CalendarDefaultRole,
      label: (p.posName ?? p.name) ?? undefined,
    }));

    // ❗️피커가 users 또는 members 중 무엇을 기대하든 동작하도록 둘 다 채워줌
    return { users: members, members, departments, positions } as any;
  }

  function fromPickerPayload(p: any) {
    const arr = (v: any) => (Array.isArray(v) ? v : []);
    const srcMembers = arr(p?.members).length ? arr(p?.members) : arr(p?.users);
    const srcDepts = arr(p?.departments).length ? arr(p?.departments) : arr(p?.depts);
    const srcPos = arr(p?.positions);

    return {
      members: srcMembers.map((m: any) => ({
        userNo: Number(m.userNo ?? m.id ?? m.USER_NO ?? 0),
        role: (m.role ?? "READER") as CalendarDefaultRole,
        userName: m.userName ?? m.name ?? m.label ?? m.email ?? null, // ★ 이름 보존
      })),
      departments: srcDepts.map((d: any) => ({
        depId: Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID ?? 0),
        role: (d.role ?? "READER") as CalendarDefaultRole,
        depName: d.depName ?? d.name ?? d.label ?? null,              // ★ 이름 보존
      })),
      positions: srcPos.map((x: any) => ({
        posId: Number(x.posId ?? x.id ?? x.POS_ID ?? 0),
        role: (x.role ?? "READER") as CalendarDefaultRole,
        posName: x.posName ?? x.name ?? x.label ?? null,              // ★ 이름 보존
      })),
    } as ShareUpsertReq & any;
  }

  /* ─────────────────────────────────────────────────────────
   * 렌더
   * ───────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "캘린더 수정" : "새 캘린더 만들기"}</DialogTitle>

      <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
        <TextField
          label="캘린더 이름"
          value={form.name}
          onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); if (err.name) setErr(p => ({ ...p, name: undefined })); }}
          error={!!err.name}
          helperText={err.name}
          autoFocus
          fullWidth
          margin="normal"
        />

        {/* 색상 선택 */}
        <Box sx={{ display: "grid", gap: 1 }}>
          <Box sx={{ fontSize: 14, color: "#6b7280" }}>색상</Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 28px)", gap: "8px 10px", alignItems: "center" }}>
            {COLOR_PALETTE.map((hex) => {
              const selected = (form.color ?? "").toUpperCase() === hex.toUpperCase();
              return (
                <Box key={hex} role="button" aria-label={`색상 ${hex}`}
                  onClick={() => { setForm(f => ({ ...f, color: hex })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
                  sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: selected ? "3px solid #111827" : "1px solid #d1d5db",
                    boxShadow: selected ? "0 0 0 2px #dbeafe" : "none",
                    background: hex, cursor: "pointer"
                  }}
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

        {/* 공유 대상 선택 */}
        <Box sx={{ mt: 2, p: 2, borderTop: "1px solid #eee" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong>공유 대상</strong>
            <Button variant="outlined" onClick={() => setShareOpen(true)}>대상 선택…</Button>
          </Box>

          {/* 요약/칩: 이름 · 한글권한 */}
          {(() => {
            const arr = (v: any) => (Array.isArray(v) ? v : []);
            const s: any = shares ?? {};
            const membersSrc = arr(s.members).length ? arr(s.members) : arr(s.users);
            const deptsSrc = arr(s.departments).length ? arr(s.departments) : arr(s.depts);
            const positionsSrc = arr(s.positions);

            const memberChips = membersSrc.map((m: any) => {
              const id = Number(m.userNo ?? m.id ?? m.USER_NO);
              const name = m.userName ?? m.name ?? m.email ?? `#${id}`;
              const role = (m.role as CalendarDefaultRole) ?? "READER";
              return <Chip key={`m-${id}`} size="small" sx={{ mr: 1, mb: 1 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
            });

            const deptChips = deptsSrc.map((d: any) => {
              const id = Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID);
              const name = d.depName ?? d.name ?? `#${id}`;
              const role = (d.role as CalendarDefaultRole) ?? "READER";
              return <Chip key={`d-${id}`} size="small" sx={{ mr: 1, mb: 1 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
            });

            const posChips = positionsSrc.map((p: any) => {
              const id = Number(p.posId ?? p.id ?? p.POS_ID);
              const name = p.posName ?? p.name ?? `#${id}`;
              const role = (p.role as CalendarDefaultRole) ?? "READER";
              return <Chip key={`p-${id}`} size="small" sx={{ mr: 1, mb: 1 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
            });

            const total = memberChips.length + deptChips.length + posChips.length;
            if (total === 0) return <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>선택된 대상이 없습니다.</Typography>;

            return (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                  선택됨: 사용자 {memberChips.length} · 부서 {deptChips.length} · 직급 {posChips.length}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {memberChips}{deptChips}{posChips}
                </Stack>
              </Box>
            );
          })()}
        </Box>

        {/* 항상 렌더: open prop으로만 토글 */}
        <SharePickerDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          defaultAudienceRole={audRoleInit}
          initial={toPickerPayload(shares)}
          onConfirm={(picked: any) => {
            const normalized = fromPickerPayload(picked);
            setShares(normalized);
            setShareOpen(false);
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        {/* 🔹 편집 모드일 때만 삭제 버튼 노출 */}
        <Box>
          {isEdit && onDelete && (
            <Button color="error" onClick={onDelete}>삭제</Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose}>취소</Button>
          <Button variant="contained" onClick={handleSubmit}>{isEdit ? "저장" : "만들기"}</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
