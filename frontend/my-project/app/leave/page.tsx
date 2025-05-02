"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { api, setAuthToken } from "../utils/api"
import { Calendar, Clock, Home, AlertCircle } from "lucide-react"

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
      <div className="max-w-4xl mx-auto mt-16 p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-medium text-gray-900">{authError}</h2>
          <p className="text-gray-500">Please sign in to access your leave management dashboard.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-50"
      case "REJECTED":
        return "text-red-600 bg-red-50"
      case "PENDING":
        return "text-amber-600 bg-amber-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="w-full min-h-screen p-8 bg-[#f5f5f7]">
      <h1 className="text-3xl font-semibold mb-8 text-gray-900 tracking-tight">Leave Management</h1>

      {/* Leave Balances */}
      {leaveBalance && (
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-gray-700 mr-2" />
              <div className="font-medium text-gray-700">Casual Leave</div>
            </div>
            <div className="text-4xl font-light text-gray-900">{leaveBalance.casual_leave_balance}</div>
            <div className="text-sm text-gray-500 mt-1">days available</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-3">
              <AlertCircle className="w-5 h-5 text-gray-700 mr-2" />
              <div className="font-medium text-gray-700">Sick Leave</div>
            </div>
            <div className="text-4xl font-light text-gray-900">{leaveBalance.sick_leave_balance}</div>
            <div className="text-sm text-gray-500 mt-1">days available</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center mb-3">
              <Home className="w-5 h-5 text-gray-700 mr-2" />
              <div className="font-medium text-gray-700">WFH</div>
            </div>
            <div className="text-4xl font-light text-gray-900">{leaveBalance.wfh_balance}</div>
            <div className="text-sm text-gray-500 mt-1">days available</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Apply for Leave Form */}
        <div className="w-full p-6">
          <h2 className="text-xl font-medium mb-6 text-gray-900">Apply for Leave</h2>
          <form className="space-y-5" onSubmit={handleApplyLeave}>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Leave Type</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Reason</label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Request"}
            </button>
          </form>
          {feedback && (
            <div
              className={`mt-4 p-3 rounded-xl ${feedback.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {feedback}
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <div className="w-full p-6">
          <h2 className="text-xl font-medium mb-6 text-gray-900">My Leave Requests</h2>
          <div className="overflow-hidden border border-gray-200">
            {leaveRequests.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p>No leave requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveRequests.map((lr) => (
                      <tr key={lr.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{lr.leave_type}</div>
                          <div className="text-xs text-gray-500">{new Date(lr.applied_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {lr.start_date} to {lr.end_date}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]" title={lr.reason}>
                            {lr.reason}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lr.status)}`}>
                            {lr.status}
                          </span>
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
