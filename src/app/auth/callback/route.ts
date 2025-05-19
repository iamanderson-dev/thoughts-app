import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (!code) {
      return NextResponse.redirect(new URL("/authentication/signup?error=missing_code", request.url))
    }

    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    )

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(
        new URL(`/authentication/signup?error=${encodeURIComponent(exchangeError.message)}`, request.url),
      )
    }

    // Get the user after exchange
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error("Error getting user after code exchange:", userError)
      return NextResponse.redirect(
        new URL(
          `/authentication/signup?error=${encodeURIComponent(userError?.message || "User not found")}`,
          request.url,
        ),
      )
    }

    // Create a Supabase admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Check if user exists in the users table
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userData.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking if user exists:", checkError)
    }

    // If user doesn't exist in the users table, create them
    if (!existingUser) {
      const userMetadata = userData.user.user_metadata || {}

      const { error: insertError } = await supabaseAdmin.from("users").insert({
        id: userData.user.id,
        name: userMetadata.name || userData.user.email?.split("@")[0] || "User",
        username: userMetadata.username || `user_${userData.user.id.substring(0, 8)}`,
        email: userData.user.email || "",
      })

      if (insertError) {
        console.error("Error creating user in callback:", insertError)
        // Continue anyway, we don't want to block the user
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error: any) {
    console.error("Error in auth callback:", error)
    return NextResponse.redirect(
      new URL(`/authentication/signup?error=${encodeURIComponent(error.message || "Unknown error")}`, request.url),
    )
  }
}
