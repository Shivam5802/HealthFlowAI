'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  Play,
  RefreshCw,
  TrendingDown,
  Info,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
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
import { predictionsApi } from '../../../services/predictionsApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { PredictionItem } from '../../../types/prediction';
import { Facility } from '../../../types/facility';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function AdminPredictionsPage() {
  const { showToast } = useToast();
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Selected prediction for explanation modal
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionItem | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [preds, facs] = await Promise.all([
        predictionsApi.getCriticalRisks(),
        facilitiesApi.getFacilities(),
      ]);
      setPredictions(preds);
      setFacilities(facs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query predictive analytics model');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      await predictionsApi.runPredictionsPipeline();
      showToast({
        title: 'Forecasting Pipeline Executed',
        message: 'Updated stockout risk projections across all monitored facilities.',
        type: 'success',
      });
      fetchPredictions();
    } catch (err: unknown) {
      showToast({
        title: 'Pipeline Run Failed',
        message: err instanceof Error ? err.message : 'Error executing predictive models.',
        type: 'error',
      });
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      const matchesSearch =
        (p.resource?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.facility?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFacility = facilityFilter === 'ALL' || p.facilityId === facilityFilter;
      const matchesRisk = riskFilter === 'ALL' || p.riskLevel === riskFilter;

      return matchesSearch && matchesFacility && matchesRisk;
    });
  }, [predictions, searchQuery, facilityFilter, riskFilter]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Predictive AI Engine
              </Badge>
              <span className="text-xs text-slate-400">ML-FastAPI Connected</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              AI Demand Forecasts & Stockout Predictions
            </h1>
            <p className="text-xs text-slate-500">
              Surge detection, burn acceleration curves, and estimated stockout dates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPredictions}
              disabled={isLoading || isRunningPipeline}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleRunPipeline}
              disabled={isRunningPipeline}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
            >
              <Play className={`h-3.5 w-3.5 mr-1.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
              {isRunningPipeline ? 'Calculating Models...' : 'Run Forecast Pipeline'}
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search predictions by resource or facility..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
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

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate / Warning</option>
                <option value="HEALTHY">Healthy</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Fetching predictive inference logs from PostgreSQL..." />}
        {error && <ErrorState message={error} onRetry={fetchPredictions} />}

        {!isLoading && !error && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredPredictions.length === 0 ? (
                <EmptyState
                  title="No prediction records found"
                  description="Click 'Run Forecast Pipeline' to generate updated predictive models."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Resource</th>
                        <th className="py-3 px-4">Facility</th>
                        <th className="py-3 px-4">Projected Daily Demand</th>
                        <th className="py-3 px-4">Stockout Horizon</th>
                        <th className="py-3 px-4">Confidence</th>
                        <th className="py-3 px-4">Risk Classification</th>
                        <th className="py-3 px-4 text-right">Model Reasoning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPredictions.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{p.resource?.name || 'Medical Supply'}</p>
                            <p className="text-[10px] text-slate-400">{p.resource?.category || 'MEDICINE'}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {p.facility?.name || 'Facility'}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {p.predictedDailyDemand} {p.resource?.unit || 'units'} / day
                          </td>
                          <td className="py-3 px-4">
                            {p.predictedStockoutDate ? (
                              <span className="font-bold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {formatDate(p.predictedStockoutDate)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Safe Horizon (&gt;30d)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">{(p.confidence * 100).toFixed(0)}%</span>
                              <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-teal-700 h-1.5 rounded-full"
                                  style={{ width: `${p.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                p.riskLevel === 'CRITICAL'
                                  ? 'critical'
                                  : p.riskLevel === 'HIGH'
                                  ? 'warning'
                                  : 'healthy'
                              }
                              className="text-[10px]"
                            >
                              {p.riskLevel}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPrediction(p)}
                              className="h-7 text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                            >
                              <Info className="h-3.5 w-3.5 mr-1" /> Explain
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prediction Detail & Explanation Modal */}
        {selectedPrediction && (
          <Dialog open={Boolean(selectedPrediction)} onOpenChange={() => setSelectedPrediction(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Model Inference Explanation
                  </DialogTitle>
                  <Badge
                    variant={
                      selectedPrediction.riskLevel === 'CRITICAL'
                        ? 'critical'
                        : selectedPrediction.riskLevel === 'HIGH'
                        ? 'warning'
                        : 'healthy'
                    }
                  >
                    {selectedPrediction.riskLevel} RISK
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  {selectedPrediction.resource?.name} at {selectedPrediction.facility?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    AI Diagnostic Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedPrediction.explanation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="text-slate-500 text-[10px]">Predicted Inflow Demand</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {selectedPrediction.predictedDailyDemand} units/day
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="text-slate-500 text-[10px]">Statistical Confidence</p>
                    <p className="text-base font-black text-teal-700 mt-0.5">
                      {(selectedPrediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    Recommended Clinical Action
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Initiate an inter-facility resource transfer before{' '}
                    <strong>{selectedPrediction.predictedStockoutDate ? formatDate(selectedPrediction.predictedStockoutDate) : 'end of month'}</strong> to avoid emergency healthcare disruption.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-4 flex items-center justify-between">
                <Button variant="outline" onClick={() => setSelectedPrediction(null)}>
                  Close
                </Button>
                <Link href="/admin/recommendations">
                  <Button className="bg-teal-800 hover:bg-teal-900 text-white text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> View Surplus Sources &rarr;
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AppShell>
    </RoleGuard>
  );
}
