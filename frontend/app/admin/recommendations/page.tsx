'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Building2,
  AlertTriangle,
  Package,
  Layers,
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
import { recommendationsApi } from '../../../services/recommendationsApi';
import { transfersApi } from '../../../services/transfersApi';
import { RedistributionRecommendation } from '../../../types/recommendation';
import { formatNumber } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function RedistributionPage() {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState<RedistributionRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transfer Creation Confirmation Modal
  const [selectedRec, setSelectedRec] = useState<RedistributionRecommendation | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getRedistributionRecommendations();
      setRecommendations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to run redistribution matching algorithm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleConfirmTransfer = async () => {
    if (!selectedRec) return;
    setIsTransferring(true);
    try {
      await transfersApi.createTransfer({
        sourceFacilityId: selectedRec.sourceFacilityId,
        destinationFacilityId: selectedRec.destinationFacilityId,
        resourceId: selectedRec.resourceId,
        quantity: selectedRec.recommendedQuantity,
        priority: selectedRec.priority,
      });

      showToast({
        title: 'Transfer Pipeline Initiated',
        message: `Dispatched ${selectedRec.recommendedQuantity} units of ${selectedRec.resourceName} to ${selectedRec.destinationFacilityName}.`,
        type: 'success',
      });

      setSelectedRec(null);
      fetchRecommendations();
    } catch (err: unknown) {
      showToast({
        title: 'Transfer Creation Failed',
        message: err instanceof Error ? err.message : 'Unable to create transfer in database.',
        type: 'error',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                AI Logistics Rebalancing
              </Badge>
              <span className="text-xs text-slate-400">PostgreSQL Live Surplus Matching</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Automated Resource Redistribution
            </h1>
            <p className="text-xs text-slate-500">
              Heuristic matching pairs facilities facing critical shortages with nearest surplus donors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
            <Link href="/admin/transfers">
              <Button size="sm" variant="outline" className="text-xs text-slate-700">
                View Active Transfers &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Algorithm Philosophy Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                Multi-Objective Optimization Engine
              </span>
            </div>
            <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
              Calculates real-time burn velocity and safety buffers. Prioritizes intra-district transfers
              to minimize transit time while guaranteeing the donor facility preserves safe operating reserves.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Non-Depletion Source Safeguard</span>
          </div>
        </div>

        {isLoading && <LoadingState message="Executing heuristic donor-recipient matching across 25 facilities..." />}
        {error && <ErrorState message={error} onRetry={fetchRecommendations} />}

        {!isLoading && !error && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <EmptyState
                title="All Facilities Stabilized"
                description="Zero clinical facilities currently have critical supply deficits exceeding safety buffers."
              />
            ) : (
              recommendations.map((rec, idx) => (
                <Card
                  key={`${rec.sourceFacilityId}-${rec.destinationFacilityId}-${rec.resourceId}-${idx}`}
                  className="border-slate-200 hover:border-teal-300 transition-all shadow-xs"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Reallocation Flow Visual */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2.5">
                          <Badge
                            variant={rec.priority === 'CRITICAL' ? 'critical' : 'warning'}
                            className="text-[10px] font-bold"
                          >
                            {rec.priority} PRIORITY
                          </Badge>
                          <span className="text-xs font-bold text-slate-900">
                            {rec.resourceName}
                          </span>
                          <span className="text-[11px] text-slate-400">({rec.resourceCategory})</span>
                        </div>

                        {/* Donor to Recipient Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                          {/* Donor */}
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              SRC
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                Donor Facility (Surplus)
                              </p>
                              <p className="font-bold text-slate-900">{rec.sourceFacilityName}</p>
                              <p className="text-[11px] text-slate-500">
                                Current Stock: {formatNumber(rec.sourceCurrentStock)} • Post-transfer buffer: ~{rec.postTransferSourceDaysRemaining} days
                              </p>
                            </div>
                          </div>

                          {/* Recipient */}
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                              DST
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                Deficit Facility (Critical)
                              </p>
                              <p className="font-bold text-slate-900">{rec.destinationFacilityName}</p>
                              <p className="text-[11px] text-rose-600 font-semibold">
                                Current Stock: {formatNumber(rec.destinationCurrentStock)} • Only ~{rec.destinationDaysRemaining} days remaining!
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Explanation */}
                        <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-100">
                          &ldquo;{rec.explanation}&rdquo;
                        </p>
                      </div>

                      {/* Right: Quantity & Action Button */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-left lg:text-right">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Recommended Reallocation
                          </p>
                          <p className="text-2xl font-black text-teal-800">
                            {formatNumber(rec.recommendedQuantity)}{' '}
                            <span className="text-xs font-normal text-slate-500">units</span>
                          </p>
                        </div>

                        <Button
                          onClick={() => setSelectedRec(rec)}
                          className="bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Create Transfer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {selectedRec && (
          <ConfirmationModal
            isOpen={Boolean(selectedRec)}
            onClose={() => setSelectedRec(null)}
            onConfirm={handleConfirmTransfer}
            title="Approve Inter-Facility Redistribution"
            description={`Reallocate ${selectedRec.recommendedQuantity} units of ${selectedRec.resourceName} from "${selectedRec.sourceFacilityName}" to "${selectedRec.destinationFacilityName}"? This will create an active logistics transfer record.`}
            confirmText="Dispatch Transfer Order"
            variant="primary"
            isLoading={isTransferring}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}
