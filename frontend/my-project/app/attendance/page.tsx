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

  // Set token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      // Fetch today's attendance to restore timer state
      api.get("/attendance/today").then((res) => {
        const { start_time, end_time } = res.data
        if (start_time) setStartTime(new Date(start_time))
        if (end_time) setEndTime(new Date(end_time))
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
    if (status.started && !status.ended && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    } else if (status.ended && startTime && endTime) {
      setElapsed(Math.floor((endTime.getTime() - startTime.getTime()) / 1000))
    } else {
      setElapsed(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status.started, status.ended, startTime, endTime])

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
        setStartTime(new Date())
      } else {
        const res = await api.post(`/attendance/${action}`)
        setFeedback(res.data.msg || "Success")
        if (action === "break-in") setStatus((s) => ({ ...s, onBreak: true }))
        if (action === "break-out") setStatus((s) => ({ ...s, onBreak: false }))
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
      setEndTime(new Date())
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

  return (
    <div className="max-w-3xl mx-auto mt-12 p-0 bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15),0_30px_60px_-30px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-950 to-neutral-800 text-white p-8 pb-12 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_70%)]"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Attendance Tracker</h1>
          <p className="text-neutral-300 font-light">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-8 -mt-8 relative z-20 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] p-6 border border-neutral-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor()}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-neutral-500 text-sm font-medium">Current Status</p>
                <p className="text-xl font-semibold">
                  {status.ended
                    ? "Day Ended"
                    : status.started
                      ? status.onBreak
                        ? "On Break"
                        : "Working"
                      : "Not Started"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] p-6 border border-neutral-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-neutral-500 text-sm font-medium">{status.ended ? "Total Time" : "Time Elapsed"}</p>
                <p className="text-xl font-semibold font-mono">{formatTime(elapsed)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
              status.started || status.ended
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-1"
            }`}
            disabled={loading || status.started || status.ended}
            onClick={() => handleAction("start")}
          >
            <Play className="w-6 h-6 mb-2" />
            <span className="font-medium">Start Day</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
              !status.started || status.ended || showWorkSummary
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-br from-neutral-800 to-neutral-900 text-white shadow-lg shadow-neutral-200 hover:shadow-xl hover:shadow-neutral-200 hover:-translate-y-1"
            }`}
            disabled={loading || !status.started || status.ended || showWorkSummary}
            onClick={() => handleAction("end")}
          >
            <Square className="w-6 h-6 mb-2" />
            <span className="font-medium">End Day</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
              !status.started || status.ended || status.onBreak
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-1"
            }`}
            disabled={loading || !status.started || status.ended || status.onBreak}
            onClick={() => handleAction("break-in")}
          >
            <Coffee className="w-6 h-6 mb-2" />
            <span className="font-medium">Break In</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
              !status.onBreak || status.ended
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-1"
            }`}
            disabled={loading || !status.onBreak || status.ended}
            onClick={() => handleAction("break-out")}
          >
            <ArrowUpRight className="w-6 h-6 mb-2" />
            <span className="font-medium">Break Out</span>
          </button>
        </div>
      </div>

      {/* Work Summary */}
      {showWorkSummary && (
        <div className="px-8 mb-8">
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
            <h3 className="text-lg font-semibold mb-4 text-neutral-800">Work Summary</h3>
            <textarea
              className="w-full p-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-800 focus:outline-none text-neutral-800 bg-white"
              rows={4}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="Describe your work for today..."
              disabled={loading}
            />
            <button
              className={`mt-4 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                !workSummary.trim()
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
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
        <div className="px-8 mb-8">
          <div className="bg-neutral-900 text-white rounded-2xl py-4 px-6 shadow-lg">
            <p className="text-center font-medium">{feedback}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-neutral-50 p-6 border-t border-neutral-100 text-center text-neutral-400 text-sm">
        <p>Attendance Tracker • {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
