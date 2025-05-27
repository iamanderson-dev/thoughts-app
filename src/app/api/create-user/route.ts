// /app/api/create-user/route.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Helper function to generate a unique username on the server
// This needs to be robust. Consider adding more complex suffix generation or retries.
async function generateUniqueUsernameInDB(
  supabaseAdmin: SupabaseClient,
  baseUsername: string,
  userIdForSuffix: string // Use part of user ID for more uniqueness in suffix
): Promise<string> {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_{2,}/g, '_').slice(0, 20);
  if (!username) username = "user"; // Fallback if base is empty after sanitization

  let suffix = 0;
  const shortId = userIdForSuffix.substring(0, 4); // Short part of user ID

  while (true) {
    const attemptUsername = suffix === 0 ? username : `${username}_${shortId}${suffix > 1 ? suffix : ''}`;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", attemptUsername)
      .maybeSingle(); // Use maybeSingle to not error if not found

    if (error && error.code !== "PGRST116") { // PGRST116 means 0 rows found (good)
      console.error("API: DB error checking username uniqueness:", error);
      throw new Error(`Database error during username check: ${error.message}`);
    }
    if (!data) { // Username is unique
      return attemptUsername;
    }
    suffix++;
    if (suffix > 50) { // Safety break
      console.warn(`API: Could not generate unique username for base '${baseUsername}' after 50 attempts.`);
      // Fallback to a more random username
      return `${username}_${shortId}_${Date.now().toString().slice(-5)}`;
    }
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("API: Missing Supabase URL or Service Role Key in .env.local");
    return NextResponse.json(
      { error: "Server configuration error: Missing Supabase credentials." },
      { status: 500 }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id: userId, name, username: initialUsername, email } = requestBody;

  if (!userId || !name || !initialUsername || !email) {
    return NextResponse.json(
      { error: "Missing required fields: id, name, username, email." },
      { status: 400 }
    );
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Check if a profile with this ID already exists (idempotency)
    const { data: existingProfileById, error: selectByIdError } = await supabaseAdmin
      .from("users")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();

    if (selectByIdError && selectByIdError.code !== "PGRST116") {
      console.error("API: DB error checking existing profile by ID:", selectByIdError);
      return NextResponse.json({ error: `Database error: ${selectByIdError.message}` }, { status: 500 });
    }

    if (existingProfileById) {
      console.log(`API: Profile for user ID ${userId} already exists (username: ${existingProfileById.username}). Skipping creation.`);
      return NextResponse.json(
        { message: "Profile already exists.", data: existingProfileById, status: "skipped" },
        { status: 200 } // 200 OK as the state is as requested (profile exists)
      );
    }

    // 2. Generate a final unique username on the server
    const finalUsername = await generateUniqueUsernameInDB(supabaseAdmin, initialUsername, userId);
    console.log(`API: For initial username '${initialUsername}', generated final unique username '${finalUsername}' for user ${userId}`);

    // 3. Insert the new user profile
    const { data: newUserProfile, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        name: name,
        username: finalUsername,
        email: email,
        joined_at: new Date().toISOString(), // Handled by DB default or set here
        // profile_image_url: null, // Default
        // bio: null, // Default
      })
      .select() // Select all columns of the newly inserted row
      .single(); // Expect exactly one row

    if (insertError) {
      console.error("API: Error inserting new user profile:", insertError);
      // This could be a race condition if the username became non-unique *after* generateUniqueUsernameInDB
      // or if the ID check somehow missed an existing profile (very unlikely with proper DB constraints)
      if (insertError.message.includes("users_username_key")) {
        return NextResponse.json({ error: `Username '${finalUsername}' became taken during insert. Please try signing up again.` }, { status: 409 }); // 409 Conflict
      }
      if (insertError.message.includes("users_pkey")) { // duplicate key for ID
        return NextResponse.json({ error: "Profile creation conflict (ID). It might have been created concurrently. Please try logging in." }, { status: 409 });
      }
      return NextResponse.json({ error: `Failed to create profile: ${insertError.message}`, details: insertError.details }, { status: 500 });
    }

    console.log("API: User profile created successfully:", newUserProfile);
    return NextResponse.json(
      { message: "User profile created successfully.", data: newUserProfile, status: "created" },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    console.error("API: Unexpected error in /api/create-user POST:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}