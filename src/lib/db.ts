import { createClient as createAdmin } from "@supabase/supabase-js";

export function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Fetch profiles by IDs and return a map id -> profile
export async function fetchProfiles(admin: ReturnType<typeof getAdmin>, ids: string[]) {
  const unique = ids.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  if (!unique.length) return {} as Record<string, any>;
  const { data } = await admin.from("profiles").select("id,username,avatar_url,is_verified,rating_avg,sales_count").in("id", unique);
  return Object.fromEntries((data ?? []).map((p: any) => [p.id, p]));
}
