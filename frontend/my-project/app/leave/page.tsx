"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { api, setAuthToken } from "../utils/api"
import { Calendar, Clock, Home, AlertCircle, ChevronRight } from "lucide-react"

interface LeaveRequest {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  applied_at: string
}

interface LeaveBalance {
  casual_leave_balance: number
  sick_leave_balance: number
  wfh_balance: number
}

export default function LeavePage() {
  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [feedback, setFeedback] = useState("")
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  // Set token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      fetchLeaveRequests()
      fetchLeaveBalance()
    } else {
      setAuthError("You are not logged in. Please login to apply for leave.")
    }
    // eslint-disable-next-line
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      const res = await api.get("/leave/my-requests")
      setLeaveRequests(res.data)
    } catch (err: any) {
      setFeedback("Failed to fetch leave requests")
    }
  }

  const fetchLeaveBalance = async () => {
    try {
      const res = await api.get("/leave/balance")
      setLeaveBalance(res.data)
    } catch (err: any) {
      setLeaveBalance(null)
    }
  }

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback("")
    setLoading(true)
    try {
      const res = await api.post("/leave/apply", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      })
      setFeedback("Leave applied successfully")
      setLeaveType("")
      setStartDate("")
      setEndDate("")
      setReason("")
      fetchLeaveRequests()
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to apply for leave"
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

  if (authError) {
    return (
      <div className="max-w-4xl mx-auto mt-16 p-12 bg-white rounded-3xl shadow-xl text-center">
        <div className="flex flex-col items-center justify-center space-y-6">
          <AlertCircle className="w-20 h-20 text-rose-500" />
          <h2 className="text-3xl font-medium text-gray-900">{authError}</h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Please sign in to access your leave management dashboard.
          </p>
          <button className="mt-4 px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 border border-emerald-200"
      case "REJECTED":
        return "text-rose-600 bg-rose-50 border border-rose-200"
      case "PENDING":
        return "text-amber-600 bg-amber-50 border border-amber-200"
      default:
        return "text-gray-600 bg-gray-50 border border-gray-200"
    }
  }

  return (
    <div className="w-full min-h-screen p-8 md:p-12 bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-4xl font-bold mb-10 text-gray-900 tracking-tight">Leave Management</h1>

      {/* Leave Balances */}
      {leaveBalance && (
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-rose-500" />
              </div>
              <div className="font-medium text-gray-700 text-lg">Casual Leave</div>
            </div>
            <div className="text-5xl font-light text-gray-900 mt-2">{leaveBalance.casual_leave_balance}</div>
            <div className="text-sm text-gray-500 mt-2">days available</div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-violet-500" />
              </div>
              <div className="font-medium text-gray-700 text-lg">Sick Leave</div>
            </div>
            <div className="text-5xl font-light text-gray-900 mt-2">{leaveBalance.sick_leave_balance}</div>
            <div className="text-sm text-gray-500 mt-2">days available</div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mr-4">
                <Home className="w-6 h-6 text-teal-500" />
              </div>
              <div className="font-medium text-gray-700 text-lg">WFH</div>
            </div>
            <div className="text-5xl font-light text-gray-900 mt-2">{leaveBalance.wfh_balance}</div>
            <div className="text-sm text-gray-500 mt-2">days available</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Apply for Leave Form */}
        <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-8 text-gray-900">Apply for Leave</h2>
          <form className="space-y-6" onSubmit={handleApplyLeave}>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Leave Type</label>
              <select
                className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-gray-700"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="WFH">Work From Home</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-gray-700"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-gray-700"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Reason</label>
              <textarea
                className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-gray-700"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white px-6 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
          {feedback && (
            <div
              className={`mt-6 p-4 rounded-2xl ${
                feedback.includes("success")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              } flex items-start`}
            >
              {feedback.includes("success") ? (
                <svg
                  className="w-5 h-5 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              )}
              {feedback}
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-8 text-gray-900">My Leave Requests</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            {leaveRequests.length === 0 ? (
              <div className="text-center p-12 text-gray-500 bg-gray-50">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No leave requests found.</p>
                <p className="text-sm text-gray-400 mt-2">Your leave history will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveRequests.map((lr) => (
                      <tr key={lr.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{lr.leave_type}</div>
                          <div className="text-xs text-gray-500">{new Date(lr.applied_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(lr.start_date).toLocaleDateString()} to{" "}
                            {new Date(lr.end_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]" title={lr.reason}>
                            {lr.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 text-xs rounded-full ${getStatusColor(lr.status)}`}>
                            {lr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-400 hover:text-gray-600">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
