import { createClient } from "@supabase/supabase-js";

export const ADMIN_SUPABASE_CONFIG_ERROR =
  "后台服务缺少 Supabase 后台密钥。若你在本地预览，请先从 Vercel 拉取 .env.local；线上请检查 SUPABASE_SERVICE_ROLE_KEY。";

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: ADMIN_SUPABASE_CONFIG_ERROR, supabase: null };
  }

  return {
    error: null,
    supabase: createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}
