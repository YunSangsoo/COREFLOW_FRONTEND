import React, { useEffect, useRef, useState } from "react";
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom";

const PanZoom: any = UncontrolledReactSVGPanZoom; // 타입 우회

export type PickerPayload = { elementId?: string; xPct: number; yPct: number };

export default function FloorPlanSVG({
  svgUrl,
  width = 800,
  height = 480,
  picker,
}: {
  svgUrl?: string;
  width?: number;
  height?: number;
  picker?: {
    enable: boolean;
    onPick: (p: PickerPayload) => void;
    highlightId?: string; // 선택된 id 하이라이트
    pin?: { xPct: number; yPct: number }; // 좌표 마커 표시
  };
}) {
  const panRef = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState(false);


  useEffect(() => setError(false), [svgUrl]);


  useEffect(() => {
    const t = setTimeout(() => {
      try { panRef.current?.fitToViewer?.(); } catch { }
    }, 0);
    return () => clearTimeout(t);
  }, [svgUrl, width, height]);


  if (!svgUrl) {
    return <div style={{ color: "#888" }}>상세 위치 이미지가 없습니다.</div>;
  }


  const handlePick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!picker?.enable || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    const target = e.target as SVGElement;
    const elementId = target?.id || undefined;
    picker.onPick({ elementId, xPct, yPct });
  };
  return (
    <div style={{ width, height }}>
      <PanZoom
        ref={panRef}
        width={width}
        height={height}
        background="transparent"
        tool="auto"
        detectAutoPan={false}
        toolbarProps={{ position: "none" } as any}
        miniatureProps={{ position: "none" } as any}
      >
        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" onClick={handlePick}>
          {!error ? (
            <image href={svgUrl} x="0" y="0" width="100%" height="100%" onError={() => setError(true)} />
          ) : (
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#888">
              이미지를 불러오지 못했습니다.
            </text>
          )}


          {/* 핀(좌표 마커) */}
          {picker?.pin && (
            <circle cx={`${picker.pin.xPct * 100}%`} cy={`${picker.pin.yPct * 100}%`} r={8} fill="#ff4081" fillOpacity={0.7} />
          )}


          {/* 단순 하이라이트(외부 이미지이므로 id fill 변경은 불가 → 마커 텍스트로 표기) */}
          {picker?.highlightId && (
            <text x="8" y="20" fontSize="12" fill="#1976d2">선택 ID: {picker.highlightId}</text>
          )}
        </svg>
      </PanZoom>
    </div>
  );
}