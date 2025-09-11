import { configureStore } from "@reduxjs/toolkit";
import auth from "../features/authSlice"
import chat from "../features/chatSlice"

export const store = configureStore({
    reducer: {
        auth,
        chat
    }
});

export type RootState = ReturnType<typeof store.getState>;