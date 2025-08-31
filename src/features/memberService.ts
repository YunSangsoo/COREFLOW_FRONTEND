import axios from "axios";
import type { Department, MemberDetail, MemberResponse, Position } from "../types/member";

const api = axios.create({
    baseURL : "http://localhost:8081/api",
    withCredentials : true
});

// 부서 목록 조회
export const depList = async () => {
    const response = await api.get<Department[]>("/department");
    return response.data;
}

// 직위 목록 조회
export const posList = async () => {
    const response = await api.get<Position[]>("/position");
    return response.data;
}

// 사원 목록 조회
export const memberList = async function(searchParams:{userName:string|null,depName:string|null,posName:string|null}) {
    const response = await api.get<MemberResponse[]>("/members",{params : searchParams});
    return response.data;
}

export const memberDetail = async (userNo:number) => {
    const response = await api.get<MemberDetail>(`/members/${userNo}`)
    return response.data;
} 