import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { NotiDetail, NotiInsert, NoticeResponse, SearchParams } from "../types/notice";

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

export const notiList = async (params:SearchParams={},) => {
    const response = await api.get<NoticeResponse[]>('/notice/main',{params});
    return response.data;
}

export const notiInsert = async (params:NotiInsert) => {
    const response = await api.post<number>('/notice/insert',params,{
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return response.data;
}

export const notiDetail = async (notiId:number) => {
    const response = await api.get<NotiDetail>(`/notice/detail/${notiId}`);
    return response.data;
}

export const notiUpdate = async (data:{notiId:number, params:NotiInsert}) => {
    const response = await api.patch<void>(`/notice/update/${data.notiId}`,data.params,{
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return response.data;
}

export const notiDelete = async (notiId:number) => {
    const response = await api.delete<void>(`/notice/detail/${notiId}`);
    return response.data;
}

export const notiInsertForm = async (params:FormData) => {
    const response = await api.post<number>('/notice/insert',params,{
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    return response.data;
}

export const notiUpdateForm = async (data:{notiId:number, params:FormData}) => {
    const response = await api.patch<number>(`/notice/update/${data.notiId}`,data.params,{
        headers: { 'Content-Type': 'multipart/form-data'},
      });
    return response.data;
}