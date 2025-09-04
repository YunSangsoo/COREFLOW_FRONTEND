export interface User {
    userNo: number;
    email: string;
    name: string;
    profile: string;
    phone: string;
    roles: string[];
}

export interface LoginResponse {
    user: User;
    accessToken: string;
}

// 인증상태 타입
export interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

// 초기값
export const initialState:AuthState = {
    accessToken: null,
    user: null,
    isAuthenticated: false
}