'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Package,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { LoadingState } from '../../../components/feedback/loading-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyState } from '../../../components/feedback/empty-state';
import { inventoryApi } from '../../../services/inventoryApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { InventoryItem } from '../../../types/inventory';
import { Facility } from '../../../types/facility';
import { formatNumber } from '../../../lib/utils';

export default function SupplyResourcesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invData, facData] = await Promise.all([
        inventoryApi.getInventory(),
        facilitiesApi.getFacilities(),
      ]);
      setInventory(invData);
      setFacilities(facData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to query inventory ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const calculateSurplus = (item: InventoryItem) => {
    const reserved = item.safetyStock * 1.5;
    const surplus = Math.max(0, item.quantity - reserved);
    return Math.round(surplus);
  };

  const calculateRisk = (item: InventoryItem) => {
    if (item.quantity <= 0) return 'CRITICAL';
    if (item.dailyConsumption > 0) {
      const days = item.quantity / item.dailyConsumption;
      if (days <= 3) return 'CRITICAL';
      if (days <= 7) return 'HIGH';
      if (days <= 14) return 'MEDIUM';
      return 'LOW';
    }
    if (item.quantity < item.safetyStock) return 'HIGH';
    return 'LOW';
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const risk = calculateRisk(item);
      const matchesSearch =
        (item.resource?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.facility?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFacility = facilityFilter === 'ALL' || item.facilityId === facilityFilter;
      const matchesRisk = riskFilter === 'ALL' || risk === riskFilter;

      return matchesSearch && matchesFacility && matchesRisk;
    });
  }, [inventory, searchQuery, facilityFilter, riskFilter]);

  return (
    <RoleGuard allowedRoles={['SUPPLY_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Regional Surplus Matrix
              </Badge>
              <span className="text-xs text-slate-400">Donor Identification</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Resource Availability & Surplus Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Evaluate hospital stock holdings against safety reserves to determine potential reallocations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInventory}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/recommendations">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-300" /> Run Redistribution AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources, medicines, or facilities..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-medium"
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
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low (Potential Surplus)</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Calculating regional surplus margins..." />}
        {error && <ErrorState message={error} onRetry={fetchInventory} />}

        {!isLoading && !error && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredInventory.length === 0 ? (
                <EmptyState
                  title="No inventory records"
                  description="Adjust filter criteria to view regional surplus matrix."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Resource</th>
                        <th className="py-3 px-4">Facility</th>
                        <th className="py-3 px-4">Total Stock</th>
                        <th className="py-3 px-4">Safety Reserve</th>
                        <th className="py-3 px-4">Potential Surplus</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4 text-right">Logistics Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map((item) => {
                        const surplus = calculateSurplus(item);
                        const risk = calculateRisk(item);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.resource?.name}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {item.facility?.name}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {formatNumber(item.quantity)} {item.resource?.unit || 'units'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {item.safetyStock} units
                            </td>
                            <td className="py-3 px-4">
                              {surplus > 0 ? (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  +{formatNumber(surplus)} donor buffer
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No surplus buffer</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  risk === 'CRITICAL'
                                    ? 'critical'
                                    : risk === 'HIGH'
                                    ? 'warning'
                                    : risk === 'MEDIUM'
                                    ? 'info'
                                    : 'healthy'
                                }
                                className="text-[10px]"
                              >
                                {risk}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {surplus > 0 ? (
                                <Link href="/admin/recommendations">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                                  >
                                    Reallocate Surplus &rarr;
                                  </Button>
                                </Link>
                              ) : (
                                <span className="text-[11px] text-slate-400">Balanced</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppShell>
    </RoleGuard>
  );
}
