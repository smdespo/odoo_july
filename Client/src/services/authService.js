import { create } from "zustand";
import * as authService from "../services/authService";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("transitops_user") || "null"),
  token: localStorage.getItem("transitops_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem("transitops_token", token);
      localStorage.setItem("transitops_user", JSON.stringify(user));
      set({ user, token, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  signup: async ({ name, email, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.signup({ name, email, password, role });
      localStorage.setItem("transitops_token", token);
      localStorage.setItem("transitops_user", JSON.stringify(user));
      set({ user, token, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null });
  },
}));

export default useAuthStore;