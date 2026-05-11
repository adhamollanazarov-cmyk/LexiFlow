const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export const API_ROUTES = {
  translate: `${API_BASE}/api/translate`,
  explain: `${API_BASE}/api/explain`,
  vocabulary: `${API_BASE}/api/vocabulary`,
  userMe: `${API_BASE}/api/user/me`,
  userActivity: `${API_BASE}/api/user/activity`,
  telegramConnect: `${API_BASE}/api/telegram/connect`,
  telegramStatus: `${API_BASE}/api/telegram/status`,
  telegramTest: `${API_BASE}/api/telegram/test`,
};
