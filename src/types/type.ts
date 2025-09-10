export interface User {
    userNo: number;
    email: string;
    userName: string;
    profile: string;
    phone: string;
    roles: string[];
    address: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
}

// 인증상태 타입
export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

// 초기값
export const initialState:AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false
}