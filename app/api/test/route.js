import { supabase } from "../../lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabase.from("users").select("*").limit(1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
