"use client"
import React, { useState, useEffect } from "react"

import { useRouter } from "next/navigation"
import { api, setAuthToken } from "../../utils/api"
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleAuthButton from '../../../components/GoogleAuthButton';

export default function LoginPage() {
  // Ensure Authorization header is set on every page load if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);
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
      // Debug logging
      console.log("JWT token stored:", res.data.access_token);
      console.log("API Base URL:", api.defaults.baseURL);
      router.push("/dashboard")
    } catch {
      setError("Login failed");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row items-stretch bg-white">
      {/* Left: Form Section */}
      <section className="flex flex-col justify-center items-center w-full md:w-1/2 px-4 sm:px-10 py-8 sm:py-14 bg-white z-10 relative min-h-[60vh] md:min-h-screen">
        <div className="max-w-[400px] w-full flex flex-col items-center">
          <div className="mb-8 sm:mb-12 md:mb-16 w-full text-center md:text-left">
            <h1 className="text-2xl sm:text-[38px] md:text-4xl font-semibold text-black tracking-tight mb-2">Welcome back</h1>
            <p className="text-[#666] text-base sm:text-[18px] md:text-lg font-normal">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6 md:gap-8 w-full">
            <div className="flex flex-col gap-2 mb-2">
              <GoogleOAuthProvider clientId="853434167999-0aj5opdatd6i58n6uifanipcchfkunqd.apps.googleusercontent.com">
                <GoogleAuthButton
                  onSuccess={async (credential) => {
                    setError("");
                    setIsLoading(true);
                    try {
                      const res = await api.post("/google-login", { token: credential });
                      setAuthToken(res.data.access_token);
                      localStorage.setItem("token", res.data.access_token);
                      router.push("/dashboard");
                    } catch {
                      setError("Google login failed");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  buttonText="Continue with Google"
                />
              </GoogleOAuthProvider>
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[#333] text-[15px] sm:text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200 placeholder-gray-500 text-black"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[#333] text-[15px] sm:text-sm font-medium">
                  Password
                </label>
                <a href="#" className="text-[#000] text-[14px] sm:text-sm font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[52px] px-4 rounded-lg border border-[#e0e0e0] focus:border-[#000] focus:outline-none text-[16px] bg-white transition-colors duration-200 placeholder-gray-500 text-black"
                required
              />
            </div>

            {error && (
              <div className="text-[#d93025] text-[13px] sm:text-sm font-medium bg-[#fce8e6] rounded-lg py-2 px-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] mt-2 bg-[#000] text-white font-medium rounded-lg hover:bg-[#333] active:bg-[#000] transition-colors duration-200 text-base sm:text-lg disabled:opacity-70"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 text-center text-[#666] text-base sm:text-lg">
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" className="text-[#000] font-medium hover:underline">
              Create account
            </a>
          </div>

          <div className="mt-12 pt-4 border-t border-[#eaeaea]">
            <p className="text-[#666] text-[13px] sm:text-sm leading-5">
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
