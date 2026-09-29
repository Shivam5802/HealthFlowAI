'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Building2, Truck, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/ui/brand-logo';
import { useAuth } from '../../../lib/auth-context';
import { useToast } from '../../../lib/toast-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login({ email: identifier, password });
      showToast({
        title: 'Authentication Successful',
        message: `Welcome back, ${user.name}. Role clearance: ${user.role}`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      showToast({
        title: 'Sign In Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <BrandLogo variant="full" size="xl" href="/" />
        </div>

        <Card className="shadow-elevated border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900">Healthcare Portal Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Sign in with your verified clinical or operational credentials
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="identifier">Email / Employee ID</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="admin@healthflow.demo or HF-EMP-1001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* DEMO ACCESS SECTION */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-700" /> Demo Access Credentials
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {/* ADMIN */}
                  <button
                    type="button"
                    onClick={() => handleDemoFill('admin@healthflow.demo', 'Admin@123')}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-teal-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">ADMIN</p>
                        <p className="text-[10px] text-slate-500">admin@healthflow.demo</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 group-hover:underline">Fill &rarr;</span>
                  </button>

                  {/* HOSPITAL MANAGER */}
                  <button
                    type="button"
                    onClick={() => handleDemoFill('manager@healthflow.demo', 'Manager@123')}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-blue-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">HOSPITAL MANAGER</p>
                        <p className="text-[10px] text-slate-500">manager@healthflow.demo</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 group-hover:underline">Fill &rarr;</span>
                  </button>

                  {/* SUPPLY MANAGER */}
                  <button
                    type="button"
                    onClick={() => handleDemoFill('supply@healthflow.demo', 'Supply@123')}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-amber-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">SUPPLY MANAGER</p>
                        <p className="text-[10px] text-slate-500">supply@healthflow.demo</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 group-hover:underline">Fill &rarr;</span>
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying with PostgreSQL...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-700" />
          Production Healthcare Authentication • End-to-End JWT RBAC
        </p>
      </div>
    </div>
  );
}
