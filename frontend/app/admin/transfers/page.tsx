'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Truck,
  PackageCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
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
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { transfersApi } from '../../../services/transfersApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { resourcesApi } from '../../../services/resourcesApi';
import { TransferItem, TransferStatus, TransferPriority } from '../../../types/transfer';
import { Facility } from '../../../types/facility';
import { Resource } from '../../../types/inventory';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

const STATUS_STEPS: TransferStatus[] = ['REQUESTED', 'APPROVED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];

export default function AdminTransfersPage() {
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Create Transfer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    sourceFacilityId: '',
    destinationFacilityId: '',
    resourceId: '',
    quantity: 100,
    priority: 'HIGH' as TransferPriority,
  });

  const fetchTransfers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [transfersData, facsData, resData] = await Promise.all([
        transfersApi.getTransfers(),
        facilitiesApi.getFacilities(),
        resourcesApi.getResources(),
      ]);
      setTransfers(transfersData);
      setFacilities(facsData);
      setResources(resData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query transfer logistics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newTransfer.sourceFacilityId ||
      !newTransfer.destinationFacilityId ||
      !newTransfer.resourceId
    ) {
      showToast({ title: 'Validation Error', message: 'All transfer fields are required.', type: 'warning' });
      return;
    }

    if (newTransfer.sourceFacilityId === newTransfer.destinationFacilityId) {
      showToast({ title: 'Validation Error', message: 'Source and destination facilities must differ.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await transfersApi.createTransfer(newTransfer);
      showToast({
        title: 'Transfer Dispatched',
        message: 'Resource transfer request registered successfully.',
        type: 'success',
      });
      setIsCreateModalOpen(false);
      fetchTransfers();
    } catch (err: unknown) {
      showToast({
        title: 'Dispatch Failed',
        message: err instanceof Error ? err.message : 'Unable to initiate transfer.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (transfer: TransferItem, nextStatus: TransferStatus) => {
    try {
      await transfersApi.updateStatus(transfer.id, nextStatus, `Updated to ${nextStatus} via Command Portal`);
      showToast({
        title: 'Logistics Updated',
        message: `Transfer #${transfer.id.slice(0, 8)} advanced to ${nextStatus}.`,
        type: 'success',
      });
      fetchTransfers();
    } catch (err: unknown) {
      showToast({
        title: 'Status Update Failed',
        message: err instanceof Error ? err.message : 'Invalid state transition.',
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
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [transfers, searchQuery, statusFilter, priorityFilter]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Logistics Orchestration
              </Badge>
              <span className="text-xs text-slate-400">Inventory Reconciliation Active</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Resource Transfer & Logistics Management
            </h1>
            <p className="text-xs text-slate-500">
              Track inter-hospital transfers from request approval through final clinical delivery
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
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Transfer
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
                placeholder="Search by transfer ID, medicine, source, or destination..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="PACKED">Packed</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Fetching transfer registry from PostgreSQL..." />}
        {error && <ErrorState message={error} onRetry={fetchTransfers} />}

        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredTransfers.length === 0 ? (
              <EmptyState
                title="No transfers registered"
                description="Click 'Create Transfer' or review 'Redistribution AI' recommendations."
              />
            ) : (
              filteredTransfers.map((t) => {
                const currentStepIdx = STATUS_STEPS.indexOf(t.status);
                const nextStep =
                  currentStepIdx >= 0 && currentStepIdx < STATUS_STEPS.length - 1
                    ? STATUS_STEPS[currentStepIdx + 1]
                    : null;

                return (
                  <Card key={t.id} className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Transfer Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              #{t.id.slice(0, 8)}
                            </span>
                            <h3 className="font-bold text-slate-900 text-base">
                              {t.resource?.name || 'Resource'} — {t.quantity} units
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
                              {t.priority} PRIORITY
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                            <span className="font-semibold text-slate-800">
                              {t.sourceFacility?.name || 'Central Hub'}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="font-semibold text-slate-800">
                              {t.destinationFacility?.name || 'PHC Centre'}
                            </span>
                            <span className="text-slate-400">• Created: {formatDate(t.createdAt)}</span>
                          </div>
                        </div>

                        {/* Status Button for advancing */}
                        <div className="flex items-center gap-2 shrink-0">
                          {nextStep && (
                            <Button
                              size="sm"
                              onClick={() => handleAdvanceStatus(t, nextStep)}
                              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
                            >
                              Mark as {nextStep.replace('_', ' ')} &rarr;
                            </Button>
                          )}
                          {t.status === 'DELIVERED' && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" /> Delivered & Reconciled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Multi-step Status Timeline Visual */}
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = currentStepIdx >= idx;
                            const isCurrent = currentStepIdx === idx;
                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div
                                  className={`w-full h-1.5 rounded-full mb-2 ${
                                    isCompleted ? 'bg-teal-700' : 'bg-slate-200'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-bold tracking-tight uppercase ${
                                    isCurrent
                                      ? 'text-teal-800'
                                      : isCompleted
                                      ? 'text-slate-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {step.replace('_', ' ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create Transfer Dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Initiate Inter-Facility Resource Transfer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Authorizes stock reallocation from a surplus source to a facility approaching shortage.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="src-fac">Source Facility (Donor)</Label>
                <select
                  id="src-fac"
                  value={newTransfer.sourceFacilityId}
                  onChange={(e) =>
                    setNewTransfer({ ...newTransfer, sourceFacilityId: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="">Select donor facility holding surplus...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dest-fac">Destination Facility (Recipient)</Label>
                <select
                  id="dest-fac"
                  value={newTransfer.destinationFacilityId}
                  onChange={(e) =>
                    setNewTransfer({ ...newTransfer, destinationFacilityId: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="">Select recipient facility with deficit...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="res-item">Medical Resource / Drug</Label>
                <select
                  id="res-item"
                  value={newTransfer.resourceId}
                  onChange={(e) =>
                    setNewTransfer({ ...newTransfer, resourceId: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="">Select medical resource...</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category} • {r.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="qty">Transfer Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={newTransfer.quantity}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, quantity: parseInt(e.target.value, 10) || 1 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="priority">Priority Level</Label>
                  <select
                    id="priority"
                    value={newTransfer.priority}
                    onChange={(e) =>
                      setNewTransfer({ ...newTransfer, priority: e.target.value as TransferPriority })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Dispatch Transfer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppShell>
    </RoleGuard>
  );
}
