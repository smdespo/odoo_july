export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const mockDelay = (ms = 350) => new Promise((res) => setTimeout(res, ms));