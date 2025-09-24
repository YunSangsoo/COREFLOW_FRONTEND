import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Typography, List, ListItemButton, ListItemText
} from "@mui/material";
import { api } from "../../api/coreflowApi";

type MapItem = {
  filename: string;          // 서버가 보낸 "정확한" 파일명(목록에서 찍어옴)
  url: string;               // 절대 URL (http://.../api/rooms/floormaps/xxx.svg)
  title?: string | null;
  size: number;
  modifiedAt: string;        // ISO
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (value: string) => void; // detailLocation에 저장할 URL(절대 URL)
  initialUrl?: string;             // 기존 값(절대 URL)
};

export default function FloorMapPickerModal({ open, onClose, onPick, initialUrl }: Props) {
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 선택은 "항목 전체"를 들고 있게 변경 (url/filename 모두 사용)
  const [selected, setSelected] = useState<MapItem | null>(null);

  // 목록 로드 (Axios 인스턴스로 호출)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api.get<MapItem[]>("/rooms/floormaps")
      .then(res => {
        setItems(res.data);
        // 기본 선택: initialUrl과 일치하는 항목 우선, 없으면 첫 번째
        const byInitial = res.data.find(m => m.url === initialUrl);
        setSelected(byInitial ?? res.data[0] ?? null);
      })
      .catch(err => setError(err?.response?.data?.message || "도면 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [open, initialUrl]);

  // 검색 필터
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(m => {
      const title = (m.title || "").toLowerCase();
      return title.includes(term) || m.filename.toLowerCase().includes(term);
    });
  }, [items, q]);

  // ========= 인라인 SVG 미리보기 (Axios로 파일명 기반 GET) =========
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [svgErr, setSvgErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !selected) {
      setSvgMarkup("");
      setSvgErr(null);
      return;
    }
    // ⚠️ 파일명 기반 경로(프록시 경유 상대 경로) — axios 인스턴스가 baseURL(/api) 적용
    const path = `/rooms/floormaps/${selected.filename}`;
    api.get<string>(path, { responseType: "text" as any })
      .then(r => { setSvgErr(null); setSvgMarkup(r.data as unknown as string); })
      .catch(e => { setSvgMarkup(""); setSvgErr(`미리보기를 불러오지 못했습니다. (${e?.message || e})`); });
  }, [open, selected]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>도면 선택</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="검색 (제목/파일명)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              fullWidth
            />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              전체 {items.length}건
            </Typography>
          </Stack>

          {loading && <Typography variant="body2">불러오는 중…</Typography>}
          {error && <Typography variant="body2" color="error">{error}</Typography>}

          {!loading && !error && (
            <Stack direction="row" spacing={2}>
              {/* 왼쪽: 목록 */}
              <div style={{ flex: 1, minWidth: 320, maxHeight: 420, overflow: "auto", border: "1px solid #eee", borderRadius: 6 }}>
                <List dense>
                  {filtered.map(m => {
                    const primary = m.title || m.filename;
                    const secondary = `${new Date(m.modifiedAt).toLocaleString()} • ${(m.size / 1024).toFixed(1)} KB`;
                    const isSelected = selected?.filename === m.filename;
                    return (
                      <ListItemButton
                        key={m.filename}
                        selected={isSelected}
                        onClick={() => setSelected(m)}
                      >
                        <ListItemText
                          primary={primary}
                          secondary={secondary}
                          primaryTypographyProps={{ noWrap: true }}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                      </ListItemButton>
                    );
                  })}
                  {filtered.length === 0 && (
                    <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
                      검색 결과가 없습니다.
                    </Typography>
                  )}
                </List>
              </div>

              {/* 오른쪽: 미리보기 */}
              <div style={{ flex: 1.6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  미리보기
                </Typography>
                <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, maxHeight: 420, overflow: "auto" }}>
                  {svgErr && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                      {svgErr}
                    </Typography>
                  )}
                  <div
                    key={selected?.filename || "empty"}
                    dangerouslySetInnerHTML={{ __html: svgMarkup }}
                    style={{ width: "100%" }}
                  />
                </div>
                <style>{`div svg { max-width: 100%; height: auto; }`}</style>
              </div>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          onClick={() => selected && onPick(selected.url)}   // ✅ DB에는 절대 URL 저장
          disabled={!selected}
        >
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}
