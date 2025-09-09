import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialState, type LoginResponse, type User } from "../types/type";

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
            state.accessToken = action.payload.accessToken ?? null;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.user = action.payload.user ?? null;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.isAuthenticated = false;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
    }
});

export const { loginSuccess, logout, setUser } = authSlice.actions;
export default authSlice.reducer;