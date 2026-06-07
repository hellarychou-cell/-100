"use client";

import { useEffect, useState } from "react";
import { getLocalUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function CurrentUserName({ fallback = "她" }: { fallback?: string }) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const localUser = getLocalUser();
      if (localUser && !cancelled) setName(localUser.displayName);

      if (supabase) {
        const { data } = await supabase.auth.getUser();
        const displayName = data.user?.user_metadata?.display_name;
        if (displayName && !cancelled) setName(String(displayName));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{name}</>;
}
