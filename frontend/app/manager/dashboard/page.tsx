'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Package,
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  TrendingDown,
  ShieldCheck,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { inventoryApi } from '../../../services/inventoryApi';
import { patientApi } from '../../../services/patientApi';
import { predictionsApi } from '../../../services/predictionsApi';
import { alertsApi } from '../../../services/alertsApi';
import { transfersApi } from '../../../services/transfersApi';
import { useAuth } from '../../../lib/auth-context';
import { Facility } from '../../../types/facility';
import { InventoryItem } from '../../../types/inventory';
import { PatientDemandRecord } from '../../../types/patient';
import { PredictionItem } from '../../../types/prediction';
import { AlertItem } from '../../../types/alert';
import { TransferItem } from '../../../types/transfer';
import { formatNumber, formatDate } from '../../../lib/utils';

export default function HospitalManagerDashboardPage() {
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [demands, setDemands] = useState<PatientDemandRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilityData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Hospital manager has assigned facility in user profile or we query user's facility
      let targetFacilityId = user?.facilityId;

      if (!targetFacilityId) {
        // Fallback: search for PHC Bakshi Ka Talab if demo user
        const allFacilities = await facilitiesApi.getFacilities();
        const bakshi = allFacilities.find((f) => f.name.includes('Bakshi')) || allFacilities[0];
        targetFacilityId = bakshi?.id;
      }

      if (!targetFacilityId) {
        throw new Error('No assigned healthcare facility found for your credentials.');
      }

      const [facData, invData, demData, predData, alertData, trfData] = await Promise.all([
        facilitiesApi.getFacilityById(targetFacilityId),
        inventoryApi.getInventory(targetFacilityId),
        patientApi.getDemand(targetFacilityId),
        predictionsApi.getPredictions(targetFacilityId),
        alertsApi.getAlerts({ facilityId: targetFacilityId }),
        transfersApi.getTransfers(targetFacilityId),
      ]);

      setFacility(facData);
      setInventory(invData);
      setDemands(demData);
      setPredictions(predData);
      setAlerts(alertData);
      setTransfers(trfData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize hospital scope data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityData();
  }, [user]);

  // High risk items count
  const highRiskCount = React.useMemo(() => {
    return inventory.filter((i) => i.dailyConsumption > 0 && i.quantity / i.dailyConsumption <= 5).length;
  }, [inventory]);

  const demandChartData = React.useMemo(() => {
    return demands.slice(-14).map((d) => ({
      date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      admissions: d.patientCount,
      critical: d.criticalCases,
    }));
  }, [demands]);

  // Days remaining minimum
  const minDaysRemaining = React.useMemo(() => {
    const valid = inventory
      .filter((i) => i.dailyConsumption > 0)
      .map((i) => i.quantity / i.dailyConsumption);
    if (valid.length === 0) return null;
    return Math.min(...valid);
  }, [inventory]);

  const pendingRequestsCount = React.useMemo(() => {
    return transfers.filter((t) => t.status === 'REQUESTED').length;
  }, [transfers]);

  const activeTransfersCount = React.useMemo(() => {
    return transfers.filter(
      (t) => t.status === 'APPROVED' || t.status === 'PACKED' || t.status === 'IN_TRANSIT'
    ).length;
  }, [transfers]);

  const predictedDemandTotal = React.useMemo(() => {
    if (predictions.length === 0) return null;
    const sum = predictions.reduce((acc, p) => acc + (p.predictedDailyDemand || 0), 0);
    return Math.round(sum / predictions.length);
  }, [predictions]);

  return (
    <RoleGuard allowedRoles={['HOSPITAL_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Hospital Scope Isolation
              </Badge>
              <span className="text-xs text-slate-400">Assigned Facility Surveillance</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {facility?.name || 'Local Facility Command'}
            </h1>
            <p className="text-xs text-slate-500">
              {facility?.address}, {facility?.district} • Classification: {facility?.type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFacilityData}
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

        {isLoading && <LoadingState message="Connecting to facility live inventory and intake feeds..." />}
        {error && <ErrorState message={error} onRetry={fetchFacilityData} />}

        {!isLoading && !error && facility && (
          <div className="space-y-6">
            {/* 8 Operational KPI Cards (Strictly Scoped to Assigned Facility) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
              {/* 1. My Facility */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    My Facility
                  </span>
                  <CardTitle className="text-base font-black text-slate-900 mt-1 truncate">
                    {facility.name}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    {facility.status} &bull; {facility.type}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 2. Available Resources */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Available Resources
                  </span>
                  <CardTitle className="text-xl font-black text-slate-900 mt-1">
                    {inventory.length} Items
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Active physical stock ledger
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 3. Days Remaining */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Days Remaining
                  </span>
                  <CardTitle className={`text-xl font-black mt-1 ${minDaysRemaining !== null && minDaysRemaining <= 3 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {minDaysRemaining !== null ? `~${minDaysRemaining.toFixed(1)} days` : 'Adequate'}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Shortest stockout horizon
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 4. High-Risk Resources */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    High-Risk Resources
                  </span>
                  <CardTitle className="text-xl font-black text-rose-600 mt-1">
                    {highRiskCount} Items
                  </CardTitle>
                  <CardDescription className="text-[10px] text-rose-500 font-medium mt-0.5">
                    &le; 5 days supply buffer
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 5. Open Alerts */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Open Alerts
                  </span>
                  <CardTitle className="text-xl font-black text-amber-600 mt-1">
                    {alerts.filter((a) => a.status === 'OPEN').length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Local operational flags
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 6. Pending Requests */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Pending Requests
                  </span>
                  <CardTitle className="text-xl font-black text-slate-800 mt-1">
                    {pendingRequestsCount}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Submitted requisitions
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 7. Active Transfers */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Transfers
                  </span>
                  <CardTitle className="text-xl font-black text-teal-800 mt-1">
                    {activeTransfersCount}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-teal-700 mt-0.5">
                    Inbound shipments
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 8. Predicted Demand */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Predicted Demand
                  </span>
                  <CardTitle className="text-xl font-black text-slate-900 mt-1">
                    {predictedDemandTotal !== null ? `~${predictedDemandTotal}/day` : 'Nominal'}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Forecasted consumption rate
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Middle: Patient Admissions vs Inventory Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admissions Trend */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Patient Intake & Surge Trajectory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    14-day recorded admissions for {facility.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={demandChartData}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line
                          type="monotone"
                          dataKey="admissions"
                          name="Daily Admissions"
                          stroke="#0f766e"
                          strokeWidth={2.5}
                        />
                        <Line
                          type="monotone"
                          dataKey="critical"
                          name="Critical Care"
                          stroke="#e11d48"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Velocity Feed */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Local Stock Velocity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Items requiring replenishment or transfer requests
                    </CardDescription>
                  </div>
                  <Link href="/manager/inventory">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                      Manage Stock &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inventory.slice(0, 5).map((item) => {
                      const days =
                        item.dailyConsumption > 0
                          ? Math.round(item.quantity / item.dailyConsumption)
                          : 999;
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{item.resource?.name || 'Drug'}</p>
                            <p className="text-[11px] text-slate-500">
                              Stock: {formatNumber(item.quantity)} units • Burn: {item.dailyConsumption}/day
                            </p>
                          </div>
                          <Badge
                            variant={days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'healthy'}
                            className="text-[10px]"
                          >
                            {days > 365 ? 'Stable' : `~${days}d buffer`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Local Inbound Transfers & Active Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Facility Inbound / Outbound Transfers */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Facility Transfers
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Incoming replenishment & outgoing shipments
                    </CardDescription>
                  </div>
                  <Link href="/manager/transfers">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                      View All &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {transfers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No active transfers logged for this facility.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {transfers.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {t.resource?.name} ({t.quantity} units)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {t.destinationFacilityId === facility.id ? 'Inbound from: ' : 'Outbound to: '}
                              {t.sourceFacility?.name || t.destinationFacility?.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-bold text-[10px]">
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Local Facility Alerts */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Facility Alerts
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Active operational flags requiring hospital response
                    </CardDescription>
                  </div>
                  <Link href="/manager/alerts">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                      Alert Center &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Zero active alerts. Facility thresholds operating within safe bounds.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {alerts.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              className={`h-4 w-4 shrink-0 mt-0.5 ${
                                a.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                              }`}
                            />
                            <div>
                              <p className="font-bold text-slate-900">{a.title}</p>
                              <p className="text-slate-500 text-[11px]">{a.message}</p>
                            </div>
                          </div>
                          <Badge
                            variant={a.severity === 'CRITICAL' ? 'critical' : 'warning'}
                            className="text-[9px]"
                          >
                            {a.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
