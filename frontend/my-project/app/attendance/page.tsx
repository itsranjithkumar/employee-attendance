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
  const [currentBreakElapsed, setCurrentBreakElapsed] = useState(0) // seconds for ongoing break

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

  // Compute duration for each break: static or live for ongoing
  function getBreakDuration(b: { break_in: string; break_out: string | null }) {
    if (b.break_out) {
      return Math.floor((parseDateUTC(b.break_out).getTime() - parseDateUTC(b.break_in).getTime()) / 1000)
    }
    return currentBreakElapsed
  }

  // Helper: Format break duration in hh:mm:ss
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
    return Math.floor(total)
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
      return Math.floor(total)
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

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status.onBreak && breaks.length > 0) {
      const last = breaks[breaks.length - 1]
      interval = setInterval(() => {
        const sec = Math.floor((Date.now() - parseDateUTC(last.break_in).getTime()) / 1000)
        setCurrentBreakElapsed(sec)
      }, 1000)
    } else {
      setCurrentBreakElapsed(0)
    }
    return () => interval && clearInterval(interval)
  }, [status.onBreak, breaks])

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
    } catch (err) {
      // Improved error handling for array/object error responses
      let detail = "Action failed"
      if (err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "detail" in err.response.data) {
        detail = (err.response.data as { detail: string }).detail || detail
      }
      if (Array.isArray(detail)) {
        detail = (detail as { msg?: string }[]).map((d) => d.msg || JSON.stringify(d)).join("; ")
      } else if (typeof detail === "object") {
        detail = (detail as { msg?: string }).msg || JSON.stringify(detail)
      }
      setFeedback(detail as string)
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
    } catch (err) {
      let detail = "Failed to save summary"
      if (err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "detail" in err.response.data) {
        detail = (err.response.data as { detail: string }).detail || detail
      }
      setFeedback(detail as string)
    } finally {
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-black/95 backdrop-blur-xl rounded-3xl shadow">
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-zinc-100 p-0 flex flex-col">
      {/* Glass Header */}
      <div className="relative h-64 bg-black overflow-hidden w-full">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[200%] rounded-full bg-gradient-to-br from-zinc-700/20 to-transparent blur-3xl transform rotate-12"></div>
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[150%] rounded-full bg-gradient-to-br from-zinc-600/10 to-transparent blur-3xl transform -rotate-12"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-8 md:p-12 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
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

            <div className="mt-4 sm:mt-6 md:mt-0 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-4 border border-white/20 w-full md:w-auto">
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

          <div className="flex justify-center md:justify-end mt-4 md:mt-0">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl px-8 py-4 border border-white/10 text-center">
              <p className="text-zinc-400 text-sm font-medium">{status.ended ? "Total Time" : "Time Elapsed"}</p>
              <p className="text-white text-3xl font-mono font-light tracking-wider mt-1">{formatTime(elapsed)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full p-4 sm:p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
          {/* Left Column - Summary Cards */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Today Summary Card */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100 w-full">
              <h3 className="text-xl font-semibold mb-6 text-zinc-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-500" />
                Today Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

                <div className="flex flex-col justify-center items-center md:items-start mt-4 md:mt-0">
                  <span className="text-zinc-500 text-sm font-medium">Total Work Duration</span>
                  <span className="text-emerald-600 text-2xl font-semibold mt-2">{formatWorkedHours(elapsed)}</span>

                  <div className="mt-4 w-full max-w-xs bg-zinc-100 h-2 rounded-full overflow-hidden mx-auto md:mx-0">
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
            <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100 w-full">
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
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 sm:p-4 rounded-xl bg-zinc-50 border border-zinc-100 gap-2 md:gap-0"
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

                      <div className="mt-2 md:mt-0 px-3 py-1 rounded-full bg-zinc-200 text-zinc-700 text-sm font-medium text-center">
                        {formatBreakDuration(getBreakDuration(b))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-zinc-100 gap-2 sm:gap-0">
                    <span className="text-zinc-600 font-medium">Total Break Time</span>
                    <span className="text-zinc-900 font-semibold">{formatBreakDuration(getTotalBreakSeconds())}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6 sm:space-y-8">
            {/* Action Buttons Card */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-zinc-100 w-full">
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
      <div className="bg-zinc-50 py-4 sm:py-6 px-4 sm:px-8 border-t border-zinc-100 text-center text-zinc-400 text-sm w-full">
        <p>Attendance Tracker • {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
