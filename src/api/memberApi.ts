import axios from "axios";
import type { Department, DepartmentDetail, MemberDetail, MemberPatch, MemberResponse, Position } from "../types/member";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";

const api = axios.create({
    baseURL: "http://localhost:8081/api",
    withCredentials: true
});

const getAccessToken = () => {
    return store.getState().auth.accessToken;
}

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (err) => {
        const originalRequest = err.config;

        // api 서버로부터 응답받은 상태코드가 401인 경우 refresh토큰을 활용한 accessToken 재발급
        if (err.response?.status === 401) {
            try {
                const response = await axios.post(`http://localhost:8081/api/auth/refresh`, {}, {
                    withCredentials: true
                });
                // 응답성공시 accessToken을 다시 메모리에 저장
                store.dispatch(loginSuccess(response.data))
                // 기존 요청 재시도
                return api(originalRequest);
            } catch (refreshError) {
                // 토큰 갱신 실패시 처리코드
                store.dispatch(logout());
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(err);
    }
)

// 부모 부서 조회
export const depList = async () => {
    const response = await api.get<Department[]>("/departments");
    return response.data;
}

// 자식 부서 조회
export const depDetailList = async (parentId: number) => {
    const response = await api.get<DepartmentDetail[]>(`/departments/${parentId}`);
    return response.data;
}

// 직위 목록 조회
export const posList = async () => {
    const response = await api.get<Position[]>("/positions");
    return response.data;
}

// 사원 목록 조회
export const memberList = async function (searchParams: { userName: string, depName: string, posName: string, status: string }) {
    const response = await api.get<MemberResponse[]>("/members", { params: searchParams });
    return response.data;
}

// 사원 상세 조회
export const memberDetail = async (userNo: number) => {
    const response = await api.get<MemberDetail>(`/members/${userNo}`)
    return response.data;
}

// 사원 정보 수정
// export const memberUpdate = async (userNo: number, updatedMember: MemberPatch) => {
//     const response = await api.patch<void>(`/members/${userNo}`, updatedMember)
//     return response.status;
// }

// 사원 정보 수정
export const memberUpdate = async (userNo: number, updatedMember: FormData) => {
    const response = await api.patch<void>(`/members/${userNo}`, updatedMember,{
        headers: { 'Content-Type': 'multipart/form-data'},
    })
    return response.data;
}

export const memberDelete = async (userNo: number) => {
    const response = await api.delete<void>(`/members/${userNo}`)
    return response.status;
}

export const memberCreate = async (formData: FormData) => {
    try {
        const response = await api.post('/members', formData);
        return response.data;
    } catch (error: any) {
        // 필요시 error 처리
        throw new Error(error.response?.data?.message || '사원 생성 실패');
    }
};