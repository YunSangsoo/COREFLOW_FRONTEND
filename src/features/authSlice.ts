import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialState, type LoginResponse } from "../types/type";

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
        }
    }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;