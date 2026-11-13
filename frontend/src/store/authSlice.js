import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to restore saved user:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;

      state.token = action.payload.token;
    },

    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { login, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
