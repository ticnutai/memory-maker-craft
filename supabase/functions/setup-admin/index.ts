import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { email, password } = await req.json();

  // Create user
  const { data: userData, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;

  // Approve profile
  await sb.from("profiles").update({ is_approved: true }).eq("user_id", userId);

  // Set admin role
  await sb.from("user_roles").insert({ user_id: userId, role: "admin" });

  return new Response(JSON.stringify({ ok: true, userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
