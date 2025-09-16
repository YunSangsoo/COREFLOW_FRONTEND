export type RoomStatus = "ACTIVE" | "INACTIVE";


export type Room = {
    roomId: number;
    roomName: string;
    buildingName?: string;
    floor?: string;
    roomNo?: string;
    capacity?: number;
    detailLocation?: string; // 이미지/SVG 경로 또는 비고
    status: RoomStatus;
    createDate?: string; // ISO 문자열(백엔드 Timestamp 직렬화 결과)
    updateDate?: string;
    createUserNo?: number;
    updateUserNo?: number;
};


export type RoomCreateReq = {
    roomName: string;
    buildingName?: string;
    floor?: string;
    roomNo?: string;
    capacity?: number;
    detailLocation?: string;
    status?: RoomStatus; // 기본값 ACTIVE (백엔드에서 처리 가능)
};


export type RoomUpdateReq 
= Partial<Omit<Room, "roomId" | "createDate" | "updateDate" | "createUserNo" | "updateUserNo">>;