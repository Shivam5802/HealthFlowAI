'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, LogOut, Menu, Shield, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BrandLogo } from '../ui/brand-logo';
import { User } from '../../types/auth';
import { alertsApi } from '../../services/alertsApi';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export function Header({ user, onLogout, onOpenMobileMenu, onOpenSearch }: HeaderProps) {
  const [openAlertCount, setOpenAlertCount] = useState<number>(0);

  useEffect(() => {
    // Dynamically query active alert count from backend
    alertsApi
      .getAlerts({ status: 'OPEN' })
      .then((alerts) => {
        setOpenAlertCount(alerts.length);
      })
      .catch(() => {
        // Fallback silently if offline
      });
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="md:hidden flex items-center">
          <BrandLogo variant="horizontal" size="xs" showSubtitle={false} />
        </div>

        {/* Synthetic Demo Environment Notice */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
          <span>Demo Environment • Synthetic Data</span>
        </div>
      </div>

      {/* Center/Right: Search, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors"
          title="Search facilities, inventory, transfers (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search network...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Alerts Bell */}
        <Link href={user?.role === 'HOSPITAL_MANAGER' ? '/manager/alerts' : '/admin/alerts'}>
          <button
            aria-label="Active Alerts"
            className="relative rounded-xl p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {openAlertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {openAlertCount > 9 ? '9+' : openAlertCount}
              </span>
            )}
          </button>
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || 'Administrator'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-500 leading-tight">
                {user?.employeeId || 'HF-EMP-1001'}
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold border-teal-200 text-teal-800 bg-teal-50">
                {user?.role || 'ADMIN'}
              </Badge>
            </div>
          </div>

          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HF'}
          </div>

          {onLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 sm:h-9 sm:w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
