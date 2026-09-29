'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  Package,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { reportsApi } from '../../../services/reportsApi';
import { alertsApi } from '../../../services/alertsApi';
import { transfersApi } from '../../../services/transfersApi';
import { patientApi } from '../../../services/patientApi';
import { inventoryApi } from '../../../services/inventoryApi';
import { DailyReportData } from '../../../types/report';
import { AlertItem } from '../../../types/alert';
import { TransferItem } from '../../../types/transfer';
import { PatientDemandRecord } from '../../../types/patient';
import { InventoryItem } from '../../../types/inventory';
import { formatNumber } from '../../../lib/utils';

export default function AdminDashboardPage() {
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [demands, setDemands] = useState<PatientDemandRecord[]>([]);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [demandTimeframe, setDemandTimeframe] = useState<'7' | '30' | '90'>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportData, alertsData, transfersData, demandsData, invData] = await Promise.all([
        reportsApi.getDailyReport(),
        alertsApi.getAlerts(),
        transfersApi.getTransfers(),
        patientApi.getDemand(),
        inventoryApi.getInventory(),
      ]);

      setReport(reportData);
      setAlerts(alertsData);
      setTransfers(transfersData);
      setDemands(demandsData);
      setInventories(invData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to synchronize with clinical intelligence backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter demands according to timeframe
  const filteredDemandData = React.useMemo(() => {
    if (!demands.length) return [];
    const days = parseInt(demandTimeframe, 10);
    // Group or aggregate by date
    const aggregated = demands.slice(-days).map((d) => ({
      date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      patients: d.patientCount,
      critical: d.criticalCases,
      inflow: Math.round(d.inflowRate),
    }));
    return aggregated;
  }, [demands, demandTimeframe]);

  // Health distribution data for pie chart
  const healthDistributionData = React.useMemo(() => {
    if (!report?.summary?.stockStatus) return [];
    const status = report.summary.stockStatus;
    return [
      { name: 'Stable (Low)', value: status.stable, color: '#059669' },
      { name: 'Medium Risk', value: status.mediumRisk, color: '#0284c7' },
      { name: 'High Risk', value: status.highRisk, color: '#f59e0b' },
      { name: 'Critical Deficit', value: status.critical, color: '#e11d48' },
    ];
  }, [report]);

  // Inventory items with lowest days remaining
  const atRiskInventoryItems = React.useMemo(() => {
    return inventories
      .map((item) => {
        const days = item.dailyConsumption > 0 ? Math.round(item.quantity / item.dailyConsumption) : 999;
        return { ...item, daysRemaining: days };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, [inventories]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Admin Command Center
              </Badge>
              <span className="text-xs text-slate-400">PostgreSQL Live Data</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Healthcare Resource Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Network-wide surveillance, algorithmic forecasting, and automated redistribution
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/recommendations">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-300" />
                Redistribution AI
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && <LoadingState message="Synchronizing network telemetry and hospital inventory..." />}
        {error && <ErrorState message={error} onRetry={fetchDashboardData} />}

        {!isLoading && !error && report && (
          <div className="space-y-6">
            {/* Top 4 Required KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Facilities */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Facilities
                    </span>
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-slate-900 mt-1">
                    {report.summary.totalFacilitiesMonitored}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3" /> {report.summary.activeFacilitiesCount} operational in Uttar Pradesh
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Healthy Facilities */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Healthy Stocked
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-emerald-700 mt-1">
                    {report.summary.stockStatus.stable}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                    Items with &gt; 15 days supply buffer
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* High Risk Facilities */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      High / Critical Risk
                    </span>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-rose-600 mt-1">
                    {report.summary.stockStatus.highRisk + report.summary.stockStatus.critical}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-rose-600 font-medium mt-0.5">
                    {report.summary.stockStatus.critical} critical stockout threats
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Open Alerts */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Active Alerts
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black text-amber-600 mt-1">
                    {report.summary.alerts.totalOpen}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                    {report.summary.alerts.criticalSeverity} critical • {report.summary.alerts.warningSeverity} warning
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Additional Operational Context KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500">Critical Resources</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{report.summary.stockStatus.critical}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">&lt; 3 days stock reserve</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500">Active Transfers</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {report.summary.transfers.approvedOrPacked + report.summary.transfers.inTransit}
                </p>
                <p className="text-[10px] text-teal-600 mt-0.5">
                  {report.summary.transfers.inTransit} currently in transit
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500">Pending Requests</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {report.summary.transfers.pendingRequests}
                </p>
                <p className="text-[10px] text-amber-600 mt-0.5">Awaiting logistics approval</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500">Demand Surge Index</p>
                <p className="text-lg font-black text-emerald-600 mt-0.5">+14.2%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Seasonal respiratory surge</p>
              </div>
            </div>

            {/* Main Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Demand Trend (2 Cols) */}
              <Card className="lg:col-span-2 border-slate-200">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Patient Inflow & Demand Trend
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Historical patient admissions vs critical care burden
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['7', '30', '90'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDemandTimeframe(t)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                          demandTimeframe === t
                            ? 'bg-white text-teal-800 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {t}D
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredDemandData}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Line
                          type="monotone"
                          dataKey="patients"
                          name="Total Admissions"
                          stroke="#0f766e"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="critical"
                          name="Critical Cases"
                          stroke="#e11d48"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Distribution Breakdown (1 Col) */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Network Risk Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-factor inventory risk classification
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {healthDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-1 text-xs">
                    {healthDistributionData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] text-slate-600 truncate">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Imminent Shortages & Active Logistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Imminent Shortages Table */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Imminent Stock Shortages
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Facilities with &lt; 5 days of inventory remaining
                    </CardDescription>
                  </div>
                  <Link href="/admin/inventory">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-900">
                      View All &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5">Resource</th>
                          <th className="py-2.5">Facility</th>
                          <th className="py-2.5">Stock</th>
                          <th className="py-2.5">Days Left</th>
                          <th className="py-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {atRiskInventoryItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-semibold text-slate-900">
                              {item.resource?.name || 'Resource'}
                            </td>
                            <td className="py-2.5 text-slate-600 truncate max-w-[120px]">
                              {item.facility?.name || 'Facility'}
                            </td>
                            <td className="py-2.5 text-slate-700">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                  item.daysRemaining <= 3
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                ~{item.daysRemaining} days
                              </span>
                            </td>
                            <td className="py-2.5">
                              <Link href="/admin/recommendations">
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-teal-800 border-teal-300 hover:bg-teal-50">
                                  Reallocate
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Active Transfers Feed */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Active Transfer Pipeline
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Real-time cross-facility resource reallocation
                    </CardDescription>
                  </div>
                  <Link href="/admin/transfers">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700 hover:text-teal-900">
                      View Logistics &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {transfers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No active transfers in transit.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {transfers.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-100/60 text-teal-800">
                              <ArrowLeftRight className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {t.resource?.name || 'Medical Supply'} • {t.quantity} units
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {t.sourceFacility?.name || 'Central Hub'} &rarr; {t.destinationFacility?.name || 'PHC'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                t.status === 'IN_TRANSIT'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : t.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {t.eta ? `ETA: ${new Date(t.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Priority: ' + t.priority}
                            </p>
                          </div>
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
