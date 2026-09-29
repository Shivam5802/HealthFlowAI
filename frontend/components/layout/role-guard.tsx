'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types/auth';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Verifying authorization credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl text-slate-900">Authentication Required</CardTitle>
            <CardDescription>You must sign in with verified credentials to access this healthcare module.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white">
                Proceed to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    const dashboardRoute =
      user.role === 'ADMIN'
        ? '/admin/dashboard'
        : user.role === 'HOSPITAL_MANAGER'
        ? '/manager/dashboard'
        : '/supply/dashboard';

    return (
      <div className="max-w-lg mx-auto my-16">
        <Card className="border-rose-200 bg-rose-50/40">
          <CardHeader className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 mb-3">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-slate-900">403 — Access Denied</CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Your active role (<span className="font-semibold text-slate-800">{user.role}</span>) does not have operational clearance to view this module.
              Access is restricted to: <span className="font-semibold text-teal-800">{allowedRoles.join(', ')}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Link href={dashboardRoute}>
              <Button variant="default" className="bg-teal-700 hover:bg-teal-800 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Assigned Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
