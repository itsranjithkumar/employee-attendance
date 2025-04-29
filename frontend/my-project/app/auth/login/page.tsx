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
      localStorage.setItem('token', res.data.access_token); // Save token for future requests
      router.push("/attendance"); // Redirect to attendance page after login
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
      <div className="mt-4 text-sm">
        Don't have an account? <a href="/auth/signup" className="text-blue-600 underline">Sign up</a>
      </div>
    </div>
  );
}
