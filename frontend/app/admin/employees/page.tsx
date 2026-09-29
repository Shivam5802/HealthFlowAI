'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  UserX,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { ConfirmationModal } from '../../../components/ui/confirmation-modal';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { usersApi } from '../../../services/usersApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { User, UserRole, UserStatus } from '../../../types/auth';
import { Facility } from '../../../types/facility';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function AdminEmployeesPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Employee Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'HOSPITAL_MANAGER' as UserRole,
    facilityId: '',
  });

  // Success Modal with Temporary Credentials
  const [provisionedCredentials, setProvisionedCredentials] = useState<{
    employeeId: string;
    temporaryPassword?: string;
    name: string;
  } | null>(null);

  // Deactivate status confirmation modal
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Copy state helpers
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, facsData] = await Promise.all([
        usersApi.getUsers(),
        facilitiesApi.getFacilities(),
      ]);
      setUsers(usersData);
      setFacilities(facsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query employee directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) {
      showToast({ title: 'Validation Error', message: 'Name and email are required.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await usersApi.createEmployee({
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        facilityId: newEmployee.facilityId || undefined,
      });

      // Display one-time credential modal
      setProvisionedCredentials({
        employeeId: result.user.employeeId,
        temporaryPassword: result.temporaryPassword || 'HF-InitialPass#2026',
        name: result.user.name,
      });

      showToast({
        title: 'Account Provisioned',
        message: `Employee ${result.user.name} created with ID ${result.user.employeeId}.`,
        type: 'success',
      });

      setIsCreateOpen(false);
      setNewEmployee({
        name: '',
        email: '',
        role: 'HOSPITAL_MANAGER',
        facilityId: '',
      });
      fetchUsers();
    } catch (err: unknown) {
      showToast({
        title: 'Provisioning Failed',
        message: err instanceof Error ? err.message : 'Unable to create user account.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    const newStatus: UserStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await usersApi.updateUserStatus(statusTarget.id, newStatus);
      showToast({
        title: 'Status Updated',
        message: `${statusTarget.name} has been set to ${newStatus}.`,
        type: 'success',
      });
      setStatusTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      showToast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Unable to change user status.',
        type: 'error',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
    showToast({ title: 'Copied to Clipboard', type: 'info' });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Workforce & RBAC
              </Badge>
              <span className="text-xs text-slate-400">Audited Clinical Access</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Healthcare Employee Directory
            </h1>
            <p className="text-xs text-slate-500">
              Manage clinical personnel, system administrators, and supply coordinators with strict facility isolation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
            >
              <UserPlus className="h-4 w-4 mr-1.5" /> Provision Employee
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by employee name, ID (e.g. HF-EMP-1001), or email..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HOSPITAL_MANAGER">HOSPITAL MANAGER</option>
                <option value="SUPPLY_MANAGER">SUPPLY MANAGER</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Connecting to PostgreSQL RBAC directory..." />}
        {error && <ErrorState message={error} onRetry={fetchUsers} />}

        {!isLoading && !error && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <EmptyState
                  title="No employees found"
                  description="Adjust search parameters or provision a new clinical profile."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Name & Email</th>
                        <th className="py-3 px-4">Role Clearance</th>
                        <th className="py-3 px-4">Assigned Facility</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const assignedFac = facilities.find((f) => f.id === u.facilityId);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-teal-800">
                              {u.employeeId}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 leading-tight">{u.name}</p>
                              <p className="text-[11px] text-slate-500">{u.email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  u.role === 'ADMIN'
                                    ? 'default'
                                    : u.role === 'HOSPITAL_MANAGER'
                                    ? 'outline'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {assignedFac ? (
                                <span className="font-medium text-slate-700 flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-slate-400" />
                                  {assignedFac.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Network-Wide Scope</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={u.status === 'ACTIVE' ? 'healthy' : 'warning'}
                                className="text-[10px]"
                              >
                                {u.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStatusTarget(u)}
                                className="h-7 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
                              >
                                {u.status === 'ACTIVE' ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 mr-1 text-rose-600" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Activate
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Provision Employee Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Provision Healthcare Employee
              </DialogTitle>
              <DialogDescription className="text-xs">
                Creates a verified login identity in PostgreSQL with role-based permissions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input
                  id="emp-name"
                  placeholder="e.g. Dr. Ramesh Sharma"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-email">Email Address</Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="r.sharma@healthflow.gov.in"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-role">Access Role</Label>
                <select
                  id="emp-role"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value as UserRole })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="HOSPITAL_MANAGER">HOSPITAL MANAGER (Facility Isolated)</option>
                  <option value="SUPPLY_MANAGER">SUPPLY MANAGER (Logistics Scope)</option>
                  <option value="ADMIN">ADMIN (Full Global Command)</option>
                </select>
              </div>

              {newEmployee.role === 'HOSPITAL_MANAGER' && (
                <div className="space-y-1">
                  <Label htmlFor="emp-fac">Assigned Healthcare Facility</Label>
                  <select
                    id="emp-fac"
                    value={newEmployee.facilityId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, facilityId: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    required
                  >
                    <option value="">Select facility assignment...</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Provisioning...' : 'Generate Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Temporary Credentials Display Dialog (Prompt 20 - shown only once!) */}
        {provisionedCredentials && (
          <Dialog open={Boolean(provisionedCredentials)} onOpenChange={() => setProvisionedCredentials(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                  <Shield className="h-6 w-6" />
                </div>
                <DialogTitle className="text-lg font-bold text-center text-slate-900">
                  Account Provisioned Successfully
                </DialogTitle>
                <DialogDescription className="text-xs text-center text-slate-600">
                  Important: This temporary password is only displayed once and is not stored in plain text.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 my-3">
                {/* Employee ID */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Employee ID</p>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {provisionedCredentials.employeeId}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(provisionedCredentials.employeeId, 'id')}
                    className="h-8 text-xs"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="ml-1">{copiedId ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>

                {/* Temporary Password */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-teal-800">Temporary Password</p>
                    <p className="font-mono text-sm font-bold text-teal-950">
                      {provisionedCredentials.temporaryPassword}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(provisionedCredentials.temporaryPassword || '', 'pass')
                    }
                    className="h-8 text-xs border-teal-300 text-teal-900 hover:bg-teal-100"
                  >
                    {copiedPass ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="ml-1">{copiedPass ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                  onClick={() => setProvisionedCredentials(null)}
                >
                  I Have Secured These Credentials
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Deactivation / Activation Confirmation */}
        {statusTarget && (
          <ConfirmationModal
            isOpen={Boolean(statusTarget)}
            onClose={() => setStatusTarget(null)}
            onConfirm={handleToggleStatus}
            title={`${statusTarget.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'} Account`}
            description={`Are you sure you want to ${
              statusTarget.status === 'ACTIVE' ? 'deactivate' : 'reactivate'
            } the account for ${statusTarget.name} (${statusTarget.employeeId})?`}
            confirmText={statusTarget.status === 'ACTIVE' ? 'Deactivate Account' : 'Reactivate Account'}
            variant={statusTarget.status === 'ACTIVE' ? 'danger' : 'primary'}
            isLoading={isUpdatingStatus}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}
