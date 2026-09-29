'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { transfersApi } from '../../../services/transfersApi';
import { TransferItem, TransferStatus } from '../../../types/transfer';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function SupplyRequestsPage() {
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transfersApi.getTransfers();
      setTransfers(data.filter((t) => t.status === 'REQUESTED'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query incoming resource requisitions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (transfer: TransferItem) => {
    try {
      await transfersApi.updateStatus(transfer.id, 'APPROVED', 'Requisition authorized by Supply Manager');
      showToast({
        title: 'Requisition Approved',
        message: `Transfer #${transfer.id.slice(0, 8)} approved for logistics preparation.`,
        type: 'success',
      });
      fetchRequests();
    } catch (err: unknown) {
      showToast({
        title: 'Approval Failed',
        message: err instanceof Error ? err.message : 'Unable to approve transfer request.',
        type: 'error',
      });
    }
  };

  const handleReject = async (transfer: TransferItem) => {
    try {
      await transfersApi.updateStatus(transfer.id, 'CANCELLED', 'Requisition declined by Supply Manager');
      showToast({
        title: 'Requisition Declined',
        message: `Transfer #${transfer.id.slice(0, 8)} has been cancelled.`,
        type: 'info',
      });
      fetchRequests();
    } catch (err: unknown) {
      showToast({
        title: 'Rejection Failed',
        message: err instanceof Error ? err.message : 'Unable to cancel transfer request.',
        type: 'error',
      });
    }
  };

  const filteredRequests = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.resource?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.sourceFacility?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.destinationFacility?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [transfers, searchQuery, priorityFilter]);

  return (
    <RoleGuard allowedRoles={['SUPPLY_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Logistics Clearance
              </Badge>
              <span className="text-xs text-slate-400">Incoming Requisitions</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Resource Replenishment Requests
            </h1>
            <p className="text-xs text-slate-500">
              Review, prioritize, and authorize clinical supply requisitions submitted by hospital managers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRequests}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/supply/transfers">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl">
                Active Operations Center &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, medicine, or clinic..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Querying incoming replenishment requests..." />}
        {error && <ErrorState message={error} onRetry={fetchRequests} />}

        {!isLoading && !error && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredRequests.length === 0 ? (
                <EmptyState
                  title="No Pending Requisitions"
                  description="There are currently zero transfer requests awaiting supply authorization."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Request</th>
                        <th className="py-3 px-4">Resource</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4">Source Facility</th>
                        <th className="py-3 px-4">Destination Facility</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">ETA</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            #{t.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {t.resource?.name || 'Resource'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {t.quantity} {t.resource?.unit || 'units'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {t.sourceFacility?.name || 'Central Donor'}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {t.destinationFacility?.name || 'Recipient Clinic'}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                t.priority === 'CRITICAL'
                                  ? 'critical'
                                  : t.priority === 'HIGH'
                                  ? 'warning'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {t.priority}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200">
                              REQUESTED
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {t.eta ? formatDate(t.eta) : 'TBD upon approval'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(t)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-7 rounded-lg"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(t)}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7 rounded-lg"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppShell>
    </RoleGuard>
  );
}
