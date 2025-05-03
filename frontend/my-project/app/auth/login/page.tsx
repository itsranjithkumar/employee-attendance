"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { api, setAuthToken } from "../../utils/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await api.post("/login", { email, password })
      setAuthToken(res.data.access_token)
      localStorage.setItem("token", res.data.access_token)
      router.push("/dashboard")
    } catch (err) {
      let detail = "Login failed"
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
            <h1 className="text-[38px] font-semibold text-black tracking-tight mb-2">Welcome back</h1>
            <p className="text-[#666] text-[18px] font-normal">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[#333] text-[15px] font-medium">
                  Password
                </label>
                <a href="#" className="text-[#000] text-[14px] font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200"
                required
              />
            </div>

            {error && (
              <div className="text-[#d93025] text-[14px] font-medium bg-[#fce8e6] rounded-lg py-3 px-4">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] mt-2 bg-[#000] text-white font-medium rounded-lg hover:bg-[#333] active:bg-[#000] transition-colors duration-200 text-[16px] disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-10 text-center text-[#666] text-[16px]">
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" className="text-[#000] font-medium hover:underline">
              Create account
            </a>
          </div>

          <div className="mt-16 pt-6 border-t border-[#eaeaea]">
            <p className="text-[#666] text-[13px] leading-5">
              By continuing, you agree to our{" "}
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
          src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=1200&q=80"
          alt="Login background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="max-w-md text-white">
            <h2 className="text-[48px] font-bold leading-tight mb-4">Every day counts.</h2>
            <h3 className="text-[32px] font-medium leading-tight mb-6">Make your presence matter.</h3>
            <p className="text-[18px] text-white/90 mb-10 leading-relaxed">
              Sign up for free and enjoy access to all features for 30 days. No credit card required.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div className="flex -space-x-3">
                <img
                  className="w-10 h-10 rounded-full border-2 border-white"
                  src="https://randomuser.me/api/portraits/women/12.jpg"
                  alt="User"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-white"
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-white"
                  src="https://randomuser.me/api/portraits/women/45.jpg"
                  alt="User"
                />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-black/50 flex items-center justify-center text-white text-xs font-medium">
                  +2K
                </div>
              </div>
              <p className="text-white/80 text-[15px]">
                Join <span className="text-white font-semibold">2,157+</span> other employees
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="text-white text-[28px] font-bold mb-1">98%</div>
                <div className="text-white/80 text-[14px]">Satisfaction rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                <div className="text-white text-[28px] font-bold mb-1">24/7</div>
                <div className="text-white/80 text-[14px]">Support available</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
