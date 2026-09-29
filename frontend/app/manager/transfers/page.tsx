'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
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
import { facilitiesApi } from '../../../services/facilitiesApi';
import { useAuth } from '../../../lib/auth-context';
import { TransferItem } from '../../../types/transfer';
import { Facility } from '../../../types/facility';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function HospitalManagerTransfersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let targetFacilityId = user?.facilityId;
      if (!targetFacilityId) {
        const allFacilities = await facilitiesApi.getFacilities();
        const bakshi = allFacilities.find((f) => f.name.includes('Bakshi')) || allFacilities[0];
        targetFacilityId = bakshi?.id;
      }

      if (!targetFacilityId) throw new Error('Facility scope missing');

      const [facData, trfData] = await Promise.all([
        facilitiesApi.getFacilityById(targetFacilityId),
        transfersApi.getTransfers(targetFacilityId),
      ]);

      setFacility(facData);
      setTransfers(trfData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to query facility transfers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [user]);

  const handleMarkDelivered = async (transferId: string) => {
    try {
      await transfersApi.updateStatus(transferId, 'DELIVERED', 'Received and verified at clinic');
      showToast({
        title: 'Transfer Accepted & Reconciled',
        message: 'Physical stock added to local facility inventory in PostgreSQL.',
        type: 'success',
      });
      fetchTransfers();
    } catch (err: unknown) {
      showToast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Unable to confirm delivery.',
        type: 'error',
      });
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
                Local Supply Transit
              </Badge>
              <span className="text-xs text-slate-400">{facility?.name || 'Local Facility'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Facility Inbound & Outbound Shipments
            </h1>
            <p className="text-xs text-slate-500">
              Track delivery progress and acknowledge receipt to reconcile local pharmacy inventory
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
            <Link href="/manager/requests">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Request Resource
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && <LoadingState message="Querying hospital logistics pipeline..." />}
        {error && <ErrorState message={error} onRetry={fetchTransfers} />}

        {!isLoading && !error && (
          <div className="space-y-4">
            {transfers.length === 0 ? (
              <EmptyState
                title="Zero transfers active"
                description="No incoming replenishment or outgoing shipments for this facility."
              />
            ) : (
              transfers.map((t) => {
                const isInbound = t.destinationFacilityId === facility?.id;
                return (
                  <Card key={t.id} className="border-slate-200">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            #{t.id.slice(0, 8)}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {t.resource?.name} — {t.quantity} units
                          </h3>
                          <Badge variant={isInbound ? 'info' : 'outline'} className="text-[10px]">
                            {isInbound ? 'INBOUND' : 'OUTBOUND'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {t.priority} PRIORITY
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>
                            {isInbound ? `From: ${t.sourceFacility?.name}` : `To: ${t.destinationFacility?.name}`}
                          </span>
                          <span>•</span>
                          <span>Created {formatDate(t.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold ${
                              t.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : t.status === 'IN_TRANSIT'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {t.eta ? `ETA: ${formatDate(t.eta)}` : 'In Pipeline'}
                          </p>
                        </div>

                        {/* If Inbound and IN_TRANSIT, allow Hospital Manager to mark DELIVERED! */}
                        {isInbound && t.status === 'IN_TRANSIT' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkDelivered(t.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Receipt
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
