const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export const API_ROUTES = {
  translate: `${API_BASE}/api/translate`,
  detectLanguage: `${API_BASE}/api/detect-language`,
  explain: `${API_BASE}/api/explain`,
  vocabulary: `${API_BASE}/api/vocabulary`,
  reviewDue: `${API_BASE}/api/review/due`,
  reviewSubmit: `${API_BASE}/api/review/submit`,
  reviewStats: `${API_BASE}/api/review/stats`,
  reviewWord: (wordId: string) => `${API_BASE}/api/review/${wordId}`,
  userMe: `${API_BASE}/api/user/me`,
  userActivity: `${API_BASE}/api/user/activity`,
  userPreferences: `${API_BASE}/api/user/preferences`,
  telegramConnect: `${API_BASE}/api/telegram/connect`,
  telegramStatus: `${API_BASE}/api/telegram/status`,
  telegramTest: `${API_BASE}/api/telegram/test`,
};
