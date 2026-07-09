/**
 * Local, browser-only persistence. There is no backend and no password store —
 * an "operator profile" is just a display name plus that operator's saved
 * dataset library, kept in localStorage on this machine. Guests work
 * in-session only. (A real multi-user deployment would replace this with a
 * server + authentication.)
 */

const PROFILES_KEY = "siv_profiles";
const DATA_PREFIX = "siv_ud_";

function safeParse(json, fallback) {
  if (json == null) return fallback;
  try {
    const parsed = JSON.parse(json);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/** @returns {Record<string,{name:string}>} known local profiles keyed by id. */
export function getProfiles() {
  return safeParse(localStorage.getItem(PROFILES_KEY), {});
}

export function saveProfile(id, name) {
  const profiles = getProfiles();
  profiles[id] = { name };
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getUserData(id) {
  return safeParse(localStorage.getItem(DATA_PREFIX + id), {});
}

export function saveUserData(id, data) {
  localStorage.setItem(DATA_PREFIX + id, JSON.stringify(data));
}
