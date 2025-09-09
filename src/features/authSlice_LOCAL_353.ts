import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type AuthState, type LoginResponse } from "../types/type";

const stored = localStorage.getItem("auth");

const initialState: AuthState = stored
  ? JSON.parse(stored)
  : {
      accessToken: null,
      user: null,
      isAuthenticated: false,
    };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<LoginResponse>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
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
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;