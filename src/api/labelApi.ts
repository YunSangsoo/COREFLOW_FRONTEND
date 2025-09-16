// src/api/labelApi.ts
import { api } from "./coreflowApi";
import type { Label } from "../types/calendar/calendar";

// 라벨 목록
export async function fetchLabels(): Promise<Label[]> {
  const r = await api.get("/labels");
  return (r.data ?? []) as Label[];
}

// 라벨 생성
export async function createLabel(req: { labelName: string; labelColor: string }): Promise<Label> {
  const r = await api.post("/labels", req);
  return r.data as Label;
}

// 라벨 수정
export async function updateLabel(id: number, req: { labelName: string; labelColor: string }): Promise<Label> {
  const r = await api.put(`/labels/${id}`, req);
  return r.data as Label;
}

// 라벨 삭제
export async function deleteLabel(id: number): Promise<void> {
  await api.delete(`/labels/${id}`);
}
