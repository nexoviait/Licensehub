import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Trash2,
  Edit,
  Search,
  ShieldCheck,
  RefreshCw,
  X,
  AlertCircle
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userErrors, setUserErrors] = useState({});

  // User form data
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get("/users").catch(() => null),
        api.get("/roles").catch(() => null),
      ]);

      const userList = Array.isArray(usersRes?.data) ? usersRes.data : (Array.isArray(usersRes) ? usersRes : []);
      const roleList = Array.isArray(rolesRes?.data) ? rolesRes.data : (Array.isArray(rolesRes) ? rolesRes : []);

      setUsers(userList);
      setRoles(roleList);
    } catch (error) {
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  };

  const validateUserForm = () => {
    const errs = {};
    if (!userFormData.name || !userFormData.name.trim()) {
      errs.name = "Full Name is required.";
    }

    if (!userFormData.email || !userFormData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!editingUser && (!userFormData.password || userFormData.password.length < 8)) {
      errs.password = "Password is required and must be at least 8 characters long.";
    } else if (editingUser && userFormData.password && userFormData.password.length < 8) {
      errs.password = "New password must be at least 8 characters long.";
    }

    setUserErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    setUserErrors({});
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userFormData);
        toast.success("User updated successfully");
      } else {
        await api.post("/users", userFormData);
        toast.success("User created successfully");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserFormData({ name: "", email: "", password: "", role: "viewer" });
      fetchData();
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrs = error.response.data.errors;
        const formatted = {};
        if (backendErrs.name) formatted.name = backendErrs.name[0];
        if (backendErrs.email) formatted.email = backendErrs.email[0];
        if (backendErrs.password) formatted.password = backendErrs.password[0];
        if (backendErrs.role) formatted.role = backendErrs.role[0];
        setUserErrors(formatted);
      } else {
        toast.error(error.response?.data?.message || "Failed to save user");
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggle2FA = async (user, currentStatus) => {
    const newStatus = !currentStatus;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, two_factor_enabled: newStatus } : u))
    );

    try {
      const res = await api.post(`/users/${user.id}/2fa`, { enabled: newStatus });
      toast.success(res?.message || `2FA ${newStatus ? "enabled" : "disabled"} for ${user.name}`);
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, two_factor_enabled: currentStatus } : u))
      );
      toast.error(error.response?.data?.message || "Failed to update 2FA status");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        size="sm"
        onClick={() => {
          setEditingUser(null);
          setUserFormData({ name: "", email: "", password: "", role: "viewer" });
          setUserErrors({});
          setIsUserModalOpen(true);
        }}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add User
      </Button>
    </div>
  );

  return (
    <AdminShell
      title="User Management"
      subtitle="Manage registered system users, account profiles, and assign Spatie RBAC roles."
      actions={headerActions}
      requirePermission="users.view"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3 text-center">2FA Protection</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {loading ? "Loading users..." : "No users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const primaryRole = u.roles?.[0]?.name || "viewer";
                  const is2FA = Boolean(u.two_factor_enabled);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.name ? u.name.substring(0, 2).toUpperCase() : "US"}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize border border-blue-200">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {primaryRole.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={is2FA}
                            onCheckedChange={() => handleToggle2FA(u, is2FA)}
                          />
                          <span className={`text-xs font-semibold ${is2FA ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                            {is2FA ? "Active" : "Off"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setUserFormData({
                                name: u.name,
                                email: u.email,
                                password: "",
                                role: primaryRole
                              });
                              setUserErrors({});
                              setIsUserModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Create/Edit User */}
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-semibold text-lg text-slate-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateUser} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <Input
                    value={userFormData.name}
                    onChange={(e) => {
                      setUserFormData({ ...userFormData, name: e.target.value });
                      if (userErrors.name) setUserErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. John Doe"
                    className={userErrors.name ? "border-red-500" : ""}
                  />
                  {userErrors.name && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {userErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => {
                      setUserFormData({ ...userFormData, email: e.target.value });
                      if (userErrors.email) setUserErrors((prev) => ({ ...prev, email: null }));
                    }}
                    placeholder="john@example.com"
                    className={userErrors.email ? "border-red-500" : ""}
                  />
                  {userErrors.email && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {userErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password {editingUser && "(leave blank to keep unchanged)"}
                  </label>
                  <Input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => {
                      setUserFormData({ ...userFormData, password: e.target.value });
                      if (userErrors.password) setUserErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder="••••••••"
                    className={userErrors.password ? "border-red-500" : ""}
                  />
                  {userErrors.password && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {userErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assign Role</label>
                  <select
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save User</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
