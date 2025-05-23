"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle URL error parameters
  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "NoAccount") {
      setMessage({
        type: "error",
        text: "No account found for this Google email. Please sign up first.",
      })
    } else if (error === "SessionError") {
      setMessage({
        type: "error",
        text: "Session error occurred. Please try again.",
      })
    } else if (error === "OAuthFailed") {
      setMessage({
        type: "error",
        text: "Google login failed. Please try again.",
      })
    }
  }, [searchParams])

  // Check for existing valid session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          const exists = await checkUserExists(session.user.email!)
          if (exists) {
            router.push('/dashboard')
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      }
    }
    checkSession()
  }, [router])

  // Handle Google login - redirects to callback route for validation
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      setMessage(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to initiate Google login. Please try again.'
      })
      console.error('Google login error:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Check if user exists in database
  const checkUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase().trim())
        .single()

      if (error && error.code !== "PGRST116") throw error
      return !!data
    } catch (error) {
      console.error("Database check error:", error)
      return false
    }
  }

  

  // Handle email login (magic link)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()  

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter a valid email address." })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const { data: existingUser, error: queryError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase().trim())
        .single()

      if (queryError && queryError.code !== "PGRST116") {
        throw new Error("Error checking your account")
      }

      if (existingUser) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
      }

      setMessage({
        type: "success",
        text: "If your email is registered, you'll receive a login link shortly.",
      })
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred during login. Please try again.",
      })
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 rounded-xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Think it. Write it.</h1>
          <h2 className="text-xl text-gray-400 mt-1">Log in to your thoughts account</h2>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Auth Providers */}
        <div className="space-y-3 mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="relative flex items-center justify-center w-full border border-gray-300 rounded-xl py-2 px-4 pl-10 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {/* Google SVG aligned left */}
            <svg
              aria-hidden="true"
              role="graphics-symbol"
              viewBox="0 0 20 20"
              className="absolute left-3 w-5 h-5"
              style={{ display: "block", fill: "inherit", flexShrink: 0 }}
            >
              <g>
                <path
                  d="M19.9996 10.2297C19.9996 9.54995 19.9434 8.8665 19.8234 8.19775H10.2002V12.0486H15.711C15.4823 13.2905 14.7475 14.3892 13.6716 15.0873V17.586H16.9593C18.89 15.8443 19.9996 13.2722 19.9996 10.2297Z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M10.2002 20.0003C12.9518 20.0003 15.2723 19.1147 16.963 17.5862L13.6753 15.0875C12.7606 15.6975 11.5797 16.0429 10.2039 16.0429C7.54224 16.0429 5.28544 14.2828 4.4757 11.9165H1.08301V14.4923C2.81497 17.8691 6.34261 20.0003 10.2002 20.0003Z"
                  fill="#34A853"
                ></path>
                <path
                  d="M4.47227 11.9163C4.04491 10.6743 4.04491 9.32947 4.47227 8.0875V5.51172H1.08333C-0.363715 8.33737 -0.363715 11.6664 1.08333 14.4921L4.47227 11.9163Z"
                  fill="#FBBC04"
                ></path>
                <path
                  d="M10.2002 3.95756C11.6547 3.93552 13.0605 4.47198 14.1139 5.45674L17.0268 2.60169C15.1824 0.904099 12.7344 -0.0292099 10.2002 0.000185607C6.34261 0.000185607 2.81497 2.13136 1.08301 5.51185L4.47195 8.08764C5.27795 5.71762 7.53849 3.95756 10.2002 3.95756Z"
                  fill="#EA4335"
                ></path>
              </g>
            </svg>

            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mt-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">We'll send you a magic link to log in</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white font-semibold text-base hover:bg-gray-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Checking..." : "Continue"}
          </button>
        </form>

        {/* Signup Link */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link href="/authentication/signup" className="text-black underline hover:text-gray-800">
            Sign up here.
          </Link>
        </div>
      </div>
    </div>
  )
}