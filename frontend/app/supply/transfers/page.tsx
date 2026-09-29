'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  Filter,
  PackageCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  ArrowLeftRight,
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

export default function SupplyTransfersPage() {
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTransfers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transfersApi.getTransfers();
      setTransfers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query logistics transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleUpdateStatus = async (
    transfer: TransferItem,
    nextStatus: TransferStatus,
    noteMsg: string
  ) => {
    try {
      await transfersApi.updateStatus(transfer.id, nextStatus, noteMsg);
      showToast({
        title: 'Status Transition Successful',
        message: `Transfer #${transfer.id.slice(0, 8)} transitioned to ${nextStatus}.`,
        type: 'success',
      });
      fetchTransfers();
    } catch (err: unknown) {
      showToast({
        title: 'Transition Failed',
        message: err instanceof Error ? err.message : 'Invalid state transition for transfer.',
        type: 'error',
      });
    }
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.resource?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.sourceFacility?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.destinationFacility?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchQuery, statusFilter]);

  return (
    <RoleGuard allowedRoles={['SUPPLY_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Logistics Dispatch Console
              </Badge>
              <span className="text-xs text-slate-400">FSM State Machine Validated</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Transfer Operations & Dispatch Management
            </h1>
            <p className="text-xs text-slate-500">
              Manage transfer state machine: REQUESTED &rarr; APPROVED &rarr; PACKED &rarr; IN TRANSIT &rarr; DELIVERED
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransfers}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by transfer ID, medicine, source, or destination..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">REQUESTED (Needs Approval)</option>
              <option value="APPROVED">APPROVED (Ready to Pack)</option>
              <option value="PACKED">PACKED (Ready to Dispatch)</option>
              <option value="IN_TRANSIT">IN TRANSIT (On Route)</option>
              <option value="DELIVERED">DELIVERED (Completed)</option>
            </select>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Connecting to PostgreSQL transfer ledger..." />}
        {error && <ErrorState message={error} onRetry={fetchTransfers} />}

        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredTransfers.length === 0 ? (
              <EmptyState
                title="No transfers matching filter"
                description="Zero transfers currently match the selected query."
              />
            ) : (
              filteredTransfers.map((t) => (
                <Card key={t.id} className="border-slate-200">
                  <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          #{t.id.slice(0, 8)}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {t.resource?.name || 'Supply'} — {t.quantity} units
                        </h3>
                        <Badge
                          variant={
                            t.priority === 'CRITICAL'
                              ? 'critical'
                              : t.priority === 'HIGH'
                              ? 'warning'
                              : 'info'
                          }
                          className="text-[10px]"
                        >
                          {t.priority}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {t.sourceFacility?.name || 'Central Hub'}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {t.destinationFacility?.name || 'PHC Centre'}
                        </span>
                        <span className="text-slate-400">• Created: {formatDate(t.createdAt)}</span>
                      </div>
                    </div>

                    {/* Operational Action Buttons by State */}
                    <div className="flex items-center gap-2 shrink-0">
                      {t.status === 'REQUESTED' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(t, 'APPROVED', 'Approved by Supply Manager for dispatch')
                          }
                          className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
                        >
                          Approve Transfer &rarr;
                        </Button>
                      )}

                      {t.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(t, 'PACKED', 'Packed and sealed in medical logistics crates')
                          }
                          className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl"
                        >
                          Pack Crate &rarr;
                        </Button>
                      )}

                      {t.status === 'PACKED' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(t, 'IN_TRANSIT', 'Loaded on regional delivery vehicle')
                          }
                          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl"
                        >
                          Mark In Transit &rarr;
                        </Button>
                      )}

                      {t.status === 'IN_TRANSIT' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(t, 'DELIVERED', 'Delivered and verified at destination facility')
                          }
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl"
                        >
                          Mark Delivered &rarr;
                        </Button>
                      )}

                      {t.status === 'DELIVERED' && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Delivered & Reconciled
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
