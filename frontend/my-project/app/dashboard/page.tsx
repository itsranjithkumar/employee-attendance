"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../utils/api";
import { useRouter } from "next/navigation";

interface AttendanceSummary {
  present: number;
  absent: number;
  leaves: number;
  total: number;
}

interface User {
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthError("Please login to view your dashboard.");
      setLoading(false);
      return;
    }
    setAuthToken(token);
    Promise.all([
      api.get("/user/me"),
      api.get("/attendance/summary"),
      api.get("/leave/balance")
    ]).then(([userRes, attRes, leaveRes]) => {
      setUser(userRes.data);
      setAttendance(attRes.data);
      setLeaveBalance(leaveRes.data);
    }).catch(() => {
      setAuthError("Failed to load dashboard. Please login again.");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"><span className="text-white text-xl">Loading dashboard...</span></div>;
  }
  if (authError) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"><span className="text-red-500 text-xl font-bold">{authError}</span></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome Back{user?.name ? `, ${user.name}` : ""} 👋</h1>
            <p className="text-gray-500 text-base">Here's a summary of your account activity.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white font-bold rounded-xl px-6 py-3 shadow text-base tracking-wide transition-all duration-150" onClick={() => router.push('/attendance')}>Start Day / Attendance</button>
            <button className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-bold rounded-xl px-6 py-3 shadow text-base tracking-wide transition-all duration-150" onClick={() => router.push('/leave')}>Apply Leave</button>
            <button className="bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white font-bold rounded-xl px-6 py-3 shadow text-base tracking-wide transition-all duration-150" onClick={() => router.push('/calendar')}>View Calendar</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start border-t-4 border-blue-500 w-full">
            <span className="text-gray-400 text-xs font-bold uppercase mb-2">Present</span>
            <span className="text-3xl font-extrabold text-blue-700 mb-1">{attendance?.present ?? '-'}</span>
            <span className="text-gray-600 text-sm">Days Present</span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start border-t-4 border-red-500 w-full">
            <span className="text-gray-400 text-xs font-bold uppercase mb-2">Absent</span>
            <span className="text-3xl font-extrabold text-red-600 mb-1">{attendance?.absent ?? '-'}</span>
            <span className="text-gray-600 text-sm">Days Absent</span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start border-t-4 border-yellow-500 w-full">
            <span className="text-gray-400 text-xs font-bold uppercase mb-2">Leaves</span>
            <span className="text-3xl font-extrabold text-yellow-600 mb-1">{attendance?.leaves ?? '-'}</span>
            <span className="text-gray-600 text-sm">Leaves Taken</span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start border-t-4 border-green-500 w-full">
            <span className="text-gray-400 text-xs font-bold uppercase mb-2">Total</span>
            <span className="text-3xl font-extrabold text-green-700 mb-1">{attendance?.total ?? '-'}</span>
            <span className="text-gray-600 text-sm">Total Records</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border border-gray-100 w-full">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Leave Balance</h2>
            <div className="flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-semibold">Casual</span>
                <span className="text-2xl font-bold text-blue-700">{leaveBalance?.casual_leave_balance ?? '-'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-semibold">Sick</span>
                <span className="text-2xl font-bold text-green-700">{leaveBalance?.sick_leave_balance ?? '-'}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-semibold">WFH</span>
                <span className="text-2xl font-bold text-purple-700">{leaveBalance?.wfh_balance ?? '-'}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center border border-gray-100 w-full col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Activity</h2>
            <div className="text-gray-400 text-sm">(Coming soon: charts, tables, analytics...)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
