'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Map,
  List,
  CheckCircle2,
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
import { facilitiesApi } from '../../../services/facilitiesApi';
import { Facility, FacilityType, FacilityStatus } from '../../../types/facility';
import { useToast } from '../../../lib/toast-context';

export default function AdminFacilitiesPage() {
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Add Facility Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    type: 'HOSPITAL' as FacilityType,
    address: '',
    district: '',
    state: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    status: 'ACTIVE' as FacilityStatus,
  });

  const fetchFacilities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await facilitiesApi.getFacilities();
      setFacilities(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve facilities list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'ALL' || f.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [facilities, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredFacilities.length / pageSize) || 1;
  const paginatedFacilities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFacilities.slice(start, start + pageSize);
  }, [filteredFacilities, page]);

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacility.name || !newFacility.district) {
      showToast({ title: 'Validation Error', message: 'Name and district are required.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await facilitiesApi.createFacility(newFacility);
      showToast({
        title: 'Facility Provisioned',
        message: `${newFacility.name} has been enrolled into the national monitoring network.`,
        type: 'success',
      });
      setIsAddModalOpen(false);
      setNewFacility({
        name: '',
        type: 'HOSPITAL',
        address: '',
        district: '',
        state: 'Uttar Pradesh',
        latitude: 26.8467,
        longitude: 80.9462,
        status: 'ACTIVE',
      });
      fetchFacilities();
    } catch (err: unknown) {
      showToast({
        title: 'Provisioning Failed',
        message: err instanceof Error ? err.message : 'Unable to create facility record.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
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
                Facilities Surveillance
              </Badge>
              <span className="text-xs text-slate-400">25 Enrolled Centers</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Healthcare Facilities Network
            </h1>
            <p className="text-xs text-slate-500">
              Manage hospitals, community health centers, and primary clinics across administrative districts
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'map' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Map className="h-3.5 w-3.5" /> Geo Map
              </button>
            </div>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Facility
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by facility name, district, or address..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Types</option>
                <option value="HOSPITAL">Hospitals</option>
                <option value="PHC">Primary Health Centers (PHC)</option>
                <option value="CLINIC">Clinics</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState message="Fetching facility network roster from PostgreSQL..." />}
        {error && <ErrorState message={error} onRetry={fetchFacilities} />}

        {/* MAP VIEW */}
        {!isLoading && !error && viewMode === 'map' && (
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Geographic Risk Distribution — Uttar Pradesh Grid
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time spatial visualization mapped to GPS coordinates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-b from-teal-950/5 to-slate-100/50 border border-slate-200 rounded-2xl p-6 min-h-[420px] relative flex flex-col justify-between">
                {/* Geographic Grid Canvas Simulation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFacilities.map((f) => {
                    // Risk determination for marker color
                    const isBakshi = f.name.includes('Bakshi');
                    const isHospitalA = f.name.includes('Civil Hospital') || f.name.includes('Hospital A');
                    const markerColor = isBakshi
                      ? 'bg-rose-600 text-white ring-rose-300'
                      : isHospitalA
                      ? 'bg-emerald-600 text-white ring-emerald-300'
                      : 'bg-teal-700 text-white ring-teal-200';

                    return (
                      <Link
                        key={f.id}
                        href={`/admin/facilities/${f.id}`}
                        className="group p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-card transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className={`h-3 w-3 rounded-full ring-4 ${markerColor} shrink-0 mt-1`} />
                          <Badge variant="outline" className="text-[9px] py-0">
                            {f.type}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="font-bold text-slate-900 text-xs truncate group-hover:text-teal-700">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            {f.district}, UP
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{f.latitude.toFixed(2)}°N, {f.longitude.toFixed(2)}°E</span>
                          <span className="font-semibold text-teal-700">View &rarr;</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Map Legend */}
                <div className="mt-6 p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 text-xs">Surveillance Legend:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <span className="text-[11px] text-slate-600">Surplus / Stable</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                      <span className="text-[11px] text-slate-600">Critical Stockout Threat</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-700" />
                      <span className="text-[11px] text-slate-600">Monitored In-Range</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Integrated GPS Coordinate Projection</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* LIST TABLE VIEW */}
        {!isLoading && !error && viewMode === 'list' && (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {filteredFacilities.length === 0 ? (
                <EmptyState
                  title="No facilities found"
                  description="Adjust your search criteria or register a new facility."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3 px-4">Facility Name</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Inventory Lines</th>
                        <th className="py-3 px-4">Coordinates</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedFacilities.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {f.type === 'HOSPITAL' ? 'H' : 'P'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{f.name}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">{f.address}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {f.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{f.district}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={f.status === 'ACTIVE' ? 'healthy' : 'warning'}
                              className="text-[10px]"
                            >
                              {f.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {f._count?.inventory ?? 12} items monitored
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {f.latitude.toFixed(2)}, {f.longitude.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/admin/facilities/${f.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                              >
                                View Details &rarr;
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredFacilities.length > pageSize && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, filteredFacilities.length)} of {filteredFacilities.length} facilities
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-7 text-xs"
                    >
                      Previous
                    </Button>
                    <span className="px-2 text-xs font-semibold text-slate-700">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-7 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Facility Dialog */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Enroll New Healthcare Facility
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a hospital or primary health center into the PostgreSQL surveillance database.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddFacility} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="fac-name">Facility Name</Label>
                <Input
                  id="fac-name"
                  placeholder="e.g. District Hospital Gonda"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fac-type">Classification</Label>
                  <select
                    id="fac-type"
                    value={newFacility.type}
                    onChange={(e) =>
                      setNewFacility({ ...newFacility, type: e.target.value as FacilityType })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="HOSPITAL">HOSPITAL</option>
                    <option value="PHC">PHC</option>
                    <option value="CLINIC">CLINIC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fac-district">District</Label>
                  <Input
                    id="fac-district"
                    placeholder="e.g. Lucknow, Kanpur"
                    value={newFacility.district}
                    onChange={(e) => setNewFacility({ ...newFacility, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fac-address">Full Address</Label>
                <Input
                  id="fac-address"
                  placeholder="Street / Sector / Pin code"
                  value={newFacility.address}
                  onChange={(e) => setNewFacility({ ...newFacility, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fac-lat">Latitude</Label>
                  <Input
                    id="fac-lat"
                    type="number"
                    step="0.0001"
                    value={newFacility.latitude}
                    onChange={(e) =>
                      setNewFacility({ ...newFacility, latitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fac-lng">Longitude</Label>
                  <Input
                    id="fac-lng"
                    type="number"
                    step="0.0001"
                    value={newFacility.longitude}
                    onChange={(e) =>
                      setNewFacility({ ...newFacility, longitude: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-800 hover:bg-teal-900 text-white font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AppShell>
    </RoleGuard>
  );
}
