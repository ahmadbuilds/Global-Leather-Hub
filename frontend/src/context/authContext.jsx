import React, { createContext, useContext, useEffect, useReducer } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "LOGIN":
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        loading: false,
      };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "LOGOUT":
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return { ...initialState, loading: false, accessToken: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }
      try {
        const { data } = await api.get("/users/me");
        dispatch({ type: "SET_USER", payload: data.data.user });
      } catch {
        dispatch({ type: "LOGOUT" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    fetchUser();
  }, []);

  const login = (payload) => dispatch({ type: "LOGIN", payload });
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    dispatch({ type: "LOGOUT" });
  };
  const updateUser = (updates) =>
    dispatch({ type: "UPDATE_USER", payload: updates });

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
