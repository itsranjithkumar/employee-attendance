"use client"
import { useEffect, useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import { api, setAuthToken } from "../utils/api"
import { Users, Plus, Edit, Trash2, Save, X, Check, AlertCircle, Loader2 } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [authError, setAuthError] = useState("")
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"users" | "attendance">("users")
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setAuthToken(token)
      checkAdmin()
    } else {
      setAuthError("You are not logged in. Please login as admin.")
    }
    // eslint-disable-next-line
  }, [])

  // Check if current user is admin
  const checkAdmin = async () => {
    setLoading(true)
    setFeedback("")
    try {
      const res = await api.get("/admin/users")
      setIsAdmin(true)
      setUsers(res.data)
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Access denied: Admins only."
      setAuthError(detail)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setFeedback("")
    try {
      const res = await api.get("/admin/users")
      setUsers(res.data)
      setFeedbackType("success")
    } catch (err: any) {
      setFeedback("Failed to fetch users")
      setFeedbackType("error")
    } finally {
      setLoading(false)
    }
  }

  // --- CREATE USER ---
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("user")

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback("")
    try {
      await api.post("/admin/users", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      })
      setFeedback("User created successfully")
      setFeedbackType("success")
      setShowCreate(false)
      setNewName("")
      setNewEmail("")
      setNewPassword("")
      setNewRole("user")
      fetchUsers()
    } catch (err: any) {
      let detail = err.response?.data?.detail || "Failed to create user"
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

  // --- EDIT/DELETE USER ---
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("user")
  const [editPassword, setEditPassword] = useState("")

  const startEditUser = (user: User) => {
    setEditUserId(user.id)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setEditPassword("")
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editUserId == null) return
    setLoading(true)
    setFeedback("")
    try {
      await api.put(`/admin/users/${editUserId}`, {
        name: editName,
        email: editEmail,
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      })
      setFeedback("User updated successfully")
      setFeedbackType("success")
      setEditUserId(null)
      fetchUsers()
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to update user"
      setFeedback(detail)
      setFeedbackType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return
    setLoading(true)
    setFeedback("")
    try {
      await api.delete(`/admin/users/${userId}`)
      setFeedback("User deleted successfully")
      setFeedbackType("success")
      fetchUsers()
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to delete user"
      setFeedback(detail)
      setFeedbackType("error")
    } finally {
      setLoading(false)
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-8 bg-white border border-gray-200 rounded-2xl shadow-xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-700">{authError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="w-full flex justify-center pt-8 pb-4">
        <div className="flex items-center space-x-4">
          {/* Elegant Admin Dashboard Logo - Grey/White/Black */}
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-400 flex items-center px-4 py-2">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="#f3f4f6" />
              <path d="M24 14c-4.418 0-8 2.686-8 6v2c0 3.314 3.582 6 8 6s8-2.686 8-6v-2c0-3.314-3.582-6-8-6zm0 14c-3.314 0-6 2.014-6 4.5V36h12v-3.5c0-2.486-2.686-4.5-6-4.5z" fill="#111827"/>
              <circle cx="24" cy="20" r="4" fill="#fff"/>
            </svg>
            <span className="ml-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-800 to-gray-400 bg-clip-text text-transparent drop-shadow">Admin Dashboard</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-10 mb-16">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
            </h1>
            <button
              className="bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => router.push("/leave/admin")}
            >
              Leave Approval
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
                  <Users className="h-8 w-8 text-gray-400" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-400 text-gray-700">
                    User Management
                  </span>
                </h2>
              </div>

              {tab === "users" && (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <button
                      className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        showCreate
                          ? "bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400 shadow-lg"
                      }`}
                      onClick={() => setShowCreate((v) => !v)}
                    >
                      {showCreate ? (
                        <>
                          <X className="h-5 w-5 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Create User
                        </>
                      )}
                    </button>
                  </div>

                  {showCreate && (
                    <form
                      className="mb-10 p-8 bg-gray-50 rounded-2xl border border-gray-200 shadow-xl"
                      onSubmit={handleCreateUser}
                    >
                      <h3 className="text-2xl font-medium text-gray-800 mb-6">Create New User</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                          <input
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                          <input
                            type="email"
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                          <input
                            type="password"
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                          <select
                            className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          type="submit"
                          className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg disabled:opacity-50 transform hover:scale-105"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Check className="h-5 w-5 mr-2" />
                              Create User
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {loading && !showCreate && (
                    <div className="flex justify-center my-10">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-lg">Loading users...</span>
                      </div>
                    </div>
                  )}

                  {feedback && (
                    <div
                      className={`mb-6 p-4 rounded-xl ${
                        feedbackType === "success"
                          ? "bg-green-100 border border-green-300 text-green-700"
                          : feedbackType === "error"
                            ? "bg-red-100 border border-red-300 text-red-700"
                            : "bg-gray-100 border border-gray-300 text-gray-700"
                      }`}
                    >
                      <p className="flex items-center">
                        {feedbackType === "success" && <Check className="h-5 w-5 mr-2" />}
                        {feedbackType === "error" && <AlertCircle className="h-5 w-5 mr-2" />}
                        {feedbackType === "info" && <AlertCircle className="h-5 w-5 mr-2" />}
                        {Array.isArray(feedback)
                          ? feedback.map((f, idx) => (
                              <span key={idx} className="block">
                                {typeof f === "object" ? JSON.stringify(f) : String(f)}
                              </span>
                            ))
                          : typeof feedback === "object"
                            ? JSON.stringify(feedback)
                            : feedback}
                      </p>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.length === 0 ? (
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="text-center p-8 text-gray-400">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) =>
                            editUserId === u.id ? (
                              <tr key={u.id} className="bg-gray-100">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    required
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="space-y-3">
                                    <input
                                      type="password"
                                      className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition text-gray-800"
                                      placeholder="New password (leave blank to keep unchanged)"
                                      value={editPassword}
                                      onChange={(e) => setEditPassword(e.target.value)}
                                      autoComplete="new-password"
                                    />
                                    <div className="flex justify-end space-x-3">
                                      <button
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg font-semibold transform hover:scale-105"
                                        onClick={handleEditUser}
                                        disabled={loading}
                                      >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                      </button>
                                      <button
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-xl hover:from-red-500 hover:to-red-700 transition-all duration-300 shadow-lg font-semibold transform hover:scale-105"
                                        onClick={() => setEditUserId(null)}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={u.id} className="bg-white hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      u.role === "admin"
                                        ? "bg-gray-900/10 text-gray-900 border border-gray-400"
                                        : "bg-gray-200 text-gray-700 border border-gray-300"
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-3">
                                    <button
                                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                                      onClick={() => startEditUser(u)}
                                      disabled={loading}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-xl hover:bg-red-200 transition-all duration-300 transform hover:scale-105"
                                      onClick={() => handleDeleteUser(u.id)}
                                      disabled={loading}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ),
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
