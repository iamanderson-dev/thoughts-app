// lib/utils.ts
import { supabase } from "@/lib/supabase/client"; // Adjust path as needed

export async function generateUniqueUsername(base: string): Promise<string> {
  let username = base;
  let suffix = 1;
  while (true) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") { // PGRST116: "Exact one row expected, but 0 rows were found"
        console.error("Error checking username uniqueness:", error);
        throw new Error(error.message); // Re-throw actual errors
    }
    if (!data) break; // Username is unique if no data is found (or error was PGRST116 and data is null)
    username = `${base}${suffix}`;
    suffix++;
  }
  return username;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "An unknown error occurred";
  }
}