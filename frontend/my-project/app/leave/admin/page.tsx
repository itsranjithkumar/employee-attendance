"use client"
import { useEffect, useState } from "react"
import { api, setAuthToken } from "../../utils/api"
import { CheckCircle, XCircle, Calendar, Clock, FileText, User } from "lucide-react"

interface LeaveRequest {
  id: number
  employee_id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  applied_at: string
  employee: {
    name: string
    email: string
  }
}

export default function AdminLeavePage() {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info")
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      fetchPendingRequests()
    } else {
      setAuthError("You are not logged in or not an admin.")
    }
    // eslint-disable-next-line
  }, [])

  const fetchPendingRequests = async () => {
    setLoading(true)
    setFeedback("")
    try {
      const res = await api.get("/leave/pending")
      setPendingRequests(res.data)
    } catch (err: any) {
      setFeedback("Failed to fetch pending requests")
      setFeedbackType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (leaveId: number, action: "approve" | "reject") => {
    setLoading(true)
    setFeedback("")
    try {
      await api.post(`/leave/${action}/${leaveId}`)
      setFeedback(`Leave ${action}d successfully`)
      setFeedbackType("success")
      fetchPendingRequests()
    } catch (err: any) {
      let detail = err.response?.data?.detail || `Failed to ${action} leave`
      if (Array.isArray(detail)) {
        detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
      } else if (typeof detail === "object") {
        detail = detail.msg || JSON.stringify(detail)
      }
      setFeedback(detail)
      setFeedbackType("error")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 text-red-600 font-medium text-center">
          {authError}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin: Pending Leave Requests</h1>
            <p className="text-slate-300 mt-2 text-sm md:text-base">Review and manage employee leave applications</p>
          </div>

          <div className="p-6 md:p-8">
            {feedback && (
              <div
                className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                  feedbackType === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : feedbackType === "error"
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                }`}
              >
                {feedback}
              </div>
            )}

            {loading && (
              <div className="flex justify-center my-8">
                <div className="animate-pulse flex space-x-4">
                  <div className="h-3 w-3 bg-slate-400 rounded-full"></div>
                  <div className="h-3 w-3 bg-slate-400 rounded-full"></div>
                  <div className="h-3 w-3 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            )}

            {!loading && pendingRequests.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No pending requests</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  There are currently no leave requests pending approval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {pendingRequests.map((lr) => (
                      <tr key={lr.id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 mr-3">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">ID: {lr.employee_id}</div>
                              {lr.employee && (
                                <div className="text-xs text-slate-500">{lr.employee.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {lr.leave_type}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-slate-900 flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                              {formatDate(lr.start_date)}
                            </div>
                            <div className="text-sm text-slate-900 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                              {formatDate(lr.end_date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-900 flex items-start">
                            <FileText className="h-3 w-3 mr-1 text-slate-400 mt-1 flex-shrink-0" />
                            <span className="line-clamp-2">{lr.reason}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(lr.applied_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-150"
                              disabled={loading}
                              onClick={() => handleAction(lr.id, "approve")}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-colors duration-150"
                              disabled={loading}
                              onClick={() => handleAction(lr.id, "reject")}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </button>
                          </div>
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
