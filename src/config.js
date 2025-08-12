// src/config.js (CRA)
// Aceita REACT_APP_API_URL com ou sem /api no final.
// Ex.: https://backend-webbuses.onrender.com  OU  https://backend-webbuses.onrender.com/api
const RAW = (process.env.REACT_APP_API_URL || "https://backend-webbuses.onrender.com").replace(/\/+$/, "");

// Host base (sem /api)
export const API_BASE = RAW.replace(/\/api$/i, "");

// Endpoint principal da API (com /api)
export const API = RAW.toLowerCase().endsWith("/api") ? RAW : `${RAW}/api`;

// 🔧 COMPAT: muitos arquivos importam { API_URL } – mantém apontando para API com /api
export const API_URL = API;

// Alias usado pelo Painel Admin (/admin)
export const ADMIN_ENDPOINT = `${API_BASE}/admin`;

/* Helpers */
async function handle(res) {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${t}`.trim());
  }
  return res;
}

export async function apiGet(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  return handle(res);
}

export async function apiJson(path, body, method = "POST", opts = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: JSON.stringify(body ?? {}),
    ...opts,
  });
  const ok = await handle(res);
  return ok.json();
}

export async function apiUpload(path, formData, method = "POST", opts = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    body: formData, // não setar Content-Type manualmente
    ...(opts || {}),
  });
  const ok = await handle(res);
  return ok.json();
}
