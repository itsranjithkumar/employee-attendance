"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../utils/api";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // JS months are 0-based
  const [year, setYear] = useState(today.getFullYear());
  const [calendarData, setCalendarData] = useState<{ [date: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchCalendar();
    } else {
      setAuthError("You are not logged in. Please login to view calendar.");
    }
    // eslint-disable-next-line
  }, [month, year]);

  const fetchCalendar = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get(`/calendar/?month=${month}&year=${year}`);
      setCalendarData(res.data);
    } catch (err: any) {
      setFeedback("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<td key={"empty-" + i}></td>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const status = calendarData[dateStr] || "future";
    let color = "";
    if (status === "present") color = "bg-green-300 border-green-700";
    else if (status === "leave") color = "bg-yellow-200 border-yellow-600";
    else if (status === "absent") color = "bg-red-200 border-red-600";
    else color = "bg-gray-100 border-gray-300";
    calendarCells.push(
      <td
        key={dateStr}
        className={`border text-center py-2 px-1 ${color}`}
        title={status.charAt(0).toUpperCase() + status.slice(1)}
      >
        <div className="font-semibold">{d}</div>
        <div className="text-xs capitalize">{status}</div>
      </td>
    );
  }
  // Pad end of last week
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(<td key={"pad-" + calendarCells.length}></td>);
  }

  // Break into weeks
  const weeks = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(<tr key={i}>{calendarCells.slice(i, i + 7)}</tr>);
  }

  if (authError) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded shadow text-red-600 font-bold text-center">
        {authError}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Attendance Calendar</h1>
      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          onClick={handlePrevMonth}
          disabled={loading}
        >
          &lt; Prev
        </button>
        <div className="font-semibold text-lg">
          {today.toLocaleString('default', { month: 'long' , year: 'numeric' })}
          {month !== today.getMonth() + 1 || year !== today.getFullYear()
            ? ` (${year}-${String(month).padStart(2, "0")})`
            : ''}
        </div>
        <button
          className="bg-gray-200 px-3 py-1 rounded"
          onClick={handleNextMonth}
          disabled={loading}
        >
          Next &gt;
        </button>
      </div>
      {feedback && <div className="mb-4 text-blue-700">{feedback}</div>}
      <table className="w-full border">
        <thead>
          <tr>
            {WEEK_DAYS.map(day => (
              <th key={day} className="border py-2">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>{weeks}</tbody>
      </table>
      <div className="mt-6 flex gap-4 text-sm">
        <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-green-300 border border-green-700 mr-1"></span> Present</div>
        <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-600 mr-1"></span> Leave</div>
        <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-200 border border-red-600 mr-1"></span> Absent</div>
        <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 mr-1"></span> Future</div>
      </div>
    </div>
  );
}
