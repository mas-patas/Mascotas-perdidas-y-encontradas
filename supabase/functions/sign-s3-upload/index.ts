
// This function is deprecated as we have migrated to Supabase Storage.
// You can safely delete this file and folder.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "This endpoint is deprecated. Use Supabase Storage client-side." }),
    { headers: { "Content-Type": "application/json" } }
  );
});
