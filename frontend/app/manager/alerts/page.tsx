'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ConfirmationModal } from '../../../components/ui/confirmation-modal';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { alertsApi } from '../../../services/alertsApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { useAuth } from '../../../lib/auth-context';
import { AlertItem } from '../../../types/alert';
import { Facility } from '../../../types/facility';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function HospitalManagerAlertsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<AlertItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAlerts = async () => {
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

      const [facData, alertData] = await Promise.all([
        facilitiesApi.getFacilityById(targetFacilityId),
        alertsApi.getAlerts({ facilityId: targetFacilityId }),
      ]);

      setFacility(facData);
      setAlerts(alertData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to query facility alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledgeAlert(id);
      showToast({
        title: 'Alert Acknowledged',
        message: 'Clinical staff has noted this operational flag.',
        type: 'info',
      });
      fetchAlerts();
    } catch (err: unknown) {
      showToast({
        title: 'Action Failed',
        message: err instanceof Error ? err.message : 'Unable to acknowledge alert.',
        type: 'error',
      });
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolveTarget) return;
    setIsProcessing(true);
    try {
      await alertsApi.resolveAlert(
        resolveTarget.id,
        'Resolved by Hospital Manager following on-site inventory reconciliation'
      );
      showToast({
        title: 'Alert Resolved',
        message: `Alert "${resolveTarget.title}" closed successfully.`,
        type: 'success',
      });
      setResolveTarget(null);
      fetchAlerts();
    } catch (err: unknown) {
      showToast({
        title: 'Resolution Failed',
        message: err instanceof Error ? err.message : 'Unable to resolve alert.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['HOSPITAL_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 text-xs">
                Facility Alert Feed
              </Badge>
              <span className="text-xs text-slate-400">{facility?.name || 'Local Facility'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Facility Operational Alerts
            </h1>
            <p className="text-xs text-slate-500">
              Surveillance warnings restricted strictly to your assigned healthcare center
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && <LoadingState message="Polling live facility alert ledger..." />}
        {error && <ErrorState message={error} onRetry={fetchAlerts} />}

        {!isLoading && !error && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <EmptyState
                title="Zero active alerts"
                description="No operational or clinical flags registered for your facility."
              />
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className="border-slate-200">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{alert.title}</h3>
                          <Badge
                            variant={alert.severity === 'CRITICAL' ? 'critical' : 'warning'}
                            className="text-[10px]"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Triggered on {formatDate(alert.createdAt)} • Type: {alert.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alert.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="h-8 text-xs text-slate-700"
                        >
                          <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" /> Acknowledge
                        </Button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <Button
                          size="sm"
                          onClick={() => setResolveTarget(alert)}
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Resolve
                        </Button>
                      )}
                      {alert.status === 'RESOLVED' && (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {resolveTarget && (
          <ConfirmationModal
            isOpen={Boolean(resolveTarget)}
            onClose={() => setResolveTarget(null)}
            onConfirm={handleConfirmResolve}
            title="Resolve Facility Alert"
            description={`Mark "${resolveTarget.title}" as resolved for ${facility?.name || 'this facility'}?`}
            confirmText="Resolve Alert"
            variant="primary"
            isLoading={isProcessing}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}
