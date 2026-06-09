import { supabase } from "./supabase";

export type LocalUser = {
  id: string;
  phone: string;
  email?: string;
  displayName: string;
  isMember: boolean;
  membershipExpiresAt?: string;
};

export const LOCAL_USER_KEY = "chengta.localUser";
export const LOCAL_PROFILE_KEY = "chengta.assessmentProfile";
export const LOCAL_RESULT_KEY = "chengta.assessmentResult";
export const LOCAL_PROGRESS_KEY = "chengta.progress";

export function isMembershipActive(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now());
}

export async function getSupabaseUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    window.localStorage.removeItem(LOCAL_USER_KEY);
    return null;
  }
}

export function setLocalUser(user: LocalUser) {
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

export function clearLocalUser() {
  window.localStorage.removeItem(LOCAL_USER_KEY);
}
