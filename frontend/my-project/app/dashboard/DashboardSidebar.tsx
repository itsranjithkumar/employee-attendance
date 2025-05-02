"use client";
import { useRouter } from "next/navigation";

export default function DashboardSidebar({ active }: { active: string }) {
  const router = useRouter();
  const navItem = (
    label: string,
    icon: React.ReactNode,
    href: string,
    isActive: boolean
  ) => (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition font-semibold text-base ${
        isActive
          ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-2xl backdrop-blur-sm"
          : "text-gray-200 hover:bg-white/20 hover:text-white backdrop-blur-sm"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <aside className="h-full bg-white/10 backdrop-blur-lg border border-white/30 shadow-2xl rounded-3xl flex flex-col py-8 px-4 w-64 min-w-[240px]">
      <div className="flex items-center gap-3 px-6 mb-10">
        <span className="inline-block w-10 h-10 bg-white/30 rounded-full backdrop-blur-sm" />
        <span className="font-extrabold text-xl luxury-font text-white tracking-tight">DESKBOARD</span>
      </div>
      <nav className="flex flex-col gap-2 flex-1">
        {navItem("Dashboard", <span className="material-icons">dashboard</span>, "/dashboard", active === "dashboard")}
        {navItem("Attendance", <span className="material-icons">event_available</span>, "/attendance", active === "attendance")}
        {navItem("Leave", <span className="material-icons">beach_access</span>, "/leave", active === "leave")}
        {navItem("Calendar", <span className="material-icons">calendar_today</span>, "/calendar", active === "calendar")}
      </nav>
      <div className="mt-12 px-6">
        <button className="text-gray-500 hover:text-blue-700 font-semibold text-sm" onClick={() => router.push("/settings")}>Settings</button>
        <button className="text-gray-500 hover:text-blue-700 font-semibold text-sm ml-6" onClick={() => {
          localStorage.removeItem('token');
          router.push('/auth/login');
        }}>Logout</button>
      </div>
    </aside>
  );
}
