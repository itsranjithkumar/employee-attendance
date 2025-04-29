"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../utils/api";

interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  applied_at: string;
}

interface LeaveBalance {
  casual_leave_balance: number;
  sick_leave_balance: number;
  wfh_balance: number;
}

export default function LeavePage() {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance|null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Set token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchLeaveRequests();
      fetchLeaveBalance();
    } else {
      setAuthError("You are not logged in. Please login to apply for leave.");
    }
    // eslint-disable-next-line
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const res = await api.get("/leave/my-requests");
      setLeaveRequests(res.data);
    } catch (err: any) {
      setFeedback("Failed to fetch leave requests");
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const res = await api.get("/leave/balance");
      setLeaveBalance(res.data);
    } catch (err: any) {
      setLeaveBalance(null);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");
    setLoading(true);
    try {
      const res = await api.post("/leave/apply", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      setFeedback("Leave applied successfully");
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      fetchLeaveRequests();
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to apply for leave";
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
    <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Leave Management</h1>
      {/* Leave Balances */}
      {leaveBalance && (
        <div className="mb-6 flex gap-4 justify-between">
          <div className="bg-gray-100 p-4 rounded w-1/3 text-center">
            <div className="font-semibold text-gray-700">Casual Leave</div>
            <div className="text-2xl text-blue-700">{leaveBalance.casual_leave_balance}</div>
          </div>
          <div className="bg-gray-100 p-4 rounded w-1/3 text-center">
            <div className="font-semibold text-gray-700">Sick Leave</div>
            <div className="text-2xl text-blue-700">{leaveBalance.sick_leave_balance}</div>
          </div>
          <div className="bg-gray-100 p-4 rounded w-1/3 text-center">
            <div className="font-semibold text-gray-700">WFH</div>
            <div className="text-2xl text-blue-700">{leaveBalance.wfh_balance}</div>
          </div>
        </div>
      )}
      <form className="mb-8" onSubmit={handleApplyLeave}>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Leave Type</label>
          <select
            className="w-full p-2 border rounded"
            value={leaveType}
            onChange={e => setLeaveType(e.target.value)}
            required
          >
            <option value="">Select type</option>
            <option value="CASUAL">Casual</option>
            <option value="SICK">Sick</option>
            <option value="WFH">Work From Home</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Start Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">End Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Reason</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Applying..." : "Apply for Leave"}
        </button>
      </form>
      {feedback && <div className="mb-4 text-blue-700">{feedback}</div>}
      <h2 className="text-xl font-semibold mb-2">My Leave Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Type</th>
              <th className="px-2 py-1 border">Start</th>
              <th className="px-2 py-1 border">End</th>
              <th className="px-2 py-1 border">Reason</th>
              <th className="px-2 py-1 border">Status</th>
              <th className="px-2 py-1 border">Applied At</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-4">No leave requests found.</td></tr>
            ) : (
              leaveRequests.map(lr => (
                <tr key={lr.id}>
                  <td className="border px-2 py-1">{lr.leave_type}</td>
                  <td className="border px-2 py-1">{lr.start_date}</td>
                  <td className="border px-2 py-1">{lr.end_date}</td>
                  <td className="border px-2 py-1">{lr.reason}</td>
                  <td className="border px-2 py-1">{lr.status}</td>
                  <td className="border px-2 py-1">{new Date(lr.applied_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
