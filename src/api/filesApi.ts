import { api } from "./coreflowApi";

export async function uploadFloorMap(svgString: string) {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const fd = new FormData();
  fd.append("file", blob, `floor-${Date.now()}.svg`);
  
  const res = await api.post("/rooms/floormaps", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { url: string, filename: string }; 
}