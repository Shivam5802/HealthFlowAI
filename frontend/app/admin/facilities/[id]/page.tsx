'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Package,
  Activity,
  Sparkles,
  AlertTriangle,
  ArrowLeftRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Clock,
  Calendar,
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
import { AppShell } from '../../../../components/layout/app-shell';
import { RoleGuard } from '../../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { LoadingState } from '../../../../components/feedback/loading-state';
import { ErrorState } from '../../../../components/feedback/error-state';
import { EmptyState } from '../../../../components/feedback/empty-state';
import { facilitiesApi } from '../../../../services/facilitiesApi';
import { inventoryApi } from '../../../../services/inventoryApi';
import { patientApi } from '../../../../services/patientApi';
import { predictionsApi } from '../../../../services/predictionsApi';
import { alertsApi } from '../../../../services/alertsApi';
import { transfersApi } from '../../../../services/transfersApi';
import { Facility } from '../../../../types/facility';
import { InventoryItem } from '../../../../types/inventory';
import { PatientDemandRecord } from '../../../../types/patient';
import { PredictionItem } from '../../../../types/prediction';
import { AlertItem } from '../../../../types/alert';
import { TransferItem } from '../../../../types/transfer';
import { formatNumber, formatDate } from '../../../../lib/utils';

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'demand' | 'predictions' | 'alerts' | 'transfers'>('overview');
  const [facility, setFacility] = useState<Facility | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [demands, setDemands] = useState<PatientDemandRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilityData = async () => {
    if (!facilityId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [fac, inv, dem, pred, alr, trf] = await Promise.all([
        facilitiesApi.getFacilityById(facilityId),
        inventoryApi.getInventory(facilityId).catch(() => []),
        patientApi.getDemand(facilityId).catch(() => []),
        predictionsApi.getPredictions(facilityId).catch(() => []),
        alertsApi.getAlerts({ facilityId }).catch(() => []),
        transfersApi.getTransfers(facilityId).catch(() => []),
      ]);

      setFacility(fac);
      setInventory(inv);
      setDemands(dem);
      setPredictions(pred);
      setAlerts(alr);
      setTransfers(trf);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load facility profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityData();
  }, [facilityId]);

  // Overall facility risk level calculation
  const overallRisk = React.useMemo(() => {
    if (predictions.some((p) => p.riskLevel === 'CRITICAL')) return 'CRITICAL';
    if (alerts.some((a) => a.severity === 'CRITICAL' && a.status === 'OPEN')) return 'CRITICAL';
    if (predictions.some((p) => p.riskLevel === 'HIGH')) return 'HIGH';
    if (inventory.some((i) => i.dailyConsumption > 0 && i.quantity / i.dailyConsumption < 4)) return 'HIGH';
    return 'HEALTHY';
  }, [predictions, alerts, inventory]);

  const chartData = React.useMemo(() => {
    return demands.slice(-30).map((d) => ({
      date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      admissions: d.patientCount,
      critical: d.criticalCases,
    }));
  }, [demands]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Top Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
          <Link href="/admin/facilities" className="hover:text-teal-700 flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Facilities Network
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{facility?.name || 'Facility Overview'}</span>
        </div>

        {isLoading && <LoadingState message="Connecting to facility live telemetry..." />}
        {error && <ErrorState message={error} onRetry={fetchFacilityData} />}

        {!isLoading && !error && facility && (
          <div className="space-y-6">
            {/* Facility Header Card */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                      {facility.type === 'HOSPITAL' ? 'H' : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{facility.name}</h1>
                        <Badge
                          variant={
                            overallRisk === 'CRITICAL'
                              ? 'critical'
                              : overallRisk === 'HIGH'
                              ? 'warning'
                              : 'healthy'
                          }
                          className="text-xs"
                        >
                          {overallRisk} RISK
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {facility.address}, {facility.district}, {facility.state} • Coordinates: {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchFacilityData}
                      className="text-xs text-slate-600"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Sync Live
                    </Button>
                    <Link href="/admin/recommendations">
                      <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs">
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-300" /> Reallocate Stock
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Tabs bar */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview', icon: Building2 },
                    { id: 'inventory', label: `Inventory (${inventory.length})`, icon: Package },
                    { id: 'demand', label: 'Patient Demand', icon: Activity },
                    { id: 'predictions', label: `Predictions (${predictions.length})`, icon: Sparkles },
                    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: AlertTriangle },
                    { id: 'transfers', label: `Transfers (${transfers.length})`, icon: ArrowLeftRight },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                          isActive
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700">Inventory Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Monitored Items</span>
                      <span className="font-bold text-slate-800">{inventory.length}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Low Stock Lines (&lt;5d)</span>
                      <span className="font-bold text-rose-600">
                        {inventory.filter((i) => i.dailyConsumption > 0 && i.quantity / i.dailyConsumption < 5).length}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Operational Surplus</span>
                      <span className="font-bold text-emerald-600">
                        {inventory.filter((i) => i.quantity > i.safetyStock * 2).length} items
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700">Clinical Burden</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">30-Day Avg Inflow</span>
                      <span className="font-bold text-slate-800">
                        {demands.length
                          ? Math.round(demands.reduce((acc, d) => acc + d.patientCount, 0) / demands.length)
                          : 0}{' '}
                        pts/day
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Recent Critical Load</span>
                      <span className="font-bold text-rose-600">
                        {demands.length ? demands[demands.length - 1]?.criticalCases : 0} severe cases
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Bed Occupancy Rate</span>
                      <span className="font-bold text-teal-700">
                        {demands.length ? `${Math.round(demands[demands.length - 1]?.bedOccupancyRate || 82)}%` : '85%'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-700">Active Surveillance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Open Alerts</span>
                      <span className="font-bold text-amber-600">{alerts.filter((a) => a.status === 'OPEN').length}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Scheduled Inbound</span>
                      <span className="font-bold text-blue-600">
                        {transfers.filter((t) => t.destinationFacilityId === facilityId && t.status !== 'DELIVERED').length} shipments
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Outbound Reallocations</span>
                      <span className="font-bold text-slate-800">
                        {transfers.filter((t) => t.sourceFacilityId === facilityId).length} completed
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: INVENTORY */}
            {activeTab === 'inventory' && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Current Stock Levels</CardTitle>
                  <CardDescription className="text-xs">Live quantity on hand, daily consumption rate, and safety buffer</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-3 px-4">Resource</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Available Quantity</th>
                          <th className="py-3 px-4">Daily Burn</th>
                          <th className="py-3 px-4">Safety Stock</th>
                          <th className="py-3 px-4">Days of Supply</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inventory.map((item) => {
                          const days = item.dailyConsumption > 0 ? Math.round(item.quantity / item.dailyConsumption) : 999;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-bold text-slate-900">{item.resource?.name || 'Resource'}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="text-[10px]">{item.resource?.category || 'MEDICINE'}</Badge>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{formatNumber(item.quantity)} {item.resource?.unit || 'units'}</td>
                              <td className="py-3 px-4 text-slate-600">{item.dailyConsumption} / day</td>
                              <td className="py-3 px-4 text-slate-500">{item.safetyStock} units</td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={days <= 3 ? 'critical' : days <= 7 ? 'warning' : 'healthy'}
                                  className="text-[10px]"
                                >
                                  {days > 365 ? 'Stable (>1 yr)' : `~${days} days remaining`}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: DEMAND */}
            {activeTab === 'demand' && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Historical Patient Admissions</CardTitle>
                  <CardDescription className="text-xs">30-day recorded hospital intake trajectory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#0f766e" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="critical" name="Critical Care" stroke="#e11d48" strokeWidth={2} strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: PREDICTIONS */}
            {activeTab === 'predictions' && (
              <div className="space-y-3">
                {predictions.length === 0 ? (
                  <EmptyState title="No active predictions" description="Run the ML pipeline from the Predictions Center to refresh models." />
                ) : (
                  predictions.map((p) => (
                    <Card key={p.id} className="border-slate-200">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{p.resource?.name || 'Resource'}</span>
                            <Badge variant={p.riskLevel === 'CRITICAL' ? 'critical' : p.riskLevel === 'HIGH' ? 'warning' : 'healthy'}>
                              {p.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{p.explanation}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Model Confidence: {(p.confidence * 100).toFixed(0)}% • Projected Demand: {p.predictedDailyDemand} / day
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-rose-600">
                            {p.predictedStockoutDate ? `Stockout Date: ${formatDate(p.predictedStockoutDate)}` : 'Stable Reserve'}
                          </p>
                          <Link href="/admin/recommendations">
                            <Button size="sm" variant="outline" className="mt-2 text-xs text-teal-800 border-teal-300">
                              View Redistribution
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: ALERTS */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <EmptyState title="No alerts for this facility" description="All inventory thresholds are operating within safe bounds." />
                ) : (
                  alerts.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${a.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`} />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{a.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{a.message}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Logged {formatDate(a.createdAt)} • Type: {a.type}</p>
                        </div>
                      </div>
                      <Badge variant={a.status === 'RESOLVED' ? 'healthy' : a.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                        {a.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: TRANSFERS */}
            {activeTab === 'transfers' && (
              <div className="space-y-3">
                {transfers.length === 0 ? (
                  <EmptyState title="No transfers found" description="No inbound or outbound reallocations logged for this facility." />
                ) : (
                  transfers.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{t.resource?.name || 'Supply'} ({t.quantity} units)</p>
                        <p className="text-slate-500 mt-0.5">
                          {t.sourceFacility?.name} &rarr; {t.destinationFacility?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-bold">{t.status}</Badge>
                        <p className="text-[10px] text-slate-400 mt-1">Priority: {t.priority}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
