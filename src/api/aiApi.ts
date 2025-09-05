import axios from "axios";
import { store } from "../store/store";
import { loginSuccess, logout } from "../features/authSlice";
import type { AiChatSession, message } from "../types/aiTypes";

const getAccessToken = () => {
    return store.getState().auth.accessToken;
};

export const api = axios.create({
    baseURL: "http://localhost:8081/api/ai",
    withCredentials: true
});

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if (token) {
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
);

export const getSessions = async () => {
    const response = await api.get<AiChatSession[]>("/sessions");
    return response.data;
};

export const checkUsedBefore = async () => {
    const response = await api.get<boolean>("/checkUsedBefore");
    return response.data;
};

export const updateAiUsage = async () => {
    const response = await api.patch("/updateAiUsage");
    return response;
};

export const sendPrompt = async (messages:message[]) => {
    const response = await axios.post("http://192.168.10.216:8000/chat", {messages});
    return response.data;
};

export const createTitle = async (prompt:string) => {
    const response = await axios.post("http://192.168.10.216:8000/create_title", {message:prompt});
    return response.data;
};

export const insertAiUsage = async (tokensUsed:number) => {
    const response = await api.post("/insertAiUsage", {tokensUsed});
    return response;
};