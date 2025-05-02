import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f6fa] via-[#d1d5db] to-[#a3a3a3] relative overflow-hidden">
      {/* Silver shine overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/20 mix-blend-screen" style={{zIndex:1}} />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 drop-shadow-lg mb-6 text-center luxury-font tracking-tight">
          Welcome to Employee Attendance
        </h1>
        <p className="text-2xl md:text-3xl text-gray-700 mb-10 text-center font-medium max-w-2xl">
          Manage your employees with style and efficiency. Experience seamless luxury attendance management.
        </p>
        <Link href="/auth/login" className="mt-4">
          <button className="apple-btn">
            Login
          </button>
        </Link>
      </div>
    </main>
  );
}
