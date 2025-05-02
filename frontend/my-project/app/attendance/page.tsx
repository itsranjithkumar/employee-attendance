"use client"
import { useEffect, useState } from "react"
import { api, setAuthToken } from "../utils/api"
import { Clock, Calendar, Play, Square, Coffee, ArrowUpRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface AttendanceStatus {
  started: boolean
  ended: boolean
  onBreak: boolean
  message?: string
}

export default function AttendancePage() {
  const [status, setStatus] = useState<AttendanceStatus>({ started: false, ended: false, onBreak: false })
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [workSummary, setWorkSummary] = useState("")
  const [showWorkSummary, setShowWorkSummary] = useState(false)
  const [authError, setAuthError] = useState("")
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [breaks, setBreaks] = useState<{ break_in: string; break_out: string | null }[]>([])

  // Parse server timestamp (assume UTC) into Date object
  function parseDateUTC(dateStr: string): Date {
    return new Date(dateStr.includes("Z") ? dateStr : dateStr + "Z")
  }

  // Helper: Format UTC or Date object to IST time string
  function formatISTTime(date: string | Date | null) {
    if (!date) return "-"
    const d = typeof date === "string" ? parseDateUTC(date) : date
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  }

  // Helper: Format worked hours as 'X hours Y minutes'
  function formatWorkedHours(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    let str = ""
    if (h > 0) str += `${h} hour${h > 1 ? "s" : ""} `
    str += `${m} minute${m !== 1 ? "s" : ""}`
    return str.trim()
  }

  // Set token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      // Fetch today's attendance to restore timer state
      api.get("/attendance/today").then((res) => {
        const { start_time, end_time, breaks: breaksData } = res.data
        if (start_time) setStartTime(start_time)
        if (end_time) setEndTime(end_time)
        if (breaksData) setBreaks(breaksData)
        if (start_time && !end_time) {
          setStatus((s) => ({ ...s, started: true, ended: false }))
        } else if (start_time && end_time) {
          setStatus((s) => ({ ...s, started: false, ended: true }))
        }
      })
    } else {
      setAuthError("You are not logged in. Please login to mark attendance.")
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    function getTotalBreakSeconds() {
      let total = 0
      for (const b of breaks) {
        if (b.break_in) {
          const inTime = parseDateUTC(b.break_in)
          const outTime = b.break_out ? parseDateUTC(b.break_out) : new Date()
          if (b.break_out) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
          else if (status.onBreak) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
        }
      }
      return total
    }
    if (status.started && !status.ended && startTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const startMs = parseDateUTC(startTime).getTime()
        const gross = (now - startMs) / 1000
        const breakSecs = getTotalBreakSeconds()
        setElapsed(Math.max(0, Math.floor(gross - breakSecs)))
      }, 1000)
    } else if (status.ended && startTime && endTime) {
      let gross = (parseDateUTC(endTime).getTime() - parseDateUTC(startTime).getTime()) / 1000
      if (gross < 0) gross = 0
      const breakSecs = getTotalBreakSeconds()
      setElapsed(Math.max(0, Math.floor(gross - breakSecs)))
    } else {
      setElapsed(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status.started, status.ended, status.onBreak, startTime, endTime, breaks])

  const handleAction = async (action: "start" | "end" | "break-in" | "break-out") => {
    if (showWorkSummary) return // Prevent multiple modals
    setLoading(true)
    setFeedback("")
    try {
      if (action === "end") {
        setShowWorkSummary(true)
        setLoading(false)
        return
      }
      // For 'start', send required empty work_summary
      if (action === "start") {
        const res = await api.post(`/attendance/start`, { work_summary: "" })
        setFeedback(res.data.msg || "Success")
        setStatus({ started: true, ended: false, onBreak: false })
        setStartTime(res.data.start_time ? res.data.start_time : null)
        // Clear breaks on new day
        setBreaks([])
      } else {
        const res = await api.post(`/attendance/${action}`)
        setFeedback(res.data.msg || "Success")
        if (action === "break-in") setStatus((s) => ({ ...s, onBreak: true }))
        if (action === "break-out") setStatus((s) => ({ ...s, onBreak: false }))
        // Always refresh breaks after break-in/out
        const todayRes = await api.get("/attendance/today")
        if (todayRes.data.breaks) setBreaks(todayRes.data.breaks)
      }
    } catch (err: any) {
      // Improved error handling for array/object error responses
      let detail = err.response?.data?.detail || "Action failed"
      if (Array.isArray(detail)) {
        detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
      } else if (typeof detail === "object") {
        detail = detail.msg || JSON.stringify(detail)
      }
      setFeedback(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitWorkSummary = async () => {
    setLoading(true)
    setFeedback("")
    try {
      const res = await api.post(`/attendance/end`, { work_summary: workSummary })
      setFeedback(res.data.msg || "Day ended and summary saved")
      setStatus({ started: false, ended: true, onBreak: false })
      setShowWorkSummary(false)
      setStartTime(res.data.start_time ? res.data.start_time : null)
      setEndTime(res.data.end_time ? res.data.end_time : null)
    } catch (err: any) {
      setFeedback(err.response?.data?.detail || "Failed to save summary")
    } finally {
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-black/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-white font-medium text-center border border-white/10">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <p className="text-xl font-light tracking-wide">{authError}</p>
          <button className="mt-4 px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all duration-300 transform hover:scale-105">
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = () => {
    if (status.ended) return "bg-neutral-900 text-white"
    if (status.started) {
      if (status.onBreak) return "bg-amber-500 text-white"
      return "bg-emerald-500 text-white"
    }
    return "bg-neutral-100 text-neutral-500"
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0")
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${hours}:${minutes}:${secs}`
  }

  // Helper to format break duration in hh:mm:ss
  function formatBreakDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0")
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  function getTotalBreakSeconds() {
    let total = 0
    for (const b of breaks) {
      if (b.break_in) {
        const inTime = parseDateUTC(b.break_in)
        const outTime = b.break_out ? parseDateUTC(b.break_out) : new Date()
        if (b.break_out) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
        else if (status.onBreak) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
      }
    }
    return total
  }

  const getStatusText = () => {
    if (status.ended) return "Day Ended"
    if (status.started) {
      if (status.onBreak) return "On Break"
      return "Working"
    }
    return "Not Started"
  }

  const getStatusIcon = () => {
    if (status.ended) return <CheckCircle2 className="w-6 h-6" />
    if (status.started) {
      if (status.onBreak) return <Coffee className="w-6 h-6" />
      return <Play className="w-6 h-6" />
    }
    return <Clock className="w-6 h-6" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.1)] border border-zinc-100">
        {/* Glass Header */}
        <div className="relative h-64 bg-black overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black"></div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] rounded-full bg-gradient-to-br from-zinc-700/20 to-transparent blur-3xl transform rotate-12"></div>
            <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[150%] rounded-full bg-gradient-to-br from-zinc-600/10 to-transparent blur-3xl transform -rotate-12"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Attendance Tracker</h1>
                <p className="text-zinc-400 mt-2 font-light">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-6 md:mt-0 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status.ended
                      ? "bg-zinc-800"
                      : status.onBreak
                        ? "bg-amber-500"
                        : status.started
                          ? "bg-emerald-500"
                          : "bg-zinc-700"
                  }`}
                >
                  {getStatusIcon()}
                </div>
                <div>
                  <p className="text-zinc-400 text-sm font-medium">Current Status</p>
                  <p className="text-white text-xl font-semibold">{getStatusText()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl px-8 py-4 border border-white/10 text-center">
                <p className="text-zinc-400 text-sm font-medium">{status.ended ? "Total Time" : "Time Elapsed"}</p>
                <p className="text-white text-3xl font-mono font-light tracking-wider mt-1">{formatTime(elapsed)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Summary Cards */}
            <div className="lg:col-span-2 space-y-8">
              {/* Today Summary Card */}
              <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100">
                <h3 className="text-xl font-semibold mb-6 text-zinc-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-zinc-500" />
                  Today Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-sm font-medium">Start Time</span>
                      <span className="text-zinc-900 text-xl font-medium mt-1">{formatISTTime(startTime)}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-sm font-medium">End Time</span>
                      <span className="text-zinc-900 text-xl font-medium mt-1">
                        {endTime ? formatISTTime(endTime) : <span className="text-zinc-400">Ongoing</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center md:items-start">
                    <span className="text-zinc-500 text-sm font-medium">Total Work Duration</span>
                    <span className="text-emerald-600 text-2xl font-semibold mt-2">{formatWorkedHours(elapsed)}</span>

                    <div className="mt-4 w-full max-w-xs bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (elapsed / (8 * 3600)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-zinc-400 text-xs mt-2">
                      {Math.round((elapsed / (8 * 3600)) * 100)}% of standard workday
                    </span>
                  </div>
                </div>
              </div>

              {/* Breaks Card */}
              <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100">
                <h3 className="text-xl font-semibold mb-6 text-zinc-900 flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-zinc-500" />
                  Breaks Taken Today
                </h3>

                {breaks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                    <Coffee className="w-12 h-12 mb-4 text-zinc-300" />
                    <p className="text-center">No breaks taken yet today.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {breaks.map((b, idx) => (
                      <div
                        key={b.break_in + idx}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100"
                      >
                        <div>
                          <span className="text-zinc-900 font-medium">Break {idx + 1}</span>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-sm">In:</span>
                              <span className="text-zinc-800">{formatISTTime(b.break_in)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-sm">Out:</span>
                              <span className="text-zinc-800">
                                {b.break_out ? (
                                  formatISTTime(b.break_out)
                                ) : (
                                  <span className="text-amber-500 font-medium flex items-center gap-1">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Ongoing
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 md:mt-0 px-3 py-1 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium">
                          {formatBreakDuration(
                            b.break_out
                              ? (parseDateUTC(b.break_out).getTime() - parseDateUTC(b.break_in).getTime()) / 1000
                              : (new Date().getTime() - parseDateUTC(b.break_in).getTime()) / 1000,
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                      <span className="text-zinc-600 font-medium">Total Break Time</span>
                      <span className="text-zinc-900 font-semibold">{formatBreakDuration(getTotalBreakSeconds())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-8">
              {/* Action Buttons Card */}
              <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100">
                <h3 className="text-xl font-semibold mb-6 text-zinc-900">Actions</h3>

                <div className="space-y-4">
                  <button
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                      status.started || status.ended
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/5 hover:shadow-black/10 transform hover:translate-y-[-2px]"
                    }`}
                    disabled={loading || status.started || status.ended}
                    onClick={() => handleAction("start")}
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Start Day
                    </span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                  </button>

                  <button
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                      !status.started || status.ended || showWorkSummary
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-black/5 hover:shadow-black/10 transform hover:translate-y-[-2px]"
                    }`}
                    disabled={loading || !status.started || status.ended || showWorkSummary}
                    onClick={() => handleAction("end")}
                  >
                    <span className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      End Day
                    </span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                  </button>

                  <div className="border-t border-zinc-100 my-4"></div>

                  <button
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                      !status.started || status.ended || status.onBreak
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transform hover:translate-y-[-2px]"
                    }`}
                    disabled={loading || !status.started || status.ended || status.onBreak}
                    onClick={() => handleAction("break-in")}
                  >
                    <span className="flex items-center gap-2">
                      <Coffee className="w-5 h-5" />
                      Break In
                    </span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                  </button>

                  <button
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                      !status.onBreak || status.ended
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/10 hover:shadow-amber-600/20 transform hover:translate-y-[-2px]"
                    }`}
                    disabled={loading || !status.onBreak || status.ended}
                    onClick={() => handleAction("break-out")}
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5" />
                      Break Out
                    </span>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Feedback Message */}
              {feedback && (
                <div className="bg-black text-white rounded-2xl p-6 shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <p className="font-medium">{feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Summary Modal */}
          {showWorkSummary && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-scaleIn">
                <h3 className="text-2xl font-semibold mb-2 text-zinc-900">End Your Day</h3>
                <p className="text-zinc-500 mb-6">Please provide a summary of your work today.</p>

                <textarea
                  className="w-full p-4 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none text-zinc-800 bg-white text-base resize-none shadow-inner"
                  rows={5}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="Describe your work for today..."
                  disabled={loading}
                />

                <div className="flex gap-4 mt-6">
                  <button
                    className="flex-1 px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    onClick={() => setShowWorkSummary(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    className={`flex-1 px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                      !workSummary.trim()
                        ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-zinc-800 shadow-lg shadow-black/5 hover:shadow-black/10"
                    }`}
                    disabled={loading || !workSummary.trim()}
                    onClick={handleSubmitWorkSummary}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Submit & End Day
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 py-6 px-8 border-t border-zinc-100 text-center text-zinc-400 text-sm">
          <p>Attendance Tracker • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}
