import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { MemberResponse } from "../types/member";
import type { Department, DepartmentDetail } from "../types/organization";

const api = axios.create({
    baseURL : import.meta.env.VITE_API_BASE_URL,
    withCredentials : true
});

const getAccessToken = () => {
    return store.getState().auth.accessToken;
}

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if(token){
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
        if(err.response?.status === 401){
            try{
                const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials:true
                });
                // 응답성공시 accessToken을 다시 메모리에 저장
                store.dispatch(loginSuccess(response.data))
                // 기존 요청 재시도
                return api(originalRequest);
            }catch(refreshError){
                // 토큰 갱신 실패시 처리코드
                store.dispatch(logout());
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(err);
    }
)

// 1. 부서 조회
export const parentDeptList = async () => {
    const response = await api.get<Department[]>('/organization/departments');
    return response.data;
}

// 2. 부서별 팀 조회
export const childDeptList = async (parentId:number) => {
    const response = await api.get<DepartmentDetail[]>(`/organization/departments/${parentId}`);
    return response.data;
}

// 3. 팀별 사원 조회
export const memberList = async (depId:number) => {
    const response = await api.get<MemberResponse[]>(`/organization/members/${depId}`);
    return response.data;
}