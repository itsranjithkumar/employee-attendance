"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../utils/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/signup", { name, email, password });
      router.push("/auth/login");
    } catch (err) {
      let detail = "Signup failed";
      if (err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "detail" in err.response.data) {
        detail = (err.response.data as { detail: string }).detail || detail;
      }
      setError(detail);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-stretch bg-gradient-to-br from-[#f5f6fa] via-[#d1d5db] to-[#a3a3a3]">
      {/* Left: Form Section */}
      <section className="flex flex-col justify-center w-full md:w-1/2 px-10 py-14 bg-white/70 backdrop-blur-lg shadow-2xl z-10 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-3xl font-bold tracking-tight text-gray-700 mb-2 font-serif block text-left w-full">
              Employee Attendance Management
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-8 font-sfpro">Join us and experience the luxury!</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg bg-white/90 shadow-sm transition"
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg bg-white/90 shadow-sm transition"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg bg-white/90 shadow-sm transition"
              required
            />
            {error && <div className="text-red-500 text-center font-semibold bg-red-50 rounded-lg py-2 px-3">{error}</div>}
            <button type="submit" className="w-full mt-2 bg-[#111827] text-white font-semibold rounded-xl py-3 shadow-md hover:bg-[#22223b] transition text-lg">Sign Up</button>
          </form>
          <div className="mt-8 text-center text-gray-700 text-sm">
            Already have an account?{' '}
            <a href="/auth/login" className="text-blue-700 font-semibold underline hover:text-blue-900 transition">Sign in</a>
          </div>
        </div>
      </section>
      {/* Right: Image Section */}
      <section className="hidden md:flex flex-1 items-center justify-center relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80"
          alt="Signup background"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute bottom-0 left-0 right-0 p-10 z-20">
          <h2 className="text-white text-3xl font-bold drop-shadow-lg mb-2">Attendance is the first step to achievement.</h2>
          <p className="text-white/90 text-base drop-shadow-lg">Sign up for free and enjoy access to all features for 30 days. No credit card required.</p>
        </div>
      </section>
    </main>
  );
}
