// supabase/functions/keep-alive/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Keep-alive function invoked!");

serve(async (req) => {
  try {
    // Create a Supabase client with the ANON KEY
    // These env vars are automatically available in Supabase Functions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Perform a simple, lightweight query.
    // For example, count rows in a small, existing table or a dedicated 'heartbeat' table.
    // Using { count: 'exact', head: true } is efficient as it only gets the count.
    const { error, count } = await supabaseClient
      .from('users') // Replace with a real table name
      .select('*', { count: 'exact', head: true }); // head:true means no data is returned

    if (error) throw error;

    console.log(`Successfully pinged Supabase. Count: ${count}`);
    return new Response(
      JSON.stringify({ message: "Supabase pinged successfully", count: count }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error pinging Supabase:", error);
    return new Response(
      JSON.stringify({ message: "Error pinging Supabase", error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
})