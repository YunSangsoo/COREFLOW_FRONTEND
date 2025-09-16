export interface User {
    userNo: number;
    email: string;
    userName: string;
    depId: number;
    posId: number;
    profile: string;
    roles: string[];
    hireDate: Date;
    phone?: string;
    address?: string;
    addressDetail?: string;
    status: string;
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

export interface customFile {
    imgId:number;
    imageCode:string;
    originName:string;
    changeName:string;
    imgOrder?:number;
    refId:number;
}