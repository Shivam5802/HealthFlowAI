'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Building2,
  Package,
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
import { useAuth } from '../../../lib/auth-context';
import { TransferItem, TransferPriority } from '../../../types/transfer';
import { Facility } from '../../../types/facility';
import { Resource } from '../../../types/inventory';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function HospitalManagerRequestsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<TransferItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [myFacility, setMyFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request Resource Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    sourceFacilityId: '',
    resourceId: '',
    quantity: 50,
    priority: 'HIGH' as TransferPriority,
    reason: '',
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let targetFacilityId = user?.facilityId;
      const allFacilities = await facilitiesApi.getFacilities();

      if (!targetFacilityId) {
        const bakshi = allFacilities.find((f) => f.name.includes('Bakshi')) || allFacilities[0];
        targetFacilityId = bakshi?.id;
      }

      const currentFac = allFacilities.find((f) => f.id === targetFacilityId) || null;
      setMyFacility(currentFac);

      const [trfData, resData, donorSources] = await Promise.all([
        transfersApi.getTransfers(targetFacilityId),
        resourcesApi.getResources(),
        transfersApi.getTransferSources(),
      ]);

      // Only show requests where this facility is the recipient
      setRequests(trfData.filter((t) => t.destinationFacilityId === targetFacilityId));
      setFacilities(donorSources as any);
      setResources(resData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to query resource requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myFacility?.id || !newRequest.sourceFacilityId || !newRequest.resourceId) {
      showToast({ title: 'Validation Error', message: 'All request fields are required.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await transfersApi.createTransfer({
        sourceFacilityId: newRequest.sourceFacilityId,
        destinationFacilityId: myFacility.id,
        resourceId: newRequest.resourceId,
        quantity: newRequest.quantity,
        priority: newRequest.priority,
      });

      showToast({
        title: 'Resource Request Submitted',
        message: 'Your transfer request has been queued for Supply Manager authorization.',
        type: 'success',
      });

      setIsModalOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      showToast({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Unable to submit transfer request.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['HOSPITAL_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Clinical Replenishment
              </Badge>
              <span className="text-xs text-slate-400">{myFacility?.name || 'Local Facility'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Resource Replenishment Requests
            </h1>
            <p className="text-xs text-slate-500">
              Submit emergency supply requests and track logistics dispatch timelines
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
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Request Resource
            </Button>
          </div>
        </div>

        {isLoading && <LoadingState message="Connecting to central logistics registry..." />}
        {error && <ErrorState message={error} onRetry={fetchRequests} />}

        {!isLoading && !error && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <EmptyState
                title="No active resource requests"
                description="Click 'Request Resource' to request replenishment from regional central hubs."
              />
            ) : (
              requests.map((req) => (
                <Card key={req.id} className="border-slate-200">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          REQ #{req.id.slice(0, 8)}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {req.resource?.name || 'Resource'} — {req.quantity} units
                        </h3>
                        <Badge
                          variant={
                            req.priority === 'CRITICAL'
                              ? 'critical'
                              : req.priority === 'HIGH'
                              ? 'warning'
                              : 'info'
                          }
                          className="text-[10px]"
                        >
                          {req.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Donor Hub: {req.sourceFacility?.name || 'Regional Supply'}</span>
                        <span>•</span>
                        <span>Requested on {formatDate(req.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold ${
                          req.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : req.status === 'IN_TRANSIT'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {req.eta ? `ETA: ${formatDate(req.eta)}` : 'Awaiting dispatch confirmation'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Request Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Submit Hospital Resource Request
              </DialogTitle>
              <DialogDescription className="text-xs">
                Request inventory transfer to {myFacility?.name || 'Assigned Facility'}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="req-donor">Source Supply Center (Donor)</Label>
                <select
                  id="req-donor"
                  value={newRequest.sourceFacilityId}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, sourceFacilityId: e.target.value })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="">Select donor hospital or warehouse...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="req-res">Resource / Drug</Label>
                <select
                  id="req-res"
                  value={newRequest.resourceId}
                  onChange={(e) => setNewRequest({ ...newRequest, resourceId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="">Select medicine or medical supply...</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="req-qty">Required Units</Label>
                  <Input
                    id="req-qty"
                    type="number"
                    min="1"
                    value={newRequest.quantity}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, quantity: parseInt(e.target.value, 10) || 1 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="req-pri">Urgency</Label>
                  <select
                    id="req-pri"
                    value={newRequest.priority}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, priority: e.target.value as TransferPriority })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (&lt;24 hrs)</option>
                    <option value="HIGH">HIGH (&lt;48 hrs)</option>
                    <option value="MEDIUM">MEDIUM (Standard)</option>
                    <option value="LOW">LOW (Planned Buffer)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="req-reason">Clinical Justification</Label>
                <Input
                  id="req-reason"
                  placeholder="e.g. Surge in respiratory patient admissions"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                />
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Transmitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppShell>
    </RoleGuard>
  );
}
