// c:/FinalProject_Front/src/components/rooms/RoomCreateDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, MenuItem, Box, Typography
} from "@mui/material";
import type { Room, RoomCreateReq, RoomStatus } from "../../types/rooms/room";
import FloorMapPickerModal from "./FloorMapPickerModal";
import FloorPlanDesigner from "./FloorPlanDesigner";
import { uploadFloorMap } from "../../api/filesApi";
import { api } from "../../api/coreflowApi";
import { fetchRoom } from "../../api/roomApi";

const STATUS_OPTIONS: RoomStatus[] = ["ACTIVE", "INACTIVE"];

// ── URL 유틸
const fixDoubleApi = (u: string) => (u || "").replace(/\/api\/api\//i, "/api/");
const extractFilename = (u?: string | null) => {
  if (!u) return "";
  const cleaned = fixDoubleApi(u).split("#")[0].split("?")[0];
  const path = cleaned.replace(/^https?:\/\/[^/]+/i, "");
  try {
    return decodeURIComponent(path.split("/").pop() || "");
  } catch {
    return (path.split("/").pop() || "");
  }
};

// 최근 사용 도면 저장(옵션)
const RECENT_KEY = "floorMapRecents";
function pushRecent(url: string) {
  if (!url) return;
  const max = 8;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const next = [url, ...arr.filter(u => u !== url)].slice(0, max);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(RECENT_KEY, JSON.stringify([url]));
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: RoomCreateReq) => Promise<void> | void;
  /** 생성 모드에서 초기값 줄 때만 사용 */
  initial?: Partial<RoomCreateReq>;
  /** 편집 모드: 제목/버튼 라벨 변경 + room 상세 자동 로딩 */
  mode?: "create" | "edit";
  /** 편집할 roomId (mode==='edit'에서 사용) */
  editRoomId?: number | null;
};

export default function RoomCreateDialog({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
  editRoomId = null,
}: Props) {
  const [form, setForm] = useState<RoomCreateReq>({ roomName: "", status: "ACTIVE" });
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  // 편집 시 방 정보 로딩 → 폼 세팅
  useEffect(() => {
    let mounted = true;

    async function loadForEdit(id: number) {
      setLoadingForm(true);
      try {
        const r: Room = await fetchRoom(id);
        if (!mounted) return;
        setForm({
          roomName: r.roomName || "",
          buildingName: r.buildingName || "",
          floor: r.floor || "",
          roomNo: r.roomNo || "",
          capacity: r.capacity ?? undefined,
          detailLocation: r.detailLocation || "",
          status: (r.status as RoomStatus) || "ACTIVE",
        });
      } finally {
        if (mounted) setLoadingForm(false);
      }
    }

    if (!open) return;

    if (mode === "edit" && editRoomId) {
      loadForEdit(editRoomId);
    } else {
      // 생성 모드(기본값 + initial 병합)
      setForm({ roomName: "", status: "ACTIVE", ...initial });
    }

    return () => { mounted = false; };
  }, [open, mode, editRoomId, initial]);

  const handleChange = (key: keyof RoomCreateReq) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: key === "capacity" ? (v === "" ? undefined : Number(v)) : v }));
  };

  const handleSubmit = async () => {
    if (!form.roomName || !form.roomName.trim()) { alert("회의실 이름은 필수입니다."); return; }
    try {
      setSubmitting(true);
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 미리보기: 파일명으로 axios(api) GET → SVG 텍스트를 인라인 렌더
  const detailFixed = fixDoubleApi(form.detailLocation || "");
  const previewFilename = useMemo(() => extractFilename(detailFixed), [detailFixed]);
  const previewPath = useMemo(
    () => (previewFilename ? `/rooms/floormaps/${encodeURIComponent(previewFilename)}` : ""),
    [previewFilename]
  );
  const [svgMarkup, setSvgMarkup] = useState("");
  const [svgErr, setSvgErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !previewFilename) { setSvgMarkup(""); setSvgErr(null); return; }
    api.get<string>(previewPath, { responseType: "text" as any, headers: { Accept: "image/svg+xml" } })
      .then(res => { setSvgErr(null); setSvgMarkup(res.data as unknown as string); })
      .catch(e => { setSvgMarkup(""); setSvgErr(`이미지를 불러오지 못했습니다. (${e?.message || e})`); });
  }, [open, previewFilename, previewPath]);

  const titleText = mode === "edit" ? "회의실 수정" : "회의실 생성";
  const submitText = mode === "edit" ? "수정" : "생성";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{titleText}</DialogTitle>

      <DialogContent>
        {loadingForm ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">불러오는 중…</Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="회의실 이름*"
              value={form.roomName || ""}
              onChange={handleChange("roomName")}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField label="건물" value={form.buildingName || ""} onChange={handleChange("buildingName")} fullWidth />
              <TextField label="층" value={form.floor || ""} onChange={handleChange("floor")} fullWidth />
              <TextField label="호수" value={form.roomNo || ""} onChange={handleChange("roomNo")} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                label="정원"
                value={form.capacity ?? ""}
                onChange={handleChange("capacity")}
                fullWidth
                inputProps={{ min: 1 }}
              />
              <TextField select label="상태" value={form.status || "ACTIVE"} onChange={handleChange("status")} fullWidth>
                {STATUS_OPTIONS.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
              </TextField>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="상세 위치 경로"
                value={form.detailLocation || ""}
                onChange={handleChange("detailLocation")}
                fullWidth
              />
              <Button variant="outlined" onClick={() => setPickerOpen(true)} sx={{ flexShrink: 0 }}>
                선택…
              </Button>
              <Button variant="outlined" onClick={() => setDesignerOpen(true)} sx={{ flexShrink: 0 }}>
                도면 만들기
              </Button>
            </Stack>

            {/* 미리보기 (인라인 SVG) */}
            {previewFilename && (
              <Box sx={{ mt: 2, border: "1px dashed #ccc", borderRadius: 1, p: 1, maxHeight: 420, overflow: "auto" }}>
                {svgErr && <Typography variant="body2" color="error" sx={{ mb: 1 }}>{svgErr}</Typography>}
                <div key={previewFilename} dangerouslySetInnerHTML={{ __html: svgMarkup }} style={{ width: "100%" }} />
                <style>{`div svg { max-width: 100%; height: auto; }`}</style>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>취소</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || loadingForm}>
          {submitText}
        </Button>
      </DialogActions>

      {/* 도면 선택 모달 */}
      <FloorMapPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialUrl={form.detailLocation || ""}
        onPick={(value) => {
          const fixed = fixDoubleApi(value);
          setForm((f) => ({ ...f, detailLocation: fixed }));
          pushRecent(fixed);
          setPickerOpen(false);
        }}
      />

      {/* 도면 디자이너 */}
      <FloorPlanDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        onSave={async (svg) => {
          const { url } = await uploadFloorMap(svg);  // ex) http://.../api/rooms/floormaps/xxx.svg
          const fixed = fixDoubleApi(url);
          setDesignerOpen(false);
          pushRecent(fixed);
          setForm((f) => ({ ...f, detailLocation: fixed }));
        }}
      />
    </Dialog>
  );
}
