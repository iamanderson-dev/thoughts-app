"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [errors, setErrors] = useState<{
    name?: string
    username?: string
    email?: string
    password?: string
    general?: string
  }>({})

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Handle redirect after successful signup
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (success) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push("/dashboard")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [success, router])

  // Validate form inputs
  const validateForm = () => {
    const newErrors: {
      name?: string
      username?: string
      email?: string
      password?: string
    } = {}

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    // Username validation
    if (!username.trim()) {
      newErrors.username = "Username is required"
    } else if (username.includes(" ")) {
      newErrors.username = "Username cannot contain spaces"
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if username or email already exists
  const checkExistingUser = async () => {
    try {
      // Check if username exists
      const { data: usernameData, error: usernameError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single()

      if (usernameError && usernameError.code !== "PGRST116") {
        console.error("Username check error:", usernameError)
        throw usernameError
      }

      if (usernameData) {
        setErrors((prev) => ({ ...prev, username: "Username already taken" }))
        return false
      }

      // Check if email exists
      const { data: emailData, error: emailError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single()

      if (emailError && emailError.code !== "PGRST116") {
        console.error("Email check error:", emailError)
        throw emailError
      }

      if (emailData) {
        setErrors((prev) => ({ ...prev, email: "Email already in use" }))
        return false
      }

      return true
    } catch (error: any) {
      console.error("Error checking existing user:", error)
      setErrors((prev) => ({
        ...prev,
        general: `Error checking user: ${error.message || JSON.stringify(error)}`,
      }))
      return false
    }
  }

  // Direct insert using fetch to bypass client-side limitations
  const insertUserViaAPI = async (userId: string) => {
    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          name,
          username,
          email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error: any) {
      console.error("API insert error:", error)
      throw error
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset states
    setErrors({})
    setSuccess(false)

    // Validate form
    const isValid = validateForm()
    if (!isValid) return

    setIsLoading(true)

    try {
      // Check if username or email already exists
      const isAvailable = await checkExistingUser()
      if (!isAvailable) {
        setIsLoading(false)
        return
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error("Auth error:", authError)
        throw authError
      }

      // If auth successful, try different approaches to insert user data
      if (authData.user) {
        const userId = authData.user.id

        // Skip direct insert and go straight to API approach
        try {
          await insertUserViaAPI(userId)
        } catch (apiError: any) {
          console.error("API insert failed:", apiError)
          // Continue anyway since auth worked
        }

        // Show success message and prepare for redirect
        setSuccess(true)
        setCountdown(3)

        // Clear form
        setName("")
        setUsername("")
        setEmail("")
        setPassword("")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setErrors({
        general: `Signup error: ${error.message || JSON.stringify(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 rounded-xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Thoughts. Words.</h1>
          <h2 className="text-xl text-gray-400 mt-1">Create an account</h2>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">Account created successfully!</p>
            <p className="mt-1">Redirecting to dashboard in {countdown} seconds...</p>
          </div>
        )}

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={success}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username..."
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              className={`mt-1 block w-full border ${
                errors.username ? "border-red-500" : "border-gray-300"
              } rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={success}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Email */}
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
              className={`mt-1 block w-full border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={success}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={success}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full rounded-xl bg-black py-3 text-white font-semibold text-base hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : success ? "Account created!" : "Continue"}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/authentication/login" className="text-black underline hover:text-gray-800">
            Sign in here.
          </Link>
        </div>
      </div>
    </div>
  )
}
