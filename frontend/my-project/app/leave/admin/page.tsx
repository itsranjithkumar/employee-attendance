"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../../utils/api";

interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  applied_at: string;
  employee?: { name?: string; email?: string };
}

export default function AdminLeavePage() {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchPendingRequests();
    } else {
      setAuthError("You are not logged in or not an admin.");
    }
    // eslint-disable-next-line
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get("/leave/pending");
      setPendingRequests(res.data);
    } catch (err: any) {
      setFeedback("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (leaveId: number, action: "approve" | "reject") => {
    setLoading(true);
    setFeedback("");
    try {
      await api.post(`/leave/${action}/${leaveId}`);
      setFeedback(`Leave ${action}d successfully`);
      fetchPendingRequests();
    } catch (err: any) {
      let detail = err.response?.data?.detail || `Failed to ${action} leave`;
      if (Array.isArray(detail)) {
        detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
      } else if (typeof detail === "object") {
        detail = detail.msg || JSON.stringify(detail);
      }
      setFeedback(detail);
    } finally {
      setLoading(false);
    }
  };

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded shadow text-red-600 font-bold text-center">
        {authError}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Admin: Pending Leave Requests</h1>
      {feedback && <div className="mb-4 text-blue-700">{feedback}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Employee ID</th>
              <th className="px-2 py-1 border">Type</th>
              <th className="px-2 py-1 border">Start</th>
              <th className="px-2 py-1 border">End</th>
              <th className="px-2 py-1 border">Reason</th>
              <th className="px-2 py-1 border">Applied At</th>
              <th className="px-2 py-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">No pending leave requests.</td></tr>
            ) : (
              pendingRequests.map(lr => (
                <tr key={lr.id}>
                  <td className="border px-2 py-1">{lr.employee_id}</td>
                  <td className="border px-2 py-1">{lr.leave_type}</td>
                  <td className="border px-2 py-1">{lr.start_date}</td>
                  <td className="border px-2 py-1">{lr.end_date}</td>
                  <td className="border px-2 py-1">{lr.reason}</td>
                  <td className="border px-2 py-1">{new Date(lr.applied_at).toLocaleDateString()}</td>
                  <td className="border px-2 py-1 flex gap-2 justify-center">
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                      disabled={loading}
                      onClick={() => handleAction(lr.id, "approve")}
                    >Approve</button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                      disabled={loading}
                      onClick={() => handleAction(lr.id, "reject")}
                    >Reject</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
