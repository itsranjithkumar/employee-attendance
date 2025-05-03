"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { api } from "../../utils/api"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await api.post("/signup", { name, email, password })
      router.push("/auth/login")
    } catch (err) {
      let detail = "Signup failed"
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "detail" in err.response.data
      ) {
        detail = (err.response.data as { detail: string }).detail || detail
      }
      setError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-stretch">
      {/* Left: Form Section */}
      <section className="flex flex-col justify-center w-full md:w-1/2 px-6 sm:px-10 py-14 bg-white z-10 relative">
        <div className="max-w-[400px] w-full mx-auto">
          <div className="mb-12">
            <h1 className="text-[38px] font-semibold text-black tracking-tight mb-2">Create account</h1>
            <p className="text-[#666] text-[18px] font-normal">Join Employee Attendance Management</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[#333] text-[15px] font-medium">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Appleseed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-[#333] text-[15px] font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[#333] text-[15px] font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200"
                required
              />
              <p className="text-[#666] text-[13px]">Password must be at least 8 characters long.</p>
            </div>

            {error && (
              <div className="text-[#d93025] text-[14px] font-medium bg-[#fce8e6] rounded-lg py-3 px-4">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] mt-2 bg-[#000] text-white font-medium rounded-lg hover:bg-[#333] active:bg-[#000] transition-colors duration-200 text-[16px] disabled:opacity-70"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-10 text-center text-[#666] text-[16px]">
            Already have an account?{" "}
            <a href="/auth/login" className="text-[#000] font-medium hover:underline">
              Sign in
            </a>
          </div>

          <div className="mt-16 pt-6 border-t border-[#eaeaea]">
            <p className="text-[#666] text-[13px] leading-5">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-[#000] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#000] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Right: Image Section */}
      <section className="hidden md:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80"
          alt="Signup background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="max-w-md text-white">
            <h2 className="text-[48px] font-bold leading-tight mb-4">Attendance is the first step.</h2>
            <h3 className="text-[32px] font-medium leading-tight mb-6">To achievement.</h3>
            <p className="text-[18px] text-white/90 mb-10 leading-relaxed">
              Sign up for free and enjoy access to all features for 30 days. No credit card required.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Removed the '98% Satisfaction rate' card as requested */}
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <div className="text-white text-[15px] font-medium">No credit card required</div>
                <div className="text-white/80 text-[13px]">Free 30-day trial, cancel anytime</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
