"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "../../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/login", { email, password });
      setAuthToken(res.data.access_token);
      localStorage.setItem('token', res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <main className="min-h-screen w-full flex items-stretch bg-gradient-to-br from-[#f5f6fa] via-[#d1d5db] to-[#a3a3a3]">
      {/* Left: Form Section */}
      <section className="flex flex-col justify-center w-full md:w-1/2 px-10 py-14 bg-white/70 backdrop-blur-lg shadow-2xl z-10 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#111827"/>
              <path d="M24 14C27.3137 14 30 16.6863 30 20C30 23.3137 27.3137 26 24 26C20.6863 26 18 23.3137 18 20C18 16.6863 20.6863 14 24 14Z" fill="#fff"/>
              <rect x="16" y="30" width="16" height="4" rx="2" fill="#fff"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-gray-900 font-sfpro">magizh technologies</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2 font-sfpro">Employee Attendance Management</h1>
          <p className="text-gray-600 text-sm mb-8 font-sfpro">Please enter your details</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg bg-white/90 shadow-sm transition font-sfpro"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg bg-white/90 shadow-sm transition font-sfpro"
              required
            />
            {error && <div className="text-red-500 text-center font-semibold bg-red-50 rounded-lg py-2 px-3 font-sfpro">{error}</div>}
            <button
              type="submit"
              className="w-full mt-2 bg-[#111827] text-white font-semibold rounded-xl py-3 shadow-md hover:bg-[#22223b] transition text-lg font-sfpro"
            >
              Sign In
            </button>
          </form>
          <div className="mt-8 text-center text-gray-700 text-sm font-sfpro">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-blue-700 font-semibold underline hover:text-blue-900 transition font-sfpro">Sign up</a>
          </div>
        </div>
      </section>
      {/* Right: Image Section */}
      <section className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"
          alt="Ideas inspiration"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute bottom-0 left-0 right-0 p-10 z-20">
          <h2 className="text-white text-3xl font-bold drop-shadow-lg mb-2 font-sfpro">Bring your ideas to life.</h2>
          <p className="text-white/90 text-base drop-shadow-lg font-sfpro">Sign up for free and enjoy access to all features for 30 days. No credit card required.</p>
        </div>
      </section>
    </main>
  );
}
