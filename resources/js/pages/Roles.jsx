import React, { useState, useEffect } from "react";
import {
  KeyRound,
  CheckCircle2,
  Trash2,
  Edit,
  PlusCircle,
  RefreshCw,
  X,
  ShieldCheck,
  Search,
  AlertCircle
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleErrors, setRoleErrors] = useState({});

  // Role form data
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    permissions: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/roles").catch(() => null),
        api.get("/permissions").catch(() => null),
      ]);

      const roleList = Array.isArray(rolesRes?.data) ? rolesRes.data : (Array.isArray(rolesRes) ? rolesRes : []);
      const permList = Array.isArray(permsRes?.data) ? permsRes.data : (Array.isArray(permsRes) ? permsRes : []);

      setRoles(roleList);
      setPermissions(permList);
    } catch (error) {
      toast.error("Failed to load roles and permissions data");
    } finally {
      setLoading(false);
    }
  };

  const validateRoleForm = () => {
    const errs = {};
    if (!roleFormData.name || !roleFormData.name.trim()) {
      errs.name = "Role name is required.";
    }
    setRoleErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOrUpdateRole = async (e) => {
    e.preventDefault();
    if (!validateRoleForm()) return;

    setRoleErrors({});
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleFormData);
        toast.success("Role updated successfully");
      } else {
        await api.post("/roles", roleFormData);
        toast.success("Role created successfully");
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      setRoleFormData({ name: "", permissions: [] });
      fetchData();
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrs = error.response.data.errors;
        const formatted = {};
        if (backendErrs.name) formatted.name = backendErrs.name[0];
        setRoleErrors(formatted);
      } else {
        toast.error(error.response?.data?.message || "Failed to save role");
      }
    }
  };

  const handleDeleteRole = async (id, roleName) => {
    if (["super_admin", "admin"].includes(roleName)) {
      toast.error("System critical roles cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete role '${roleName}'?`)) return;

    try {
      await api.delete(`/roles/${id}`);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  const filteredPermissions = permissions.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          setEditingRole(null);
          setRoleFormData({ name: "", permissions: [] });
          setRoleErrors({});
          setIsRoleModalOpen(true);
        }}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Create Role
      </Button>
    </div>
  );

  return (
    <AdminShell
      title="Roles & Permissions"
      subtitle="Configure Spatie roles and grant granular feature permissions across modules."
      actions={headerActions}
      requirePermission="roles.view"
    >
      <div className="space-y-6">
        {/* Roles Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 capitalize flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {r.name.replace("_", " ")}
                  </span>
                  {!["super_admin", "admin"].includes(r.name) && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900"
                        onClick={() => {
                          setEditingRole(r);
                          setRoleFormData({
                            name: r.name,
                            permissions: r.permissions?.map((p) => p.name) || []
                          });
                          setRoleErrors({});
                          setIsRoleModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                        onClick={() => handleDeleteRole(r.id, r.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {r.permissions?.length || 0} permissions assigned
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Guard: {r.guard_name || "api"}</span>
                <span className="font-medium text-primary">ID: {r.id}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Roles & Permissions Matrix */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Permissions Matrix
            </h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-200 min-w-[220px]">Permission Name</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-4 py-3 text-center capitalize border-r border-slate-200 min-w-[120px]">
                      {r.name.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-4 py-8 text-center text-slate-500">
                      {loading ? "Loading permissions..." : "No permissions found."}
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-800 border-r border-slate-200 text-xs">
                        {p.name}
                      </td>
                      {roles.map((r) => {
                        const hasPerm = r.permissions?.some((rp) => rp.name === p.name);
                        return (
                          <td key={r.id} className="px-4 py-2.5 text-center border-r border-slate-200">
                            {hasPerm ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 inline-block" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create/Edit Role */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-semibold text-lg text-slate-900">
                  {editingRole ? `Edit Role (${editingRole.name})` : "Create New Role"}
                </h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateRole} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Name</label>
                  <Input
                    value={roleFormData.name}
                    onChange={(e) => {
                      setRoleFormData({ ...roleFormData, name: e.target.value });
                      if (roleErrors.name) setRoleErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. auditor"
                    className={roleErrors.name ? "border-red-500" : ""}
                  />
                  {roleErrors.name && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {roleErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Select Permissions</label>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-md p-3 grid grid-cols-2 gap-2 text-xs">
                    {permissions.map((p) => {
                      const checked = roleFormData.permissions.includes(p.name);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRoleFormData({
                                  ...roleFormData,
                                  permissions: [...roleFormData.permissions, p.name]
                                });
                              } else {
                                setRoleFormData({
                                  ...roleFormData,
                                  permissions: roleFormData.permissions.filter((item) => item !== p.name)
                                });
                              }
                            }}
                          />
                          <span className="text-slate-700">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Role</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
