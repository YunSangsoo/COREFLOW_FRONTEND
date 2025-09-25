import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { LoginUser, MemberChoice, MemberVacation, PutVacation, VacationInfo, VacStatus, VacType } from "../types/vacation";

export const api = axios.create({
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

// 연차 정보 조회
export const vacInfo = async () => {
    const response = await api.get<VacationInfo[]>("/vacation/info");
    return response.data;
}

// 모든 사원 휴가 내역 조회
export const memVacationAll = async (year:number, month:number) => {
    const response = await api.get<MemberVacation[]>(`/vacation/member`,{params:{year,month}});
    return response.data;
}

// 사원 조회
export const memChoice = async (userName:string) => {
    const response = await api.get<MemberChoice[]>(`/vacation/member/search?userName=${userName}`);
    return response.data;
}

// 선택 사원 휴가 내역 조회
export const memVacation = async (userNo:number,year:number,month:number) => {
    const response = await api.get<MemberVacation[]>(`/vacation/member/${userNo}`,{params:{year,month}});
    return response.data;
}

// 휴가 승인 상태 업데이트
export const vacStatusUpdate = async (vacId:number, newState:number) => {
    const response = await api.patch<VacStatus>(`/vacation/member/${vacId}`,{status:newState});
    return response.data;
}

// 로그인 사원 프로필
export const loginUser = async () => {
    const response = await api.get<LoginUser>(`/user/profile`);
    return response.data;
}

// 로그인 사용자 휴가 조회
export const loginUserVacation = async (year:number) => {
    const response = await api.get<MemberVacation[]>(`/vacation/personal`,{params:{year}});
    return response.data;
}

// 휴가 종류 조회
export const vacType = async () => {
    const response = await api.get<VacType[]>('/vacation/type');
    return response.data;
}

// 로그인 사용자 휴가 신청
export const putVacation = async (vacationData:PutVacation) => {
    const response = await api.put<PutVacation>(`/vacation/personal`,vacationData);
    return response.status;
}