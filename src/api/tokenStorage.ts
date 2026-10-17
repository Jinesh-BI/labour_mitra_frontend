// Tokens and the signed-in user live in localStorage. Every access is wrapped because storage can be
// blocked (private windows, cleared site data); the app must still render without it.
const ACCESS_KEY = "lm_access";
const REFRESH_KEY = "lm_refresh";
const USER_KEY = "lm_user";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: session lasts until reload */
  }
}

export const tokenStorage = {
  getAccess: () => read(ACCESS_KEY),
  getRefresh: () => read(REFRESH_KEY),
  setAccess: (token: string) => write(ACCESS_KEY, token),
  setRefresh: (token: string) => write(REFRESH_KEY, token),
  getUserJson: () => read(USER_KEY),
  setUserJson: (json: string) => write(USER_KEY, json),
  clear: () => {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
    write(USER_KEY, null);
  },
};
