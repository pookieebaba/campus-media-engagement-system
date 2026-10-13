import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { login as apiLogin, getMe as apiGetMe, logout as apiLogout } from '../api/auth.api.js';

// ─── State shape ────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

// ─── Actions ────────────────────────────────────────────────────────────────
const SET_USER = 'SET_USER';
const CLEAR_USER = 'CLEAR_USER';
const SET_LOADING = 'SET_LOADING';

function authReducer(state, action) {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case CLEAR_USER:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case SET_LOADING:
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, try to restore session via /api/auth/me
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: SET_LOADING, payload: true });

    apiGetMe()
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: SET_USER, payload: res.data.user ?? res.data });
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: CLEAR_USER });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    const user = res.data.user ?? res.data;
    dispatch({ type: SET_USER, payload: user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Swallow — clear state regardless
    }
    dispatch({ type: CLEAR_USER });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
