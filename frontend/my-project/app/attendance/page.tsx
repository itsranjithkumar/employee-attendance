"use client"
import { useEffect, useState } from "react"
import { api, setAuthToken } from "../utils/api"
import { Clock, Calendar, Play, Square, Coffee, ArrowUpRight } from "lucide-react"

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
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [breaks, setBreaks] = useState<{ break_in: string, break_out: string | null }[]>([])

  // Helper: Convert UTC ISO string or Date to IST Date object
  function toIST(date: string | Date | null): Date | null {
    if (!date) return null
    const d = typeof date === 'string' ? new Date(date) : date
    // IST is UTC+5:30
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    return new Date(utc + 5.5 * 60 * 60 * 1000)
  }

  // Helper: Format IST time nicely
  function formatISTTime(date: string | Date | null) {
    const istDate = toIST(date)
    if (!istDate) return '-'
    return istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  }

  // Helper: Format worked hours as 'X hours Y minutes'
  function formatWorkedHours(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    let str = ''
    if (h > 0) str += `${h} hour${h > 1 ? 's' : ''} `
    str += `${m} minute${m !== 1 ? 's' : ''}`
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
        if (start_time) setStartTime(new Date(start_time))
        if (end_time) setEndTime(new Date(end_time))
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
          const inTime = new Date(b.break_in)
          const outTime = b.break_out ? new Date(b.break_out) : new Date()
          if (b.break_out) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
          else if (status.onBreak) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
        }
      }
      return total
    }
    if (status.started && !status.ended && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const gross = (now.getTime() - startTime.getTime()) / 1000
        const breakSecs = getTotalBreakSeconds()
        setElapsed(Math.max(0, Math.floor(gross - breakSecs)))
      }, 1000)
    } else if (status.ended && startTime && endTime) {
      let gross = (endTime.getTime() - startTime.getTime()) / 1000
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
        setStartTime(res.data.start_time ? new Date(res.data.start_time) : null)
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
      setStartTime(res.data.start_time ? new Date(res.data.start_time) : null)
      setEndTime(res.data.end_time ? new Date(res.data.end_time) : null)
    } catch (err: any) {
      setFeedback(err.response?.data?.detail || "Failed to save summary")
    } finally {
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] text-red-500 font-medium text-center border border-red-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <p className="text-lg">{authError}</p>
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
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  function getTotalBreakSeconds() {
    let total = 0
    for (const b of breaks) {
      if (b.break_in) {
        const inTime = new Date(b.break_in)
        const outTime = b.break_out ? new Date(b.break_out) : new Date()
        if (b.break_out) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
        else if (status.onBreak) total += Math.max(0, (outTime.getTime() - inTime.getTime()) / 1000)
      }
    }
    return total
  }

  return (
    <div className="max-w-[110rem] w-full mx-auto mt-14 p-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.10),0_12px_24px_-12px_rgba(0,0,0,0.06)] overflow-hidden border border-neutral-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-950 to-neutral-800 text-white px-16 py-8 relative flex items-center justify-between gap-10">
        <div className="relative z-10 flex-1">
          <h1 className="text-2xl font-extrabold mb-1 tracking-tight drop-shadow">Attendance Tracker</h1>
          <p className="text-neutral-300 font-light text-base">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-end gap-1">
          <span className="text-lg font-bold text-white/80">{status.ended ? "Day Ended" : status.started ? (status.onBreak ? "On Break" : "Working") : "Not Started"}</span>
          <span className="text-xs text-neutral-300 font-medium">{status.ended ? "Total Time" : "Time Elapsed"}</span>
          <span className="text-xl font-mono font-semibold text-white bg-neutral-900/80 rounded-lg px-4 py-2 shadow border border-neutral-700 mt-2">
            {formatTime(elapsed)}
          </span>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_80%)]"></div>
      </div>

      {/* Main Content */}
      <div className="px-14 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-5 border border-neutral-100 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${getStatusColor()}`}> 
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-neutral-500 text-xs font-medium">Current Status</p>
              <p className="text-base font-bold mt-1">
                {status.ended ? "Day Ended" : status.started ? (status.onBreak ? "On Break" : "Working") : "Not Started"}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border border-neutral-100 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-neutral-500 text-xs font-medium">{status.ended ? "Total Time" : "Time Elapsed"}</p>
              <p className="text-base font-mono font-bold mt-1">{formatTime(elapsed)}</p>
            </div>
          </div>
        </div>

        {/* Start/End/Worked Summary */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow border border-neutral-200 p-6">
            <h3 className="text-lg font-bold mb-2 text-neutral-800">Today Summary</h3>
            <div className="flex flex-col gap-2 text-base">
              <div><span className="font-semibold">Start Time:</span> {formatISTTime(startTime)}</div>
              <div><span className="font-semibold">End Time:</span> {endTime ? formatISTTime(endTime) : <span className="text-neutral-400">Ongoing</span>}</div>
              <div className="font-semibold text-emerald-700 mt-2">
                Worked: {status.ended ? formatWorkedHours(elapsed) : formatWorkedHours(elapsed)}
              </div>
            </div>
          </div>
        </div>

        {/* Breaks List and Total Break Time */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow border border-neutral-200 p-6">
            <h3 className="text-lg font-bold mb-2 text-neutral-800">Breaks Taken Today</h3>
            <ul className="mb-4">
              {breaks.length === 0 && (
                <li className="text-neutral-400">No breaks taken yet.</li>
              )}
              {breaks.map((b, idx) => {
                const breakIn = b.break_in
                const breakOut = b.break_out
                let duration = 0
                const inIST = toIST(breakIn)
                const outIST = breakOut ? toIST(breakOut) : null
                if (breakOut) duration = Math.max(0, Math.floor(((outIST!.getTime() - inIST!.getTime()) / 1000)))
                else if (status.onBreak) duration = Math.max(0, Math.floor(((new Date().getTime() - inIST!.getTime()) / 1000)))
                return (
                  <li key={b.break_in + idx} className="flex items-center justify-between py-1 text-base">
                    <span>
                      <span className="font-semibold">Break {idx + 1}:</span>
                      &nbsp;In: {formatISTTime(breakIn)}
                      &nbsp;|
                      Out: {breakOut ? formatISTTime(breakOut) : <span className="text-amber-500">Ongoing</span>}
                    </span>
                    <span className="ml-4 text-neutral-600 text-sm">{formatBreakDuration(duration)}</span>
                  </li>
                )
              })}
            </ul>
            <div className="font-semibold text-neutral-800 text-base flex justify-between items-center">
              <span>Total Break Time:</span>
              <span className="text-amber-600">{formatBreakDuration(getTotalBreakSeconds())}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons + Work Summary/Feedback */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 text-base font-semibold shadow border border-neutral-100 ${
                status.started || status.ended
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-800 hover:scale-105"
              }`}
              disabled={loading || status.started || status.ended}
              onClick={() => handleAction("start")}
            >
              <Play className="w-5 h-5 mb-2" />
              <span>Start Day</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 text-base font-semibold shadow border border-neutral-100 ${
                !status.started || status.ended || showWorkSummary
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-neutral-800 to-neutral-900 text-white hover:from-neutral-700 hover:to-neutral-900 hover:scale-105"
              }`}
              disabled={loading || !status.started || status.ended || showWorkSummary}
              onClick={() => handleAction("end")}
            >
              <Square className="w-5 h-5 mb-2" />
              <span>End Day</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 text-base font-semibold shadow border border-neutral-100 ${
                !status.started || status.ended || status.onBreak
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600 hover:scale-105"
              }`}
              disabled={loading || !status.started || status.ended || status.onBreak}
              onClick={() => handleAction("break-in")}
            >
              <Coffee className="w-5 h-5 mb-2" />
              <span>Break In</span>
            </button>

            <button
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 text-base font-semibold shadow border border-neutral-100 ${
                !status.onBreak || status.ended
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-gradient-to-br from-amber-500 to-amber-700 text-white hover:from-amber-600 hover:to-amber-800 hover:scale-105"
              }`}
              disabled={loading || !status.onBreak || status.ended}
              onClick={() => handleAction("break-out")}
            >
              <ArrowUpRight className="w-5 h-5 mb-2" />
              <span>Break Out</span>
            </button>
          </div>

          {/* Work Summary */}
          {showWorkSummary && (
            <div className="mt-6">
              <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 shadow max-w-lg mx-auto">
                <h3 className="text-lg font-bold mb-4 text-neutral-800">Work Summary</h3>
                <textarea
                  className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:outline-none text-neutral-800 bg-white text-base resize-none shadow"
                  rows={3}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="Describe your work for today..."
                  disabled={loading}
                />
                <button
                  className={`mt-5 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 shadow border border-neutral-200 ${
                    !workSummary.trim()
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105"
                  }`}
                  disabled={loading || !workSummary.trim()}
                  onClick={handleSubmitWorkSummary}
                >
                  Submit & End Day
                </button>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div className="mt-6">
              <div className="bg-neutral-900 text-white rounded-xl py-4 px-6 shadow max-w-md mx-auto text-base">
                <p className="text-center font-semibold">{feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-100 p-6 border-t border-neutral-200 text-center text-neutral-400 text-base rounded-b-[2rem]">
        <p>Attendance Tracker • {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
