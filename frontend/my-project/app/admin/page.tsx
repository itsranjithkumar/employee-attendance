"use client"
import { useEffect, useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import { api, setAuthToken } from "../utils/api"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Settings,
  Shield,
  Bell,
} from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")

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

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (authError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-xl w-full p-10 bg-zinc-900 rounded-3xl shadow-2xl text-center border border-zinc-800">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-3">Authentication Error</h2>
          <p className="text-zinc-400 mb-8">{authError}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-medium rounded-2xl transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 backdrop-blur-lg bg-black/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-20 px-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r text-white">
                DESKBOARD
              </span>
              <span className="ml-2 text-sm bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">Admin</span>
            </div>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-zinc-400">System Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">User Management</h1>
            <p className="text-zinc-400 text-lg">Manage system users and permissions</p>
          </div>

          <div className="mt-6 md:mt-0">
            <button
              className="h-12 px-6 flex items-center justify-center rounded-full bg-white text-black font-medium hover:bg-zinc-100 transition-colors"
              onClick={() => router.push("/leave/admin")}
            >
              Leave Approval
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl mb-10">
          {/* Card Header */}
          <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-zinc-400 mr-3" />
              <h2 className="text-xl font-medium text-white">System Users</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Create User Button */}
              <button
                className={`h-10 px-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center ${
                  showCreate ? "bg-zinc-700 text-white" : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create User Form */}
          {showCreate && (
            <div className="p-6 border-b border-zinc-800 bg-zinc-800/50">
              <form onSubmit={handleCreateUser}>
                <h3 className="text-lg font-medium text-white mb-6">Create New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
                    <input
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                    <input
                      type="password"
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                    <select
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
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
                    className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 disabled:opacity-50"
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
            </div>
          )}

          {/* Feedback Messages */}
          {feedback && (
            <div
              className={`mx-6 my-4 p-4 rounded-xl ${
                feedbackType === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : feedbackType === "error"
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-400"
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

          {/* Loading State */}
          {loading && !showCreate && (
            <div className="flex justify-center my-10">
              <div className="flex items-center space-x-3 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">Loading users...</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 text-left">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredUsers.length === 0 ? (
                  <tr className="bg-zinc-900">
                    <td colSpan={5} className="text-center p-8 text-zinc-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) =>
                    editUserId === u.id ? (
                      <tr key={u.id} className="bg-zinc-800/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
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
                              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white"
                              placeholder="New password (leave blank to keep unchanged)"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              autoComplete="new-password"
                            />
                            <div className="flex justify-end space-x-3">
                              <button
                                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 font-medium"
                                onClick={handleEditUser}
                                disabled={loading}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </button>
                              <button
                                className="flex items-center px-4 py-2 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600 transition-all duration-300 font-medium"
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
                      <tr key={u.id} className="bg-zinc-900 hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              u.role === "admin"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-zinc-700 text-zinc-300 border border-zinc-600"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              className="flex items-center px-4 py-2 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl hover:bg-zinc-700 hover:text-white transition-all duration-300"
                              onClick={() => startEditUser(u)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all duration-300"
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

          {/* Table Footer */}
          <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
            <div className="text-sm text-zinc-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">© 2024 Deskboard. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy Policy</button>
              <button className="text-sm text-zinc-500 hover:text-white transition-colors">Terms of Service</button>
              <button className="text-sm text-zinc-500 hover:text-white transition-colors">Help Center</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
