'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Package,
  AlertTriangle,
  ArrowLeftRight,
  Sparkles,
  Share2,
  Users,
  BarChart3,
  Boxes,
  Truck,
  FileCheck2,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types/auth';
import { BrandLogo } from '../ui/brand-logo';

interface SidebarProps {
  userRole?: UserRole;
  facilityName?: string | null;
  onCloseMobile?: () => void;
}

export function Sidebar({ userRole = 'ADMIN', facilityName, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const getNavigationForRole = () => {
    if (userRole === 'HOSPITAL_MANAGER') {
      return [
        { name: 'Facility Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
        { name: 'Stock & Inventory', href: '/manager/inventory', icon: Package },
        { name: 'Resource Requests', href: '/manager/requests', icon: FileCheck2 },
        { name: 'Facility Alerts', href: '/manager/alerts', icon: AlertTriangle },
        { name: 'Facility Transfers', href: '/manager/transfers', icon: ArrowLeftRight },
      ];
    }

    if (userRole === 'SUPPLY_MANAGER') {
      return [
        { name: 'Logistics Overview', href: '/supply/dashboard', icon: LayoutDashboard },
        { name: 'Surplus & Stock Matrix', href: '/supply/resources', icon: Boxes },
        { name: 'Incoming Requests', href: '/supply/requests', icon: FileCheck2 },
        { name: 'Transfer Operations', href: '/supply/transfers', icon: Truck },
      ];
    }

    // Default: ADMIN
    return [
      { name: 'Global Command', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Facilities Network', href: '/admin/facilities', icon: Building2 },
      { name: 'Inventory & Stock', href: '/admin/inventory', icon: Package },
      { name: 'AI Demand Forecasts', href: '/admin/predictions', icon: Sparkles },
      { name: 'Alert Center', href: '/admin/alerts', icon: AlertTriangle },
      { name: 'Transfer Logistics', href: '/admin/transfers', icon: ArrowLeftRight },
      { name: 'Redistribution AI', href: '/admin/recommendations', icon: Share2 },
      { name: 'Operational Reports', href: '/admin/reports', icon: BarChart3 },
      { name: 'Employee Directory', href: '/admin/employees', icon: Users },
    ];
  };

  const navItems = getNavigationForRole();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <BrandLogo variant="horizontal" size="sm" href="/" showSubtitle={true} />
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Facility Badge if hospital manager */}
      {facilityName && (
        <div className="px-3.5 py-2.5 mx-3 my-2.5 rounded-xl bg-teal-50 border border-teal-100">
          <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Facility Scope</p>
          <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">{facilityName}</p>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                isActive
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-teal-700' : 'text-slate-400')} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-600 font-medium">PostgreSQL & ML Online</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Active Role:</span>
          <span className="font-semibold text-teal-800">{userRole}</span>
        </div>
      </div>
    </aside>
  );
}
