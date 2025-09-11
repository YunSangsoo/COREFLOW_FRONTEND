import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { Attendance, PostCheckInTime, PutCheckOutTime, VacType} from "../types/attendance";

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

// 사원 근퇴 기록 조회(일별)
export const memAttendance = async (attDate:string,userNo:number|null) => {
    const userNoParam = userNo != null ? `&userNo=${userNo}` : ''
    const response = await api.get<Attendance[]>(`/attendance/member?attDate=${attDate}${userNoParam}`);
    return response.data;  
}

// 로그인 사용자 근퇴 기록 조회(월별)
export const loginUserAttendance = async (year:number,month:number) => {
    const response = await api.get<Attendance[]>(`/attendance/personal`,{params:{year,month}});
    return response.data;
}

// 출근시간 넣기
export const checkIn = async (checkInRequest : PostCheckInTime) => {
    const response = await api.post('/attendance/checkIn',checkInRequest);
    return response.data;
}

// 퇴근시간 넣기
export const checkOut = async (checkOutRequest : PutCheckOutTime) => {
    const response = await api.patch('/attendance/checkOut',checkOutRequest);
    return response.status;
}

// 비고 종류 조회
export const vacType = async () => {
    const response = await api.get<VacType[]>('/attendance/vacType');
    return response.data;
}