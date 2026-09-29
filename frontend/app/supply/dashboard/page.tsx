'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  PackageCheck,
  AlertTriangle,
  Boxes,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
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
import { inventoryApi } from '../../../services/inventoryApi';
import { reportsApi } from '../../../services/reportsApi';
import { TransferItem } from '../../../types/transfer';
import { InventoryItem } from '../../../types/inventory';
import { DailyReportData } from '../../../types/report';
import { formatNumber, formatDate } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function SupplyManagerDashboardPage() {
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [trfData, invData, repData] = await Promise.all([
        transfersApi.getTransfers(),
        inventoryApi.getInventory(),
        reportsApi.getDailyReport(),
      ]);

      setTransfers(trfData);
      setInventories(invData);
      setReport(repData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to query supply logistics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyData();
  }, []);

  // Compute metrics
  const pendingRequests = transfers.filter((t) => t.status === 'REQUESTED');
  const activeTransfers = transfers.filter((t) => t.status === 'APPROVED' || t.status === 'PACKED' || t.status === 'IN_TRANSIT');
  const criticalRequests = transfers.filter((t) => t.priority === 'CRITICAL' && t.status !== 'DELIVERED');
  const availableSurplusCount = inventories.filter((i) => i.quantity > i.safetyStock * 2).length;

  return (
    <RoleGuard allowedRoles={['SUPPLY_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Logistics Command
              </Badge>
              <span className="text-xs text-slate-400">Regional Supply Operations</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Supply Logistics & Redistribution Command
            </h1>
            <p className="text-xs text-slate-500">
              Orchestrate resource movements, authorize transfer dispatches, and balance regional surpluses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSupplyData}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/recommendations">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-300" /> Redistribution AI
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && <LoadingState message="Synchronizing regional logistics channels and inventory ledgers..." />}
        {error && <ErrorState message={error} onRetry={fetchSupplyData} />}

        {!isLoading && !error && (
          <div className="space-y-6">
            {/* KPI Cards (Focused Strictly on Supply Operations) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. Pending Requests */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Pending Requests
                  </span>
                  <CardTitle className="text-2xl font-black text-amber-600 mt-1">
                    {pendingRequests.length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Awaiting authorization
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 2. High Priority Requests */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    High Priority Requests
                  </span>
                  <CardTitle className="text-2xl font-black text-rose-600 mt-1">
                    {criticalRequests.length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-rose-500 mt-0.5">
                    Urgent priority (&lt;24h)
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 3. Resources Available */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Resources Available
                  </span>
                  <CardTitle className="text-2xl font-black text-emerald-700 mt-1">
                    {availableSurplusCount}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Surplus stock items
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 4. Active Transfers */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Transfers
                  </span>
                  <CardTitle className="text-2xl font-black text-blue-700 mt-1">
                    {activeTransfers.length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-blue-600 mt-0.5">
                    In operational flow
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 5. Transfers In Transit */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Transfers In Transit
                  </span>
                  <CardTitle className="text-2xl font-black text-teal-800 mt-1">
                    {transfers.filter((t) => t.status === 'IN_TRANSIT').length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    En route on highways
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* 6. Transfers Awaiting Action */}
              <Card className="border-slate-200">
                <CardHeader className="p-3.5 pb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Transfers Awaiting Action
                  </span>
                  <CardTitle className="text-2xl font-black text-slate-800 mt-1">
                    {transfers.filter((t) => t.status === 'APPROVED' || t.status === 'PACKED').length}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 mt-0.5">
                    Packing & vehicle loading
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Middle Row: Pending Authorization Queue & Active Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Requests Queue */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Pending Transfer Authorizations
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Requisitions submitted by hospital clinical managers
                    </CardDescription>
                  </div>
                  <Link href="/supply/transfers">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                      View Dispatch Center &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Zero pending transfer requests requiring authorization.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {t.resource?.name} ({t.quantity} units)
                              </span>
                              <Badge
                                variant={t.priority === 'CRITICAL' ? 'critical' : 'warning'}
                                className="text-[9px]"
                              >
                                {t.priority}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {t.sourceFacility?.name} &rarr; {t.destinationFacility?.name}
                            </p>
                          </div>
                          <Link href="/supply/transfers">
                            <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs rounded-xl h-7">
                              Review & Authorize
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Pipeline Feed */}
              <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Active Shipments in Transit
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Live dispatch track across UP regional network
                    </CardDescription>
                  </div>
                  <Link href="/supply/transfers">
                    <Button variant="ghost" size="sm" className="text-xs text-teal-700">
                      Full Tracker &rarr;
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {activeTransfers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No active shipments currently on transit routes.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeTransfers.slice(0, 4).map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-50 text-teal-800">
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                #{t.id.slice(0, 8)} • {t.resource?.name} ({t.quantity} units)
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Destined for: {t.destinationFacility?.name}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {t.status.replace('_', ' ')}
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
