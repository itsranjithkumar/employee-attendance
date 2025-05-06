"use client"
import { useEffect, useState } from "react"
import { api, setAuthToken } from "../utils/api"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  Award,
  BarChart3,
  BriefcaseMedical,
  Home,
  LogOut,
  Settings,
  User,
  ChevronRight,
  Bell,
  Search,
  ArrowUpRight,
  Zap,
  Sparkles,
  MoreHorizontal,
} from "lucide-react"

interface AttendanceSummary {
  present: number
  absent: number
  leaves: number
  total: number
}

interface UserType {
  name: string
  email: string
  role: string
}

interface LeaveBalanceType {
  casual_leave_balance?: number;
  sick_leave_balance?: number;
  wfh_balance?: number;
  [key: string]: number | undefined;
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceType | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setAuthError("Please login to view your dashboard.")
      setLoading(false)
      return
    }
    setAuthToken(token)
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth is 0-indexed
    const year = now.getFullYear();
    Promise.all([
      api.get("/user/me"),
      api.get("/leave/balance"),
      api.get(`/calendar?month=${month}&year=${year}`)
    ])
      .then(([userRes, leaveRes, calendarRes]) => {
        setUser(userRes.data)
        setLeaveBalance(leaveRes.data)
        // Analyze calendar for present/absent/leave counts
        const calendar = calendarRes.data;
        let present = 0, absent = 0, leaves = 0, total = 0;
        Object.values(calendar).forEach((status) => {
          if (status === "present") present++;
          else if (status === "absent") absent++;
          else if (status === "leave") leaves++;
          if (["present", "absent", "leave"].includes(status)) total++;
        });
        setAttendance({ present, absent, leaves, total });
      })
      .catch(() => {
        setAuthError("Failed to load dashboard. Please login again.")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-white opacity-20 animate-spin"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-white animate-spin"></div>
          </div>
          <p className="mt-6 text-white/80 font-light tracking-wide">Preparing your workspace...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 p-10 rounded-3xl max-w-md w-full border border-zinc-800">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8 bg-red-500/10">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-center text-2xl font-medium text-white mb-3">Authentication Error</h2>
          <p className="text-center text-zinc-400 mb-8">{authError}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-medium rounded-2xl transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (user && user.role === "admin") {
    if (typeof window !== "undefined") {
      window.location.href = "/admin"
      return null
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate attendance percentage
  const attendancePercentage = attendance ? Math.round((attendance.present / attendance.total) * 100) : 0

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 backdrop-blur-lg bg-black/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-20 px-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent text-white">
                DESKBOARD
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                  <p className="text-xs text-zinc-400">{user?.email || "user@example.com"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Hello, {user?.name ? user.name.split(" ")[0] : "there"} 👋
            </h1>
            <p className="text-zinc-400 text-lg">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-3">
            <div className="h-12 px-6 flex items-center justify-center rounded-full bg-white text-black font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Quick Actions
            </div>
            <button className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => router.push("/attendance")}
            className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] border border-zinc-800 hover:border-purple-500/30"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-white">Start Day</h3>
            </div>
            <p className="text-zinc-400 mb-4 group-hover:text-zinc-300 transition-colors">
              Record your attendance for today
            </p>
            <div className="flex justify-end">
              <ArrowUpRight className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
          </button>

          <button
            onClick={() => router.push("/leave")}
            className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(236,72,153,0.15)] border border-zinc-800 hover:border-pink-500/30"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:text-pink-300 transition-colors">
                <BriefcaseMedical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-white">Apply Leave</h3>
            </div>
            <p className="text-zinc-400 mb-4 group-hover:text-zinc-300 transition-colors">
              Request time off or work from home
            </p>
            <div className="flex justify-end">
              <ArrowUpRight className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors"></div>
          </button>

          <button
            onClick={() => router.push("/calendar")}
            className="group relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] border border-zinc-800 hover:border-red-500/30"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:text-red-300 transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium text-white">Calendar</h3>
            </div>
            <p className="text-zinc-400 mb-4 group-hover:text-zinc-300 transition-colors">
              View your schedule and events
            </p>
            <div className="flex justify-end">
              <ArrowUpRight className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
          </button>
        </div>

        {/* Attendance Overview */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Attendance Overview</h2>
            <button className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center">
              View Details <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Attendance Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Attendance Rate</h3>
                <div className="text-sm text-zinc-400">{attendance?.total ?? "-"} days tracked</div>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full border-8 border-zinc-700"></div>

                  {/* Progress circle - dynamically styled based on percentage */}
                  <div
                    className="absolute inset-0 rounded-full border-8 border-transparent"
                    style={{
                      borderTopColor:
                        attendancePercentage >= 90 ? "#10b981" : attendancePercentage >= 70 ? "#f59e0b" : "#ef4444",
                      borderRightColor:
                        attendancePercentage >= 50
                          ? attendancePercentage >= 90
                            ? "#10b981"
                            : "#f59e0b"
                          : "transparent",
                      borderBottomColor: attendancePercentage >= 75 ? "#10b981" : "transparent",
                      borderLeftColor:
                        attendancePercentage >= 25
                          ? attendancePercentage >= 90
                            ? "#10b981"
                            : "#f59e0b"
                          : "transparent",
                      transform: "rotate(-45deg)",
                    }}
                  ></div>

                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-white">{attendancePercentage}%</span>
                    <span className="text-sm text-zinc-400">Present Rate</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-2xl p-3 text-center">
                  <span className="text-sm text-zinc-400">Present</span>
                  <div className="text-2xl font-bold text-white">{attendance?.present ?? "-"}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-3 text-center">
                  <span className="text-sm text-zinc-400">Absent</span>
                  <div className="text-2xl font-bold text-white">{attendance?.absent ?? "-"}</div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Present Card */}
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    Present
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-bold text-white mb-1">{attendance?.present ?? "-"}</div>
                  <div className="text-sm text-zinc-400">Days Present</div>
                </div>
              </div>

              {/* Absent Card */}
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-400">Absent</span>
                </div>

                <div>
                  <div className="text-3xl font-bold text-white mb-1">{attendance?.absent ?? "-"}</div>
                  <div className="text-sm text-zinc-400">Days Absent</div>
                </div>
              </div>

              {/* Leaves Card */}
              <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Home className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                    Leaves
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-bold text-white mb-1">{attendance?.leaves ?? "-"}</div>
                  <div className="text-sm text-zinc-400">Days on Leave</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balance and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balance */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Leave Balance</h3>
              <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-3">
                  <span className="text-sm font-bold">CL</span>
                </div>
                <span className="block text-2xl font-bold text-white mb-1">
                  {leaveBalance?.casual_leave_balance ?? "-"}
                </span>
                <span className="text-xs text-zinc-400">Casual</span>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <span className="text-sm font-bold">SL</span>
                </div>
                <span className="block text-2xl font-bold text-white mb-1">
                  {leaveBalance?.sick_leave_balance ?? "-"}
                </span>
                <span className="text-xs text-zinc-400">Sick</span>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-3">
                  <span className="text-sm font-bold">WFH</span>
                </div>
                <span className="block text-2xl font-bold text-white mb-1">{leaveBalance?.wfh_balance ?? "-"}</span>
                <span className="text-xs text-zinc-400">WFH</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/leave")}
              className="w-full mt-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply for Leave
            </button>
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Activity Overview</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-full bg-zinc-700 text-xs text-white">Week</button>
                <button className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400">Month</button>
                <button className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-400">Year</button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center h-64 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
              <BarChart3 className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 text-sm mb-2">Analytics coming soon</p>
              <p className="text-zinc-500 text-xs max-w-xs text-center">
                Detailed charts and analytics will be available in the next update
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500"> 2024 Deskboard. All rights reserved.</p>
            <div className="flex gap-6">
              <button
                onClick={() => router.push("/settings")}
                className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token")
                  router.push("/auth/login")
                }}
                className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
