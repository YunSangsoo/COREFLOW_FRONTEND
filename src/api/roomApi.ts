import { api } from "./coreflowApi";
import type { Room, RoomCreateReq, RoomUpdateReq, RoomStatus } from "../types/rooms/room";


export async function fetchRooms(params?: {
buildingName?: string;
floor?: string;
status?: RoomStatus;
minCapacity?: number;
}): Promise<Room[]> {
const res = await api.get<Room[]>("/rooms", { params });
return res.data;
}


export async function fetchRoom(roomId: number): Promise<Room> {
const res = await api.get<Room>(`/rooms/${roomId}`);
return res.data;
}


export async function createRoom(body: RoomCreateReq): Promise<number> {
// 백엔드: ResponseEntity<Long> 반환 가정 → 생성된 roomId
const res = await api.post<number>("/rooms", body);
return res.data;
}


export async function updateRoom(roomId: number, body: RoomUpdateReq): Promise<void> {
await api.put<void>(`/rooms/${roomId}`, body);
}


export async function deleteRoom(roomId: number): Promise<void> {
await api.delete<void>(`/rooms/${roomId}`);
}