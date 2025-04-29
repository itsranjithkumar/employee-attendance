"use client";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../utils/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'users' | 'attendance'>("users");
  const [feedback, setFeedback] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      checkAdmin();
    } else {
      setAuthError("You are not logged in. Please login as admin.");
    }
    // eslint-disable-next-line
  }, []);

  // Check if current user is admin
  const checkAdmin = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get("/admin/users");
      setIsAdmin(true);
      setUsers(res.data);
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Access denied: Admins only.";
      setAuthError(detail);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err: any) {
      setFeedback("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // --- CREATE USER ---
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    try {
      await api.post("/admin/users", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setFeedback("User created successfully");
      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      fetchUsers();
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to create user";
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

  // --- EDIT/DELETE USER ---
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editPassword, setEditPassword] = useState("");

  const startEditUser = (user: User) => {
    setEditUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editUserId == null) return;
    setLoading(true);
    setFeedback("");
    try {
      await api.put(`/admin/users/${editUserId}`, {
        name: editName,
        email: editEmail,
        password: editPassword,
      });
      setFeedback("User updated successfully");
      setEditUserId(null);
      fetchUsers();
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to update user";
      setFeedback(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    setFeedback("");
    try {
      await api.delete(`/admin/users/${userId}`);
      setFeedback("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to delete user";
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
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="mb-6 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${tab === "users" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("users")}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 rounded ${tab === "attendance" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setTab("attendance")}
        >
          Attendance
        </button>
      </div>
      {tab === "users" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Users</h2>
          <button
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => setShowCreate(v => !v)}
          >
            {showCreate ? "Cancel" : "Create User"}
          </button>
          {showCreate && (
            <form className="mb-6 p-4 bg-gray-50 rounded" onSubmit={handleCreateUser}>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Name</label>
                <input
                  className="w-full p-2 border rounded"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Role</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </form>
          )}
          {loading && <div className="mb-2">Loading users...</div>}
          {feedback && <div className="mb-2 text-blue-700">{feedback}</div>}
          <table className="min-w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">ID</th>
                <th className="px-2 py-1 border">Name</th>
                <th className="px-2 py-1 border">Email</th>
                <th className="px-2 py-1 border">Role</th>
                <th className="px-2 py-1 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4">No users found.</td></tr>
              ) : (
                users.map(u => (
                  editUserId === u.id ? (
                    <tr key={u.id} className="bg-yellow-50">
                      <td className="border px-2 py-1">{u.id}</td>
                      <td className="border px-2 py-1">
                        <input
                          className="w-full p-1 border rounded"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          className="w-full p-1 border rounded"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <select
                          className="w-full p-1 border rounded"
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          disabled
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="border px-2 py-1 flex flex-col gap-2">
                        <input
                          type="password"
                          className="w-full p-1 border rounded mb-1"
                          placeholder="New password (required)"
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            className="bg-blue-600 text-white px-2 py-1 rounded"
                            onClick={handleEditUser}
                            disabled={loading || !editPassword}
                          >Save</button>
                          <button
                            className="bg-gray-400 text-white px-2 py-1 rounded"
                            onClick={() => setEditUserId(null)}
                          >Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id}>
                      <td className="border px-2 py-1">{u.id}</td>
                      <td className="border px-2 py-1">{u.name}</td>
                      <td className="border px-2 py-1">{u.email}</td>
                      <td className="border px-2 py-1">{u.role}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded"
                          onClick={() => startEditUser(u)}
                          disabled={loading}
                        >Edit</button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={loading}
                        >Delete</button>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
          {/* Create/Edit/Delete UI will go here */}
        </div>
      )}
      {tab === "attendance" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Monitor Attendance</h2>
          <AttendanceMonitor />
        </div>
      )}
    </div>
  );
}

// --- Attendance Monitor Component ---
function AttendanceMonitor() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line
  }, [date]);

  const fetchAttendance = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await api.get(`/admin/attendance?date=${date}`);
      console.log("Attendance records for", date, res.data); // DEBUG LOG
      setRecords(res.data);
      if (Array.isArray(res.data) && res.data.length === 0) {
        setFeedback("No attendance records found (check backend data and date format).");
      }
    } catch (err: any) {
      setFeedback("Failed to fetch attendance records");
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="font-semibold">Date:</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      {loading && <div>Loading attendance...</div>}
      {feedback && <div className="mb-2 text-blue-700">{feedback}</div>}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border">User ID</th>
            <th className="px-2 py-1 border">Name</th>
            <th className="px-2 py-1 border">Email</th>
            <th className="px-2 py-1 border">Status</th>
            <th className="px-2 py-1 border">Check In</th>
            <th className="px-2 py-1 border">Check Out</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr><td colSpan={6} className="text-center p-4">No attendance records found.</td></tr>
          ) : (
            records.map((rec, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{rec.user_id}</td>
                <td className="border px-2 py-1">{rec.name || "-"}</td>
                <td className="border px-2 py-1">{rec.email || "-"}</td>
                <td className="border px-2 py-1 capitalize">{rec.status || "-"}</td>
                <td className="border px-2 py-1">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString() : "-"}</td>
                <td className="border px-2 py-1">{rec.check_out ? new Date(rec.check_out).toLocaleTimeString() : "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
