const ACCESS_TOKEN_KEY = "ehcp_access_token";
const REFRESH_TOKEN_KEY = "ehcp_refresh_token";

let inMemoryAccessToken: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);
let inMemoryRefreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

export const tokenStore = {
  getAccessToken: (): string | null => inMemoryAccessToken,
  getRefreshToken: (): string | null => inMemoryRefreshToken,
  setTokens: (accessToken: string, refreshToken: string): void => {
    inMemoryAccessToken = accessToken;
    inMemoryRefreshToken = refreshToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: (): void => {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};