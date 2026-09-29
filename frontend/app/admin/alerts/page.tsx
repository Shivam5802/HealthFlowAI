'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Check,
  Building2,
  ShieldCheck,
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
import { AlertItem, AlertSeverity, AlertStatus } from '../../../types/alert';
import { Facility } from '../../../types/facility';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function AdminAlertsPage() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [facilityFilter, setFacilityFilter] = useState('ALL');

  // Confirmation Modal state
  const [resolveTarget, setResolveTarget] = useState<AlertItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [alertsData, facsData] = await Promise.all([
        alertsApi.getAlerts(),
        facilitiesApi.getFacilities(),
      ]);
      setAlerts(alertsData);
      setFacilities(facsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve active alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.facility?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchesFacility = facilityFilter === 'ALL' || a.facilityId === facilityFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesFacility;
    });
  }, [alerts, searchQuery, severityFilter, statusFilter, facilityFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledgeAlert(id);
      showToast({
        title: 'Alert Acknowledged',
        message: 'The operational warning has been noted by administrative staff.',
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
      await alertsApi.resolveAlert(resolveTarget.id, 'Resolved by Administrator via Alert Command Center');
      showToast({
        title: 'Alert Resolved',
        message: `Alert "${resolveTarget.title}" marked as resolved.`,
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
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 text-xs">
                Clinical Operations Watch
              </Badge>
              <span className="text-xs text-slate-400">PostgreSQL Notification Feed</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Operational Alert Management Center
            </h1>
            <p className="text-xs text-slate-500">
              Review, acknowledge, and resolve inventory deficits, surge flags, and supply disruptions
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

        {/* Filter Toolbar */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts by title, facility, or clinical reason..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-semibold"
              >
                <option value="OPEN">Status: Open</option>
                <option value="ACKNOWLEDGED">Status: Acknowledged</option>
                <option value="RESOLVED">Status: Resolved</option>
                <option value="ALL">Status: All</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>

              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Facilities</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Querying live alert ledger from PostgreSQL..." />}
        {error && <ErrorState message={error} onRetry={fetchAlerts} />}

        {!isLoading && !error && (
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <EmptyState
                title="No alerts match criteria"
                description="Zero active clinical warnings found for the selected filters."
              />
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <Card
                    key={alert.id}
                    className={`border transition-all ${
                      isCritical && alert.status !== 'RESOLVED'
                        ? 'border-rose-300 bg-rose-50/20 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isCritical
                              ? 'bg-rose-100 text-rose-600'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{alert.title}</h3>
                            <Badge
                              variant={
                                isCritical
                                  ? 'critical'
                                  : alert.severity === 'WARNING'
                                  ? 'warning'
                                  : 'info'
                              }
                              className="text-[10px]"
                            >
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {alert.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {alert.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <Building2 className="h-3 w-3" />
                              {alert.facility?.name || 'Facility'} ({alert.facility?.district || 'District'})
                            </span>
                            <span>•</span>
                            <span>Triggered: {formatDate(alert.createdAt)}</span>
                            <span>•</span>
                            <span>Type: {alert.type}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {alert.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
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
                            <Check className="h-3.5 w-3.5 mr-1" /> Resolve Alert
                          </Button>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Confirmation Modal for Resolving Alert */}
        {resolveTarget && (
          <ConfirmationModal
            isOpen={Boolean(resolveTarget)}
            onClose={() => setResolveTarget(null)}
            onConfirm={handleConfirmResolve}
            title="Resolve Operational Alert"
            description={`Are you sure you want to mark "${resolveTarget.title}" as resolved? This will archive the active warning in the system audit trail.`}
            confirmText="Resolve Alert"
            variant="primary"
            isLoading={isProcessing}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}
