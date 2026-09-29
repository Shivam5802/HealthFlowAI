'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  RefreshCw,
  Edit,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/app-shell';
import { RoleGuard } from '../../../components/layout/role-guard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
import { inventoryApi } from '../../../services/inventoryApi';
import { facilitiesApi } from '../../../services/facilitiesApi';
import { useAuth } from '../../../lib/auth-context';
import { InventoryItem } from '../../../types/inventory';
import { Facility } from '../../../types/facility';
import { formatNumber } from '../../../lib/utils';
import { useToast } from '../../../lib/toast-context';

export default function HospitalManagerInventoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update Stock Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editConsumption, setEditConsumption] = useState<number>(0);
  const [editSafety, setEditSafety] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let targetFacilityId = user?.facilityId;
      if (!targetFacilityId) {
        const allFacilities = await facilitiesApi.getFacilities();
        const bakshi = allFacilities.find((f) => f.name.includes('Bakshi')) || allFacilities[0];
        targetFacilityId = bakshi?.id;
      }

      if (!targetFacilityId) throw new Error('Facility assignment missing');

      const [facData, invData] = await Promise.all([
        facilitiesApi.getFacilityById(targetFacilityId),
        inventoryApi.getInventory(targetFacilityId),
      ]);

      setFacility(facData);
      setInventory(invData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query hospital inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

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

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditConsumption(item.dailyConsumption);
    setEditSafety(item.safetyStock);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    try {
      await inventoryApi.updateStock({
        facilityId: editingItem.facilityId,
        resourceId: editingItem.resourceId,
        quantity: editQty,
        dailyConsumption: editConsumption,
        safetyStock: editSafety,
      });

      showToast({
        title: 'Stock Updated',
        message: `Successfully synchronized ${editingItem.resource?.name || 'Resource'} count in PostgreSQL.`,
        type: 'success',
      });

      setEditingItem(null);
      fetchInventory();
    } catch (err: unknown) {
      showToast({
        title: 'Update Failed',
        message: err instanceof Error ? err.message : 'Unable to update inventory record.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      (item.resource?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  return (
    <RoleGuard allowedRoles={['HOSPITAL_MANAGER', 'ADMIN']}>
      <AppShell>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                Local Stock Ledger
              </Badge>
              <span className="text-xs text-slate-400">{facility?.name || 'Assigned Facility'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Facility Inventory Management
            </h1>
            <p className="text-xs text-slate-500">
              Update physical counts, modify consumption burn rates, and track safety buffer thresholds
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
            <Link href="/manager/requests">
              <Button size="sm" className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Request Resource
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources in your facility..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Fetching local pharmacy and stock ledger..." />}
        {error && <ErrorState message={error} onRetry={fetchInventory} />}

        {!isLoading && !error && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredInventory.length === 0 ? (
                <EmptyState
                  title="No inventory records found"
                  description="All physical items for this facility have been loaded."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Resource</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Daily Burn</th>
                        <th className="py-3 px-4">Safety Buffer</th>
                        <th className="py-3 px-4">Days Remaining</th>
                        <th className="py-3 px-4">Risk Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map((item) => {
                        const risk = calculateRisk(item);
                        const days =
                          item.dailyConsumption > 0
                            ? Math.round(item.quantity / item.dailyConsumption)
                            : 999;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.resource?.name || 'Resource'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px]">
                                {item.resource?.category || 'MEDICINE'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {formatNumber(item.quantity)} {item.resource?.unit || 'units'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {item.dailyConsumption} / day
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {item.safetyStock} units
                            </td>
                            <td className="py-3 px-4 font-bold">
                              {days > 365 ? '>1 year' : `~${days} days`}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  risk === 'CRITICAL'
                                    ? 'critical'
                                    : risk === 'HIGH'
                                    ? 'warning'
                                    : 'healthy'
                                }
                                className="text-[10px]"
                              >
                                {risk}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(item)}
                                className="h-7 text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> Update Stock
                              </Button>
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

        {/* Update Stock Modal */}
        {editingItem && (
          <Dialog open={Boolean(editingItem)} onOpenChange={() => setEditingItem(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Update Physical Count — {editingItem.resource?.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Modifications will update real-time stock and re-trigger risk calculations.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveStock} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="mgr-stock-qty">Available Physical Count</Label>
                  <Input
                    id="mgr-stock-qty"
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgr-burn">Daily Consumption Velocity</Label>
                  <Input
                    id="mgr-burn"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editConsumption}
                    onChange={(e) => setEditConsumption(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgr-safety">Safety Stock Threshold</Label>
                  <Input
                    id="mgr-safety"
                    type="number"
                    min="0"
                    value={editSafety}
                    onChange={(e) => setEditSafety(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>

                <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingItem(null)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving to Database...' : 'Save Updates'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </AppShell>
    </RoleGuard>
  );
}
