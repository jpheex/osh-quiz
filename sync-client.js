const USER_ID_KEY = "oshQuizUserId_v1";
const API_PATH = "/api/sync";
const REQUEST_TIMEOUT_MS = 8000;

export function getUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return "offline-user";
  }
}

export function formatUserId(id) {
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

async function request(method, { userId, progress, session, appVersion } = {}) {
  const url =
    method === "GET" || method === "DELETE"
      ? `${API_PATH}?userId=${encodeURIComponent(userId || getUserId())}`
      : API_PATH;

  const init = {
    method,
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };

  if (method === "PUT") {
    init.body = JSON.stringify({
      userId: userId || getUserId(),
      progress,
      session,
      appVersion,
    });
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function pullFromCloud(userId = getUserId()) {
  return request("GET", { userId });
}

export async function pushToCloud({ progress, session, appVersion, userId = getUserId() }) {
  return request("PUT", { userId, progress, session, appVersion });
}

export async function resetCloud(userId = getUserId()) {
  return request("DELETE", { userId });
}

export function mergeProgress(localState, remoteProgress) {
  if (!remoteProgress) return localState;
  if (!localState?.updatedAt) return { ...localState, ...remoteProgress };
  if (!remoteProgress.updatedAt) return remoteProgress;
  return new Date(remoteProgress.updatedAt) >= new Date(localState.updatedAt)
    ? { ...localState, ...remoteProgress }
    : localState;
}
