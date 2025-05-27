"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"; // Adjust path

export default function SignupPage() {
  const router = useRouter()


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

  // --- MINIMAL SIGNUP TEST HANDLER ---
// In SignupPage.tsx

// const handleMinimalSignupTest = async () => {
//   console.log("Attempting minimal signup test...");
//   setErrors({});
//   setIsLoading(true);

//   try {
//     // Use a different domain for testing that's less likely to be blocked
//     const testEmail = `minimaltest_${Date.now()}@test-domain.io`; // Or .dev, .app, .co, etc.
//     // Or even better for avoiding actual mail systems, but might still be flagged:
//     // const testEmail = `minimaltest_${Date.now()}@localhost.localdomain`; // Less common, might pass
//     // const testEmail = `minimaltest_${Date.now()}@mailinator.com`; // (If you use mailinator for testing confirmed emails)


//     const testPassword = 'password123';
//     console.log(`Minimal Test: Email: ${testEmail}, Password: ${testPassword}`);

//     const { data, error } = await supabase.auth.signUp({
//       email: testEmail,
//       password: testPassword,
//       options: {
//         data: {
//           full_name: "Minimal Test User Name",
//           user_name: `minimaltestuser_${Date.now().toString().slice(-5)}`
//         }
//         // You might also want to include emailRedirectTo if testing email confirmation flow later
//         // emailRedirectTo: `${window.location.origin}/auth/callback`
//       }
//     });

//     if (error) {
//       console.error('Minimal Signup Test - Supabase Error:', error);
//       setErrors(prev => ({ ...prev, general: `Minimal Test Error: ${error.message} (Code: ${error.code || 'N/A'})` }));
//       alert(`Minimal Signup Test - Supabase Error: ${error.message}`);
//     } else {
//       console.log('Minimal Signup Test - Success:', data);
//       setErrors(prev => ({ ...prev, general: `Minimal Test Success! User ID: ${data.user?.id}` }));
//       alert('Minimal Test Success! User ID: ' + data.user?.id);
//     }
//   } catch (e: any) {
//     console.error('Minimal Signup Test - CATCH Block Error:', e);
//     setErrors(prev => ({ ...prev, general: `Minimal Test CATCH Error: ${e.message}` }));
//     alert(`Minimal Signup Test - CATCH Block Error: ${e.message}`);
//   } finally {
//     setIsLoading(false);
//   }
// };
  // --- END OF MINIMAL SIGNUP TEST HANDLER ---


  // Effect for countdown logic
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (success && countdown > 0) {
      timerId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [success, countdown]);

  // Effect for navigation when countdown reaches 0
  useEffect(() => {
    if (success && countdown === 0) {
      router.push("/dashboard");
    }
  }, [success, countdown, router]);

  // ... (validateForm, checkExistingUser, createUserProfileViaAPI, handleSubmit methods remain the same as your provided code) ...
  // Validate form inputs
  const validateForm = () => {
    const newErrors: {
      name?: string
      username?: string
      email?: string
      password?: string
    } = {}

    if (!name.trim()) newErrors.name = "Name is required";
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.includes(" ")) {
      newErrors.username = "Username cannot contain spaces";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if username or email already exists (client-side for UX)
  const checkExistingUser = async () => {
    // Clear previous username/email errors
    setErrors(prev => ({ ...prev, username: undefined, email: undefined, general: undefined }));

    try {
      const { data: usernameData, error: usernameError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username.trim())
        .maybeSingle() // Use maybeSingle to not error if not found

      if (usernameError && usernameError.code !== "PGRST116") throw usernameError;
      if (usernameData) {
        setErrors((prev) => ({ ...prev, username: "Username already taken" }));
        return false;
      }

      const { data: emailData, error: emailError } = await supabase
        .from("users") // Assuming email is also stored in your public.users table
        .select("email")
        .eq("email", email.trim())
        .maybeSingle();

      if (emailError && emailError.code !== "PGRST116") throw emailError;
      if (emailData) {
        setErrors((prev) => ({ ...prev, email: "Email already in use" }));
        return false;
      }
      return true;
    } catch (error: any) {
      console.error("Error checking existing user:", error);
      setErrors((prev) => ({
        ...prev,
        general: `Error checking user availability: ${error.message || 'Unknown error'}`,
      }));
      return false;
    }
  }

  // Call the API route to create the user profile
  const createUserProfileViaAPI = async (userId: string) => {
    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: name.trim(),
          username: username.trim(), // Send the user's desired username; API will ensure uniqueness
          email: email.trim(),
        }),
      });

      const result = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        console.error("API profile creation error response:", result);
        throw new Error(result.error || `Profile creation API error: ${response.status}`);
      }
      console.log("API profile creation success:", result);
      return result;
    } catch (error: any) {
      console.error("Error calling createUserProfileViaAPI:", error);
      // This error will be caught by handleSubmit's catch block
      throw error;
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Reset errors at the beginning
    // Do not reset success here, let it persist for the countdown

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Client-side check for UX (server-side is the source of truth)
      const isAvailable = await checkExistingUser();
      if (!isAvailable) {
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            user_name: username.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError; // This is where the "Database error saving new user" occurs

      if (authData.user) {
        console.log("Supabase Auth signup successful, user ID:", authData.user.id);
        try {
          await createUserProfileViaAPI(authData.user.id);
          setSuccess(true);
          setCountdown(3);
          setName("");
          setUsername("");
          setEmail("");
          setPassword("");
        } catch (profileApiError: any) {
          console.error("Profile creation via API failed after auth success:", profileApiError);
          setErrors(prev => ({
            ...prev,
            general: `Account created, but profile setup failed: ${profileApiError.message}. Please try logging in.`,
          }));
          setSuccess(true);
          setCountdown(5);
        }
      } else {
        throw new Error("Signup succeeded but no user data returned from Supabase Auth.");
      }
    } catch (error: any) {
      console.error("Overall signup error:", error); // The error from signUp will be caught here
      setErrors(prev => ({
        ...prev,
        general: `Signup failed: ${error.message || 'An unknown error occurred.'}`,
      }));
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 rounded-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Thoughts. Words.</h1>
          <h2 className="text-xl text-gray-400 mt-1">Create an account</h2>
        </div>

        {/* --- MINIMAL SIGNUP TEST BUTTON --- */}
        {/* <div className="my-4 p-2 border border-dashed border-blue-500">
          <h3 className="text-sm font-semibold text-blue-700 mb-2">Minimal Signup Test Area</h3>
          <button
            onClick={handleMinimalSignupTest}
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2 px-3 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            Run Minimal Signup Test
          </button>
          <p className="text-xs text-gray-500 mt-1">
            This button attempts a very basic Supabase Auth signup directly, bypassing most form logic. Check console and alerts.
          </p>
        </div>
        --- END OF MINIMAL SIGNUP TEST BUTTON --- */}


        {success && !errors.general && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">Account created successfully!</p>
            <p className="mt-1">Redirecting to dashboard in {countdown} seconds...</p>
          </div>
        )}

        {errors.general && (
          <div className={`border px-4 py-3 rounded-lg text-sm ${success ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {errors.general}
            {success && <p className="mt-1">You will be redirected in {countdown} seconds...</p> }
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* ... rest of your form JSX remains the same ... */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text" id="name" name="name" placeholder="Enter your full name..."
              value={name} onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={isLoading || success}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text" id="username" name="username" placeholder="Choose a username..."
              value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              className={`mt-1 block w-full border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={isLoading || success}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email" id="email" name="email" placeholder="Enter your email address..."
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={isLoading || success}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password" id="password" name="password" placeholder="Enter your password..."
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm`}
              disabled={isLoading || success}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full rounded-xl bg-black py-3 text-white font-semibold text-base hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : success ? (errors.general ? "Processing..." : "Account created!") : "Continue"}
          </button>
        </form>

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