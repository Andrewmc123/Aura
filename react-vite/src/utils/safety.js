// Safety helpers — report content, block people, and read launch settings.
import { useEffect, useState } from "react";

const json = { "Content-Type": "application/json" };

export async function reportContent(targetType, targetId, reason, details) {
  const res = await fetch("/api/moderation/reports", {
    method: "POST",
    headers: json,
    credentials: "include",
    body: JSON.stringify({ target_type: targetType, target_id: targetId, reason, details }),
  });
  return res.ok;
}

export async function blockUser(userId) {
  const res = await fetch(`/api/moderation/blocks/${userId}`, { method: "POST", credentials: "include" });
  return res.ok;
}

export async function unblockUser(userId) {
  const res = await fetch(`/api/moderation/blocks/${userId}`, { method: "DELETE", credentials: "include" });
  return res.ok;
}

export async function fetchBlocked() {
  const res = await fetch("/api/moderation/blocks", { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json()).blocked || [];
}

// ---- public launch settings (/api/config), fetched once and shared ----
const DEFAULT_CONFIG = { purchases_enabled: false, support_email: "", minimum_age: 13 };
let configPromise = null;

export function loadAppConfig() {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then((r) => (r.ok ? r.json() : DEFAULT_CONFIG))
      .then((d) => ({ ...DEFAULT_CONFIG, ...d }))
      .catch(() => DEFAULT_CONFIG);
  }
  return configPromise;
}

export function useAppConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  useEffect(() => {
    let alive = true;
    loadAppConfig().then((c) => alive && setConfig(c));
    return () => { alive = false; };
  }, []);
  return config;
}
