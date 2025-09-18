import React, { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, ToggleButton, ToggleButtonGroup, Box, TextField
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (svg: string) => void;   // SVG 문자열 반환 (호출부 변경 없음)
  width?: number;
  height?: number;
};

export default function FloorPlanDesigner({
  open, onClose, onSave, width = 960, height = 600,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<any>(null);   // fabric.Canvas
  const fabricRef = useRef<any>(null);   // fabric 네임스페이스

  // 스냅 상태는 ref에도 보관해서 재생성 없이 반영
  const [snap, setSnap] = useState(true);
  const snapRef = useRef(snap);
  useEffect(() => { snapRef.current = snap; }, [snap]);

  const [zoom, setZoom] = useState(1);

  // 오버레이 텍스트 에디터
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorVal, setEditorVal] = useState("");
  const [editorStyle, setEditorStyle] = useState<React.CSSProperties>({});
  const editingTargetRef = useRef<any>(null);
  const editorInputRef = useRef<HTMLInputElement | null>(null);

  // 도면 제목(새로 추가)
  const [docTitle, setDocTitle] = useState<string>("");

  const startOverlayEdit = (obj: any) => {
    if (!obj || !canvasRef.current || !wrapRef.current) return;
    const c = canvasRef.current;
    const z = c.getZoom?.() ?? 1;

    const left = (obj.left ?? 0) * z;
    const top = (obj.top ?? 0) * z;
    const w = (obj.width ?? 100) * (obj.scaleX ?? 1) * z;
    const h = (obj.height ?? 24) * (obj.scaleY ?? 1) * z;
    const fs = (obj.fontSize ?? 18) * (obj.scaleY ?? 1) * z;

    setEditorVal(obj.text ?? "");
    setEditorStyle({
      position: "absolute",
      left, top,
      width: Math.max(40, w),
      height: Math.max(22, h),
      fontSize: fs,
      lineHeight: `${fs}px`,
      padding: "2px 6px",
      border: "1px solid #1976d2",
      borderRadius: 4,
      background: "#fff",
      outline: "none",
      zIndex: 10,
    });
    editingTargetRef.current = obj;
    setEditorOpen(true);
    setTimeout(() => editorInputRef.current?.focus(), 0);
  };

  const commitOverlayEdit = (apply: boolean) => {
    const obj = editingTargetRef.current;
    const c = canvasRef.current;
    if (apply && obj && c) {
      obj.set({ text: editorVal });
      c.requestRenderAll();
    }
    setEditorOpen(false);
    editingTargetRef.current = null;
  };

  useEffect(() => {
    if (!open) return;

    let disposed = false;

    (async () => {
      const mod: any = await import("fabric");
      const f = mod.fabric ?? mod.default ?? mod;
      fabricRef.current = f;

      // 캔버스 DOM
      const el = document.createElement("canvas");
      el.width = width; el.height = height;
      if (!wrapRef.current) return;
      wrapRef.current.innerHTML = "";
      wrapRef.current.style.position = "relative"; // 오버레이 포지셔닝용
      wrapRef.current.appendChild(el);

      const canvas = new f.Canvas(el, {
        backgroundColor: "#fff",
        selection: true,
        preserveObjectStacking: true,
      });
      canvasRef.current = canvas;

      // 그리드 (내보내기 제외)
      const grid = 20;
      for (let x = 0; x < width; x += grid) {
        canvas.add(new f.Line([x, 0, x, height], {
          stroke: "#f0f0f0", selectable: false, evented: false, excludeFromExport: true,
        }));
      }
      for (let y = 0; y < height; y += grid) {
        canvas.add(new f.Line([0, y, width, y], {
          stroke: "#f0f0f0", selectable: false, evented: false, excludeFromExport: true,
        }));
      }

      // 스냅(이동/리사이즈)
      const snapMove = (e: any) => {
        if (!snapRef.current) return;
        const obj = e.target!;
        obj.set({
          left: Math.round((obj.left ?? 0) / grid) * grid,
          top:  Math.round((obj.top  ?? 0) / grid) * grid,
        });
      };
      const snapScale = (e: any) => {
        if (!snapRef.current) return;
        const obj = e.target!;
        obj.set({
          width:  Math.round((obj.width  ?? 0) / grid) * grid,
          height: Math.round((obj.height ?? 0) / grid) * grid,
        });
      };
      canvas.on("object:moving", snapMove);
      canvas.on("object:scaling", snapScale);

      // 더블클릭 → 오버레이 에디터(액티브 객체)
      const onDomDbl = () => {
        const obj = canvas.getActiveObject?.();
        if (obj && obj.type === "textbox") startOverlayEdit(obj);
      };
      canvas.upperCanvasEl.addEventListener("dblclick", onDomDbl);

      if (disposed) canvas.dispose();

      // cleanup
      return () => {
        try {
          canvas.off("object:moving", snapMove);
          canvas.off("object:scaling", snapScale);
          canvas.upperCanvasEl.removeEventListener("dblclick", onDomDbl);
          canvas.dispose();
        } catch {}
      };
    })();

    return () => {
      disposed = true;
      try { canvasRef.current?.dispose(); } catch {}
      canvasRef.current = null;
    };
  }, [open, width, height]); // ✅ snap 제거(도형 유지)

  // 툴바 액션
  const addRect = () => {
    const f = fabricRef.current; if (!f || !canvasRef.current) return;
    const c = canvasRef.current;
    const rect = new f.Rect({
      left: 100, top: 100, width: 120, height: 80,
      fill: "#e3f2fd", stroke: "#1976d2", strokeWidth: 2,
    });
    (rect as any).name = "ROOM";
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
  };

  const addText = () => {
    const f = fabricRef.current; if (!f || !canvasRef.current) return;
    const c = canvasRef.current;
    const txt = new f.Textbox("219", {
      left: 130, top: 120, fontSize: 18, fill: "#333",
      editable: true, selectable: true,
    });
    (txt as any).name = "LABEL";
    c.add(txt);
    c.setActiveObject(txt);
    c.requestRenderAll();
    startOverlayEdit(txt); // 바로 편집
  };

  const removeSelected = () => {
    const c = canvasRef.current; if (!c) return;
    const targets = c.getActiveObjects();
    if (targets.length === 0) return;
    targets.forEach((o: any) => c.remove(o));
    c.discardActiveObject();   // 체이닝 금지
    c.requestRenderAll();
  };

  const onZoomClick = (factor: number) => {
    const c = canvasRef.current; if (!c) return;
    const next = Math.min(4, Math.max(0.25, zoom * factor));
    c.setZoom(next);
    setZoom(next);
  };

  // 저장 시 SVG에 <title> 주입
  const injectTitle = (svg: string, title: string) => {
    if (!title?.trim()) return svg;
    const safe = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // <svg ...> 바로 뒤에 <title> 삽입
    return svg.replace(/<svg([^>]*)>/, `<svg$1>\n  <title>${safe}</title>`);
  };

  const handleSave = () => {
    const c = canvasRef.current; if (!c) return;
    const raw = c.toSVG({ suppressPreamble: false });
    const stamped = injectTitle(raw, docTitle);
    onSave(stamped); // 부모 API 변경 없음
  };

  // 키보드 Delete/Backspace로 삭제
  useEffect(() => {
    if (!open) return;

    const isTypingEl = (el: any) => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || (el as any).isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (isTypingEl(e.target) || editorOpen) return;
      const c = canvasRef.current; if (!c) return;
      const targets = c.getActiveObjects();
      if (targets.length === 0) return;
      e.preventDefault();
      targets.forEach((o: any) => c.remove(o));
      c.discardActiveObject();
      c.requestRenderAll();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, editorOpen]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>도면 만들기</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {/* 도면 제목 입력 (새로 추가) */}
          <TextField
            size="small"
            label="도면 제목 (예: 본관 4층)"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            sx={{ minWidth: 240 }}
          />

          <ToggleButtonGroup
            exclusive value={snap ? "snap" : ""}
            onChange={() => setSnap(v => !v)} size="small"
          >
            <ToggleButton value="snap">{snap ? "스냅 ON" : "스냅 OFF"}</ToggleButton>
          </ToggleButtonGroup>

          <Button size="small" onClick={addRect}>사각형</Button>
          <Button size="small" onClick={addText}>텍스트</Button>
          <Button size="small" color="error" onClick={removeSelected}>삭제</Button>

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button size="small" onClick={() => onZoomClick(1.25)}>확대</Button>
            <Button size="small" onClick={() => onZoomClick(0.8)}>축소</Button>
            <Button size="small" onClick={() => { canvasRef.current?.setZoom(1); setZoom(1); }}>원본</Button>
          </Stack>
        </Stack>

        <Box ref={wrapRef} sx={{ border: "1px solid #eee", width, height, position: "relative" }}>
          {editorOpen && (
            <input
              ref={editorInputRef}
              value={editorVal}
              onChange={(e) => setEditorVal(e.target.value)}
              onBlur={() => commitOverlayEdit(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitOverlayEdit(true);
                else if (e.key === "Escape") commitOverlayEdit(false);
              }}
              style={editorStyle}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSave}>저장</Button>
      </DialogActions>
    </Dialog>
  );
}
