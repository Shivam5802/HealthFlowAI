'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  Building2,
  Package,
  AlertTriangle,
  ArrowLeftRight,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/ui/brand-logo';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { reportsApi } from '../../../services/reportsApi';
import { DailyReportData, WeeklyReportData } from '../../../types/report';
import { formatDate, formatNumber } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (reportType === 'daily') {
        const data = await reportsApi.getDailyReport();
        setDailyReport(data);
      } else {
        const data = await reportsApi.getWeeklyReport();
        setWeeklyReport(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compile operational report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const activeReport = reportType === 'daily' ? dailyReport : weeklyReport;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Clinical Intelligence Reports
              </Badge>
              <span className="text-xs text-slate-400">Audited Summaries</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Operational Healthcare Reports
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated surveillance reports on facility inventory, stockout risks, and transfer efficiency
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Report Type Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setReportType('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  reportType === 'daily' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setReportType('weekly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  reportType === 'weekly' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Weekly Trend
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs text-slate-700 rounded-xl"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Export
            </Button>
          </div>
        </div>

        {isLoading && <LoadingState message="Generating synthesized operational intelligence report..." />}
        {error && <ErrorState message={error} onRetry={fetchReports} />}

        {!isLoading && !error && activeReport && (
          <div className="space-y-6">
            {/* Report Document Container */}
            <Card className="border-slate-200 shadow-sm print:border-none print:shadow-none">
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Formal Report Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                      National Healthcare Surveillance Program
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {reportType === 'daily'
                        ? 'Daily Resource Intelligence Briefing'
                        : 'Weekly Operational Trend & Efficiency Report'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Scope: {activeReport.scope} • Generated: {formatDate(activeReport.generatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <BrandLogo variant="horizontal" size="xs" showSubtitle={false} />
                    <Badge variant="outline" className="font-mono text-xs">
                      REF-HF-{new Date().getFullYear()}-{reportType.toUpperCase()}
                    </Badge>
                    <p className="text-[10px] text-slate-400">Classification: RESTRICTED</p>
                  </div>
                </div>

                {/* Section 1: Executive KPI Summary */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    1. Network Status Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500">Facilities Monitored</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">
                        {activeReport.summary.totalFacilitiesMonitored}
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        {activeReport.summary.activeFacilitiesCount} Active
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500">Inventory Items</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">
                        {activeReport.summary.totalInventoryItems}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Active Stock Lines</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500">Critical Stockouts</p>
                      <p className="text-xl font-black text-rose-600 mt-0.5">
                        {activeReport.summary.stockStatus.critical}
                      </p>
                      <p className="text-[10px] text-rose-600 mt-0.5">Requires Immediate Redistribution</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500">Active Alerts</p>
                      <p className="text-xl font-black text-amber-600 mt-0.5">
                        {activeReport.summary.alerts.totalOpen}
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {activeReport.summary.alerts.criticalSeverity} Critical
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Weekly Trend Analysis (If Weekly) */}
                {reportType === 'weekly' && weeklyReport?.trendAnalysis && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      2. Reallocation Efficiency & Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                        <p className="text-xs text-teal-800 font-semibold">Redistribution Efficiency Rate</p>
                        <p className="text-2xl font-black text-teal-900 mt-1">
                          {weeklyReport.trendAnalysis.reallocationEfficiencyRate}
                        </p>
                        <p className="text-[10px] text-teal-700 mt-1">Optimal donor-recipient matches completed</p>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-xs text-emerald-800 font-semibold">Stockout Preventions</p>
                        <p className="text-2xl font-black text-emerald-900 mt-1">
                          {weeklyReport.trendAnalysis.stockoutPreventionEvents}
                        </p>
                        <p className="text-[10px] text-emerald-700 mt-1">Averted through proactive transfer alerts</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-800 font-semibold">Avg Transfer Transit Time</p>
                        <p className="text-2xl font-black text-blue-900 mt-1">
                          {weeklyReport.trendAnalysis.averageTransferCompletionHours} hrs
                        </p>
                        <p className="text-[10px] text-blue-700 mt-1">Intra-district logistics dispatch speed</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Transfer Logistics Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {reportType === 'weekly' ? '3.' : '2.'} Resource Transfer Logistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Pending Authorization:</span>
                      <span className="font-bold text-slate-900 float-right">
                        {activeReport.summary.transfers.pendingRequests}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Approved & Packed:</span>
                      <span className="font-bold text-slate-900 float-right">
                        {activeReport.summary.transfers.approvedOrPacked}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500">In Transit:</span>
                      <span className="font-bold text-blue-600 float-right">
                        {activeReport.summary.transfers.inTransit}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="text-slate-500">Delivered & Closed:</span>
                      <span className="font-bold text-emerald-600 float-right">
                        {activeReport.summary.transfers.deliveredTotal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Top Priority At-Risk Projections */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {reportType === 'weekly' ? '4.' : '3.'} High-Risk Predictive Forecasts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Facility</th>
                          <th className="py-2.5 px-3">Resource</th>
                          <th className="py-2.5 px-3">Projected Demand</th>
                          <th className="py-2.5 px-3">Predicted Stockout</th>
                          <th className="py-2.5 px-3">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeReport.topRiskPredictions.map((pred, i) => (
                          <tr key={i}>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{pred.facilityName}</td>
                            <td className="py-2.5 px-3 text-slate-700">{pred.resourceName}</td>
                            <td className="py-2.5 px-3 font-mono">{pred.predictedDailyDemand} / day</td>
                            <td className="py-2.5 px-3 font-semibold text-rose-600">
                              {pred.stockoutDate ? formatDate(pred.stockoutDate) : 'Imminent'}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge
                                variant={pred.riskLevel === 'CRITICAL' ? 'critical' : 'warning'}
                                className="text-[10px]"
                              >
                                {pred.riskLevel}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </RoleGuard>
  );
}
