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
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="w-full max-w-md p-10 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-lg border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
            <circle cx="24" cy="24" r="24" fill="#111827"/>
            <path d="M24 14C27.3137 14 30 16.6863 30 20C30 23.3137 27.3137 26 24 26C20.6863 26 18 23.3137 18 20C18 16.6863 20.6863 14 24 14Z" fill="#fff"/>
            <rect x="16" y="30" width="16" height="4" rx="2" fill="#fff"/>
          </svg>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 drop-shadow mb-2">Create your account</h1>
          <p className="text-gray-600 text-sm">Join us and experience the luxury!</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg text-lg tracking-wide transition-all duration-150"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-6 text-center text-gray-700 text-sm">
          Already have an account?{' '}
          <a href="/auth/login" className="text-blue-700 font-semibold underline hover:text-blue-900 transition">Sign in</a>
        </div>
      </div>
    </div>
  );
}
