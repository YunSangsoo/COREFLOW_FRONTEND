import axios from "axios";
import { type CompanyPolicy } from "../types/companyPolicy";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";

const getAccessToken = () => {
    return store.getState().auth.accessToken;
};

export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/cpolicies`,
    withCredentials: true
});

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
);

export const getPolicies = async () => {
    const response = await api.get<CompanyPolicy[]>("");
    return response.data;
};

export const addPolicy = async (title:string, content:string) => {
    const response = await api.post("", {
        title,
        content
    });
    return response;
};

export const updatePolicy = async (policyId:number, modContent:string) => {
    const response = await api.patch(`/${policyId}`, {
        modContent
    });
    return response;
};

export const deletePolicy = async (policyId:number) => {
    const response = await api.delete(`/${policyId}`);
    return response;
};