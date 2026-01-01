export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("wf_token");
}

export function setAuthToken(token: string) {
  window.localStorage.setItem("wf_token", token);
}

export function clearAuthToken() {
  window.localStorage.removeItem("wf_token");
}
