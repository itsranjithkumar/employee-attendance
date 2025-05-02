"use client";
import { useRouter } from "next/navigation";
import { FaRegCalendarCheck, FaUmbrellaBeach, FaCalendarAlt, FaTachometerAlt, FaCog, FaSignOutAlt } from "react-icons/fa";

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
      className={`flex items-center gap-4 px-5 py-3 rounded-2xl w-full text-left transition font-semibold text-lg tracking-wide shadow-md
        ${isActive
          ? "bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 text-white shadow-2xl scale-105"
          : "text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm"}
      `}
      style={{letterSpacing: "0.02em"}}
    >
      <span className="text-2xl">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="h-full min-h-screen bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-blue-900/80 border border-white/10 shadow-2xl rounded-3xl flex flex-col py-10 px-6 w-72 min-w-[250px] transition-all duration-300">
      <div className="flex items-center gap-4 px-2 mb-12">
        <span className="inline-block w-12 h-12 bg-gradient-to-tr from-blue-400 via-violet-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity="0.13"/><rect x="9" y="12" width="14" height="8" rx="4" fill="#fff" fillOpacity="0.35"/></svg>
        </span>
        <span className="font-black text-2xl tracking-tight text-white luxury-font drop-shadow-lg select-none" style={{letterSpacing: "-0.03em"}}>DeskBoard</span>
      </div>
      <nav className="flex flex-col gap-3 flex-1">
        {navItem("Dashboard", <FaTachometerAlt />, "/dashboard", active === "dashboard")}
        {navItem("Attendance", <FaRegCalendarCheck />, "/attendance", active === "attendance")}
        {navItem("Leave", <FaUmbrellaBeach />, "/leave", active === "leave")}
        {navItem("Calendar", <FaCalendarAlt />, "/calendar", active === "calendar")}
      </nav>
      <div className="mt-16 px-2 flex gap-4 items-center">
        <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 font-semibold text-base transition" onClick={() => router.push("/settings")}> <FaCog /> Settings</button>
        <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 font-semibold text-base transition" onClick={() => {
          localStorage.removeItem('token');
          router.push('/auth/login');
        }}><FaSignOutAlt /> Logout</button>
      </div>
      <div className="mt-8 px-2">
        <div className="text-xs text-gray-500 text-center italic">Inspired by Apple’s minimal luxury UI</div>
      </div>
    </aside>
  );
}
