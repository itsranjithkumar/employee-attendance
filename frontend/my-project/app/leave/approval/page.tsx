"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../../utils/api";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

interface LeaveRequest {
  id: number;
  employee_name: string;
  employee_email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get("/admin/leave-requests");
      setRequests(res.data);
    } catch {
      setFeedback("Failed to fetch leave requests.");
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setLoading(true);
    setFeedback("");
    try {
      await api.post(`/admin/leave-requests/${id}/approve`);
      setFeedback("Leave request approved.");
      setFeedbackType("success");
      fetchRequests();
    } catch {
      setFeedback("Failed to approve leave request.");
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setLoading(true);
    setFeedback("");
    try {
      await api.post(`/admin/leave-requests/${id}/reject`);
      setFeedback("Leave request rejected.");
      setFeedbackType("success");
      fetchRequests();
    } catch {
      setFeedback("Failed to reject leave request.");
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col items-center justify-center p-6">
      <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-8 max-w-4xl w-full mt-16 mb-16">
        <h1 className="text-3xl font-extrabold text-white mb-8 text-center tracking-tight drop-shadow-lg flex items-center justify-center gap-3">
          <AlertCircle className="h-8 w-8 text-blue-200" /> Leave Approval
        </h1>
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline" /> Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-500">No leave requests found.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      <div>{req.employee_name}</div>
                      <div className="text-xs text-slate-500">{req.employee_email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{req.leave_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {req.start_date} - {req.end_date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{req.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                      <button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                        onClick={() => handleApprove(req.id)}
                        disabled={req.status === "approved"}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                        onClick={() => handleReject(req.id)}
                        disabled={req.status === "rejected"}
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
