"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../utils/api";

interface AttendanceStatus {
  started: boolean;
  ended: boolean;
  onBreak: boolean;
  message?: string;
}

export default function AttendancePage() {
  const [status, setStatus] = useState<AttendanceStatus>({ started: false, ended: false, onBreak: false });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [workSummary, setWorkSummary] = useState("");
  const [showWorkSummary, setShowWorkSummary] = useState(false);
  const [authError, setAuthError] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds

  // Set token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    } else {
      setAuthError("You are not logged in. Please login to mark attendance.");
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status.started && !status.ended && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (status.ended && startTime && endTime) {
      setElapsed(Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
    } else {
      setElapsed(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [status.started, status.ended, startTime, endTime]);

  const handleAction = async (action: "start" | "end" | "break-in" | "break-out") => {
    if (showWorkSummary) return; // Prevent multiple modals
    setLoading(true);
    setFeedback("");
    try {
      if (action === "end") {
        setShowWorkSummary(true);
        setLoading(false);
        return;
      }
      // For 'start', send required empty work_summary
      if (action === "start") {
        const res = await api.post(`/attendance/start`, { work_summary: "" });
        setFeedback(res.data.msg || "Success");
        setStatus({ started: true, ended: false, onBreak: false });
        setStartTime(new Date());
      } else {
        const res = await api.post(`/attendance/${action}`);
        setFeedback(res.data.msg || "Success");
        if (action === "break-in") setStatus(s => ({ ...s, onBreak: true }));
        if (action === "break-out") setStatus(s => ({ ...s, onBreak: false }));
      }
    } catch (err: any) {
      // Improved error handling for array/object error responses
      let detail = err.response?.data?.detail || "Action failed";
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

  const handleSubmitWorkSummary = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.post(`/attendance/end`, { work_summary: workSummary });
      setFeedback(res.data.msg || "Day ended and summary saved");
      setStatus({ started: false, ended: true, onBreak: false });
      setShowWorkSummary(false);
      setEndTime(new Date());
    } catch (err: any) {
      setFeedback(err.response?.data?.detail || "Failed to save summary");
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
      <h1 className="text-2xl font-bold mb-6">Attendance Dashboard</h1>
      <div className="mb-4">
        <div>Status: {status.ended ? "Ended" : status.started ? (status.onBreak ? "On Break" : "Present") : "Not Started"}</div>
        {status.started && !status.ended && (
          <div className="font-mono text-lg text-green-700">
            Time Elapsed: {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
            {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
            {(elapsed % 60).toString().padStart(2, '0')}
          </div>
        )}
        {status.ended && (
          <div className="font-mono text-lg text-blue-700">
            Total Time: {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
            {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
            {(elapsed % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="flex gap-4 mb-6">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || status.started || status.ended}
          onClick={() => handleAction("start")}
        >
          Start Day
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !status.started || status.ended || showWorkSummary}
          onClick={() => handleAction("end")}
        >
          End Day
        </button>
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !status.started || status.ended || status.onBreak}
          onClick={() => handleAction("break-in")}
        >
          Break In
        </button>
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !status.onBreak || status.ended}
          onClick={() => handleAction("break-out")}
        >
          Break Out
        </button>
      </div>
      {showWorkSummary && (
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Work Summary (required to end day)</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={workSummary}
            onChange={e => setWorkSummary(e.target.value)}
            placeholder="Describe your work for today..."
            disabled={loading}
          />
          <button
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading || !workSummary.trim()}
            onClick={handleSubmitWorkSummary}
          >
            Submit Summary & End Day
          </button>
        </div>
      )}
      {feedback && <div className="mb-2 text-blue-700">{feedback}</div>}
    </div>
  );
}
