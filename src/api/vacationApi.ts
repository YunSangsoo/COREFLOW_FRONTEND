import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { MemberChoice, MemberVacation, VacationInfo } from "../types/vacation";

const api = axios.create({
    baseURL : "http://localhost:8081/api",
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
                const response = await axios.post(`http://localhost:8081/api/auth/refresh`, {}, {
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

// 연차 정보 조회
export const vacInfo = async () => {
    const response = await api.get<VacationInfo[]>("/vacation/info");
    return response.data;
}

// 사원 조회
export const memChoice = async (userName:string) => {
    const response = await api.get<MemberChoice[]>(`/vacation/member?userName=${userName}`);
    return response.data;
}

// 사원 휴가 내역 조회
export const memVacation = async (userNo:number) => {
    const response = await api.get<MemberVacation[]>(`/vacation/member/${userNo}`);
    return response.data;
}