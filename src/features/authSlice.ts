import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type AuthState, type LoginResponse, type User } from "../types/type";

const stored = localStorage.getItem("auth");

const initialState: AuthState = stored
    ? JSON.parse(stored)
    : {
        accessToken: null,
        user: null,
        isAuthenticated: false,
    };
    
const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
            state.accessToken = action.payload.accessToken ?? null;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.user = action.payload.user ?? null;
            state.isAuthenticated = true;
            localStorage.setItem(
                "auth",
                JSON.stringify({
                    accessToken: action.payload.accessToken,
                    user: action.payload.user,
                    isAuthenticated: true,
                })
            );

        },
        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isAuthenticated = false;

            localStorage.removeItem("auth");
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
    }
});

export const { loginSuccess, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
