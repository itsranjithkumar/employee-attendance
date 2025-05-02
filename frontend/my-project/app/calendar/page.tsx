"use client"
import { useEffect, useState } from "react"
import { api, setAuthToken } from "../utils/api"
import { ChevronLeft, ChevronRight } from "lucide-react"

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1) // JS months are 0-based
  const [year, setYear] = useState(today.getFullYear())
  const [calendarData, setCalendarData] = useState<{ [date: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      fetchCalendar()
    } else {
      setAuthError("You are not logged in. Please login to view calendar.")
    }
    // eslint-disable-next-line
  }, [month, year])

  const fetchCalendar = async () => {
    setLoading(true)
    setFeedback("")
    try {
      const res = await api.get(`/calendar/?month=${month}&year=${year}`)
      setCalendarData(res.data)
    } catch (err: any) {
      setFeedback("Failed to fetch calendar data")
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)

  // Build calendar grid
  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<td key={"empty-" + i} className="border-none"></td>)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const status = calendarData[dateStr] || "future"

    let statusClass = ""
    let statusBg = ""

    if (status === "present") {
      statusClass = "text-emerald-700"
      statusBg = "bg-emerald-50 hover:bg-emerald-100"
    } else if (status === "leave") {
      statusClass = "text-amber-700"
      statusBg = "bg-amber-50 hover:bg-amber-100"
    } else if (status === "absent") {
      statusClass = "text-rose-700"
      statusBg = "bg-rose-50 hover:bg-rose-100"
    } else {
      statusClass = "text-slate-500"
      statusBg = "bg-slate-50 hover:bg-slate-100"
    }

    const isToday = today.getDate() === d && today.getMonth() + 1 === month && today.getFullYear() === year

    calendarCells.push(
      <td
        key={dateStr}
        className={`relative group transition-all duration-200 ${statusBg} ${isToday ? "ring-2 ring-offset-2 ring-slate-300" : ""}`}
        title={status.charAt(0).toUpperCase() + status.slice(1)}
      >
        <div className="aspect-square flex flex-col items-center justify-center p-1 md:p-3">
          <div className={`font-medium text-sm md:text-base ${statusClass}`}>{d}</div>
          <div className={`text-xs capitalize mt-1 font-medium ${statusClass}`}>{status}</div>
        </div>
      </td>,
    )
  }

  // Pad end of last week
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(<td key={"pad-" + calendarCells.length} className="border-none"></td>)
  }

  // Break into weeks
  const weeks = []
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(<tr key={i}>{calendarCells.slice(i, i + 7)}</tr>)
  }

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 text-red-600 font-medium text-center">
        {authError}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="w-full min-h-screen bg-white">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Attendance Calendar</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base">Track your attendance records</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
              onClick={handlePrevMonth}
              disabled={loading}
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
              <span className="sr-only">Previous Month</span>
            </button>

            <div className="font-semibold text-xl md:text-2xl text-slate-800">
              {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
            </div>

            <button
              className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
              onClick={handleNextMonth}
              disabled={loading}
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
              <span className="sr-only">Next Month</span>
            </button>
          </div>

          {feedback && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm">
              {feedback}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 md:border-spacing-2">
              <thead>
                <tr>
                  {WEEK_DAYS.map((day) => (
                    <th key={day} className="pb-3 text-sm font-medium text-slate-500">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{weeks}</tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200"></span>
              <span className="text-slate-700">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full bg-amber-50 border border-amber-200"></span>
              <span className="text-slate-700">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full bg-rose-50 border border-rose-200"></span>
              <span className="text-slate-700">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full bg-slate-50 border border-slate-200"></span>
              <span className="text-slate-700">Future</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
