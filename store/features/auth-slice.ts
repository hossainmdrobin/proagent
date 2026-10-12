import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PublicUser } from "@/store/features/auth-api";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  currentUser: PublicUser | null;
  status: AuthStatus;
  initialized: boolean;
  pendingVerificationEmail: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  status: "idle",
  initialized: false,
  pendingVerificationEmail: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionLoading(state) {
      state.status = "loading";
    },
    sessionLoaded(state, action: PayloadAction<PublicUser | null>) {
      state.currentUser = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
      state.initialized = true;

      if (action.payload?.isEmailVerified) {
        state.pendingVerificationEmail = null;
      }
    },
    setPendingVerificationEmail(state, action: PayloadAction<string | null>) {
      state.pendingVerificationEmail = action.payload;
    },
    clearSession(state) {
      state.currentUser = null;
      state.status = "unauthenticated";
      state.initialized = true;
    },
  },
  selectors: {
    selectCurrentUser: (state) => state.currentUser,
    selectAuthStatus: (state) => state.status,
    selectIsInitialized: (state) => state.initialized,
    selectPendingVerificationEmail: (state) => state.pendingVerificationEmail,
    selectIsAuthenticated: (state) => state.status === "authenticated",
  },
});

export const { sessionLoading, sessionLoaded, setPendingVerificationEmail, clearSession } =
  authSlice.actions;
export const {
  selectCurrentUser,
  selectAuthStatus,
  selectIsInitialized,
  selectPendingVerificationEmail,
  selectIsAuthenticated,
} = authSlice.selectors;
export const authReducer = authSlice.reducer;
