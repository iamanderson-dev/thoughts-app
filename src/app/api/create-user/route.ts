import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Log environment variables for debugging (safely)
  console.log("Environment check:", {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  })

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables:", {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    })
    return NextResponse.json(
      { error: "Server configuration error: Missing Supabase environment variables" },
      { status: 500 },
    )
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Get user data from request
    const userData = await request.json()
    console.log("Received user data:", {
      ...userData,
      id: userData.id ? `${userData.id.substring(0, 5)}...` : "missing",
    })

    if (!userData.id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Insert the user into the users table
    const { data, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userData.id,
        name: userData.name || "",
        username: userData.username || "",
        email: userData.email || "",
      })
      .select()

    if (insertError) {
      console.error("Admin insert error:", insertError)
      return NextResponse.json(
        {
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
        { status: 500 },
      )
    }

    console.log("User created successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error in create-user API:", error)
    return NextResponse.json(
      {
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
