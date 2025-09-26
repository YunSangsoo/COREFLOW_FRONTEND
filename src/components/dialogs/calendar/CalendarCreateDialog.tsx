// src/components/dialogs/calendar/CalendarCreateDialog.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box, Button, Stack, Chip, Typography, Divider
} from "@mui/material";
import { CheckRounded, PaletteRounded, PeopleAltRounded } from "@mui/icons-material";
import {
  COLOR_PALETTE, DEFAULT_ROLE_LABELS, isValidHexColor
} from "../../../constants/calendar/calendar";
import type { CalendarDefaultRole, ShareUpsertReq } from "../../../types/calendar/calendar";
import SharePickerDialog from "../calendar/SharePickerDialog";
import PersonOutline from "@mui/icons-material/PersonOutline";
import CorporateFareRounded from "@mui/icons-material/CorporateFareRounded";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: {
    name: string;
    color: string;
    defaultRole: CalendarDefaultRole;
    shares?: {
      users?: { userNo: number; role: CalendarDefaultRole }[];
      departments?: { depId: number; role: CalendarDefaultRole }[];
      positions?: { posId: number; role: CalendarDefaultRole }[];
      mode?: "merge" | "replace";
    };
  }) => void;
  mode?: "create" | "edit";
  onDelete?: () => void;
  init?: { name: string; color: string; defaultRole?: CalendarDefaultRole };
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
  const [shareOpen, setShareOpen] = useState(false);
  const [shares, setShares] = useState<ShareUpsertReq | undefined>(undefined);
  const [audRoleInit] = useState<CalendarDefaultRole>("READER");

  useEffect(() => {
    if (!open) return;
    setForm(init);
    setErr({});
    setShares(sharesInit);
  }, [open, init, sharesInit]);

  const canSubmit = useMemo(() => {
    const name = (form.name ?? "").trim();
    const color = (form.color ?? "").trim();
    return name.length > 0 && isValidHexColor(color);
  }, [form]);

  const handleSubmit = () => {
    const name = (form.name ?? "").trim();
    const color = (form.color ?? "").trim().toUpperCase();
    const nextErr: typeof err = {};
    if (!name) nextErr.name = "캘린더 이름을 입력하세요.";
    if (!isValidHexColor(color)) nextErr.color = "색상은 #RRGGBB 형식이어야 합니다.";
    setErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;

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
        mode: (isEdit ? "replace" : "merge") as "replace" | "merge",
      }
      : undefined;

    onSubmit({
      name,
      color,
      defaultRole: "NONE",
      shares: normalizedShares,
    });
  };

  function toPickerPayload(sh: any) {
    const arr = (v: any) => (Array.isArray(v) ? v : []);
    const srcMembers = arr(sh?.members).length ? arr(sh?.members) : arr(sh?.users);
    const srcDepts = arr(sh?.departments).length ? arr(sh?.departments) : arr(sh?.depts);
    const srcPos = arr(sh?.positions);

    const members = srcMembers.map((u: any) => ({
      userNo: Number(u.userNo ?? u.id ?? u.USER_NO ?? 0),
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
        userName: m.userName ?? m.name ?? m.label ?? m.email ?? null,
      })),
      departments: srcDepts.map((d: any) => ({
        depId: Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID ?? 0),
        role: (d.role ?? "READER") as CalendarDefaultRole,
        depName: d.depName ?? d.name ?? d.label ?? null,
      })),
      positions: srcPos.map((x: any) => ({
        posId: Number(x.posId ?? x.id ?? x.POS_ID ?? 0),
        role: (x.role ?? "READER") as CalendarDefaultRole,
        posName: x.posName ?? x.name ?? x.label ?? null,
      })),
    } as ShareUpsertReq & any;
  }

  /* ───────────────────────────── UI ───────────────────────────── */
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ py: 2.25, pr: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 12, height: 12, borderRadius: "50%",
              background: form.color || "#4096ff",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.08)"
            }}
          />
          <Box sx={{ fontWeight: 800 }}>
            {isEdit ? "캘린더 수정" : "새 캘린더 만들기"}
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 1.5, display: "grid", gap: 2.25 }}>
        {/* 이름 */}
        <Box>
          <TextField
            label="캘린더 이름"
            placeholder="예: 팀 일정, 프로젝트 A"
            value={form.name}
            onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); if (err.name) setErr(p => ({ ...p, name: undefined })); }}
            error={!!err.name}
            helperText={err.name}
            fullWidth
            variant="outlined"
            slotProps={{
              input: { notched: true },
              inputLabel: { shrink: true, sx: { overflow: "visible" } },
            }}
          />
          {/* 미리보기 */}
          {/* <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{
              width: 18, height: 18, borderRadius: "50%",
              background: form.color || "#4096ff",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 0 0 1px rgba(0,0,0,.1)"
            }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {form.name?.trim() || "새 캘린더"}
            </Typography>
          </Box> */}
        </Box>

        {/* 색상 */}
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
            <PaletteRounded fontSize="small" />
            색상
          </Box>

          {/* 팔레트 */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 30px)", gap: "10px 12px" }}>
            {COLOR_PALETTE.map((hex) => {
              const selected = (form.color ?? "").toUpperCase() === hex.toUpperCase();
              return (
                <Box
                  key={hex}
                  role="button"
                  aria-label={`색상 ${hex}`}
                  onClick={() => { setForm(f => ({ ...f, color: hex })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
                  sx={{
                    width: 30, height: 30, borderRadius: "50%",
                    display: "grid", placeItems: "center",
                    background: hex, cursor: "pointer",
                    border: selected ? "3px solid #111827" : "1px solid #d1d5db",
                    boxShadow: selected ? "0 0 0 2px #dbeafe" : "none",
                    transition: "transform .05s ease",
                    "&:active": { transform: "translateY(1px)" }
                  }}
                  title={hex}
                >
                  {selected && <CheckRounded sx={{ fontSize: 18, color: "#fff" }} />}
                </Box>
              );
            })}
          </Box>

          {/* 커스텀 HEX */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1 }}>
            <input
              type="color"
              value={form.color}
              onChange={(e) => { setForm(f => ({ ...f, color: e.target.value })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
              style={{ width: 44, height: 32, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
              aria-label="색상 선택기"
            />
            <TextField
              size="small"
              label="#RRGGBB"
              value={form.color}
              onChange={(e) => { setForm(f => ({ ...f, color: e.target.value })); if (err.color) setErr(p => ({ ...p, color: undefined })); }}
              error={!!err.color}
              helperText={err.color}
              sx={{ width: 160 }}
              variant="outlined"
              slotProps={{
                input: { notched: true },
                inputLabel: { shrink: true, sx: { overflow: "visible" } },
              }}
            />
          </Box>
        </Box>

        {/* 공유 대상 */}
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", fontSize: 14, fontWeight: 700 }}>
              <PeopleAltRounded fontSize="small" />
              공유 대상
            </Box>
            <Button variant="outlined" size="small" onClick={() => setShareOpen(true)}>대상 선택…</Button>
          </Box>

          <Box sx={{
            p: 1.25, border: "1px dashed #e5e7eb", borderRadius: 2,
            bgcolor: (shares && ((shares as any).members?.length || (shares as any).users?.length || (shares as any).departments?.length || (shares as any).positions?.length)) ? "#fafafa" : "transparent"
          }}>
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
                return <Chip key={`m-${id}`} size="small" sx={{ mr: .5, mb: .5 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
              });

              const deptChips = deptsSrc.map((d: any) => {
                const id = Number(d.depId ?? d.deptId ?? d.DEP_ID ?? d.DEPT_ID);
                const name = d.depName ?? d.name ?? `#${id}`;
                const role = (d.role as CalendarDefaultRole) ?? "READER";
                return <Chip key={`d-${id}`} size="small" sx={{ mr: .5, mb: .5 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
              });

              const posChips = positionsSrc.map((p: any) => {
                const id = Number(p.posId ?? p.id ?? p.POS_ID);
                const name = p.posName ?? p.name ?? `#${id}`;
                const role = (p.role as CalendarDefaultRole) ?? "READER";
                return <Chip key={`p-${id}`} size="small" sx={{ mr: .5, mb: .5 }} label={`${name} · ${DEFAULT_ROLE_LABELS[role] ?? role}`} />;
              });

              const Section = ({
                icon,
                label,
                count,
                children,
              }: {
                icon: React.ReactNode;
                label: string;
                count: number;
                children: React.ReactNode;
              }) => (
                <Box sx={{ mb: 1.25 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: .5, mb: .5, color: "text.secondary" }}>
                    {icon}
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
                    <Chip size="small" label={count} sx={{ ml: .5, height: 20 }} />
                  </Box>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {children}
                  </Stack>
                </Box>
              );

              const total = memberChips.length + deptChips.length + posChips.length;

              if (total === 0) {
                return <Typography variant="body2" color="text.secondary">선택된 대상이 없습니다.</Typography>;
              }

              return (
                <Box>
                  {memberChips.length > 0 && (
                    <Section icon={<PersonOutline fontSize="small" />} label="개인" count={memberChips.length}>
                      {memberChips}
                    </Section>
                  )}
                  {deptChips.length > 0 && (
                    <Section icon={<CorporateFareRounded fontSize="small" />} label="부서" count={deptChips.length}>
                      {deptChips}
                    </Section>
                  )}
                  {posChips.length > 0 && (
                    <Section icon={<BadgeOutlined fontSize="small" />} label="직급" count={posChips.length}>
                      {posChips}
                    </Section>
                  )}
                </Box>
              );
            })()}
          </Box>
        </Box>

        {/* SharePicker */}
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

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Box>
          {isEdit && onDelete && (
            <Button color="error" onClick={onDelete}>삭제</Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose}>취소</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
            {isEdit ? "저장" : "만들기"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
