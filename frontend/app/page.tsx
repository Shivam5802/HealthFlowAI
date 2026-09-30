'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  Building2,
  Share2,
  TrendingUp,
  Package,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Bot,
  BarChart3,
  Menu,
  X,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Target,
  ArrowUpRight,
  FileText,
  AlertCircle,
  Truck,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { BrandLogo } from '../components/ui/brand-logo';

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'HOSPITAL_MANAGER') return '/manager/dashboard';
    return '/supply/dashboard';
  };

  const sampleQuestions = [
    {
      q: 'Which facility is at highest risk?',
      a: 'PHC Bakshi Ka Talab is currently classified as CRITICAL. Medicine X stock is at 150 units with a daily burn rate of 75 units, leaving approximately 2.0 days of supply before stockout.',
    },
    {
      q: 'Which resources may run out soon?',
      a: 'Across your district network, Medicine X (Paracetamol 500mg) and Normal Saline 500ml are tracking below their respective safety stock thresholds at 3 primary health centres.',
    },
    {
      q: 'Where is surplus inventory?',
      a: 'District General Hospital Lucknow currently holds 850 units of Medicine X against an average daily consumption of 50 units (approx. 17 days of supply), providing a feasible surplus of up to 400 units.',
    },
    {
      q: 'Show active transfers.',
      a: 'There are currently 4 active transfers in the district: 2 in APPROVED status pending vehicle dispatch, 1 in IN_TRANSIT (ETA 2.5 hrs), and 1 newly DELIVERED awaiting inventory reconciliation.',
    },
    {
      q: 'Why is this facility high risk?',
      a: 'PHC Bakshi Ka Talab experienced a 42% surge in outpatient viral fever cases over the last 72 hours, causing daily consumption to accelerate from 45 to 75 units/day while stock remained static.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900 scroll-smooth">
      {/* ==================================================
          NAVBAR
      ================================================== */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <BrandLogo variant="horizontal" size="sm" href="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Main Navigation">
            <a
              href="#"
              className="relative text-teal-800 font-semibold py-1 after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2.5px] after:bg-teal-600 after:rounded-full"
            >
              Home
            </a>
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-teal-600 transition-colors">
              Features
            </a>
            <a href="#platform" className="hover:text-teal-600 transition-colors">
              Platform Preview
            </a>
            <a href="#roles" className="hover:text-teal-600 transition-colors">
              Workspaces
            </a>
            <a href="#panda" className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Panda AI
            </a>
          </nav>

          {/* Right Action */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href={getDashboardRoute()}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all"
              >
                Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-lg bg-[#111c2e] text-white hover:bg-[#1b2b44] shadow-sm transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-teal-700 bg-teal-50/60 rounded-md"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Features
            </a>
            <a
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Platform Preview
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Workspaces
            </a>
            <a
              href="#panda"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Panda AI
            </a>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-base font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
              >
                Login to Platform
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          HERO SECTION (Matching Reference Image)
      ================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 bg-[#fbfcfd]">
        {/* Subtle atmospheric teal background glow behind artwork */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-gradient-to-l from-teal-50/80 via-cyan-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Ambient floating medical cross motifs in background */}
        <div className="absolute right-12 top-16 text-teal-600/15 pointer-events-none select-none text-2xl font-light">
          +
        </div>
        <div className="absolute right-8 bottom-16 text-teal-600/15 pointer-events-none select-none text-3xl font-light">
          +
        </div>
        <div className="absolute right-[46%] top-12 text-teal-600/10 pointer-events-none select-none text-xl font-light">
          +
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            {/* Left Column (50-55%) */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dcf5ef] border border-[#b8ebe1] text-[#008f75] text-[11px] font-bold uppercase tracking-wider">
                <svg className="h-3.5 w-3.5 text-[#008f75]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                </svg>
                Healthcare Resource Intelligence
              </div>

              {/* Main Heading & Tagline */}
              <div>
                <h1 className="text-[clamp(1.85rem,6.2vw,4.75rem)] font-black tracking-tight text-[#0f172a] leading-[1.05] whitespace-nowrap">
                  HEALTHFLOW <span className="text-[#00a884]">AI</span>
                </h1>
                <p className="text-[clamp(1.15rem,3.6vw,2.5rem)] font-bold text-[#334155] tracking-tight mt-2 sm:mt-3 whitespace-nowrap">
                  &ldquo;Predict. Prevent. Protect.&rdquo;
                </p>
              </div>

              {/* Product Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Predict healthcare resource shortages before they become critical. HealthFlow AI
                connects facility inventory, demand trends, risk intelligence, and resource
                redistribution in one platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#009b7c] hover:bg-[#00876c] text-white font-semibold text-base shadow-sm transition-all hover:scale-[1.01]"
                >
                  Explore the Platform <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-base hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                >
                  Login to Portal <ArrowRight className="ml-2 h-4 w-4 text-slate-500" />
                </Link>
              </div>

              {/* Three Feature Indicators */}
              <div className="pt-6 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#009b7c]" />
                  <span>Facility-Level Visibility</span>
                </span>
                <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#009b7c]" />
                  <span>Granular AI Decisions</span>
                </span>
                <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#009b7c]" />
                  <span>Role-Based Security</span>
                </span>
              </div>
            </div>

            {/* Right Artwork (45-50% width, seamlessly blended into background) */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-2xl select-none pointer-events-none mt-8 lg:mt-0">
                <Image
                  src="/hero-network-blended.png"
                  alt="HealthFlow AI Connected Healthcare Network"
                  width={1118}
                  height={858}
                  priority
                  className="w-full h-auto object-contain [mask-image:linear-gradient(to_right,transparent,black_10%,black)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          PROBLEM SECTION
      ================================================== */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              The Healthcare Resource Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              When Resources Don&rsquo;t Reach Where They&rsquo;re Needed
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Healthcare facilities frequently face stockouts while neighboring facilities hold unused
              surplus. Traditional inventory monitoring identifies shortages only after they become urgent,
              leaving coordinators with little time to respond.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-12">
            {[
              {
                title: 'Delayed Response',
                desc: 'Requests are raised reactively after shelves are empty, creating critical gaps in care.',
                icon: Clock,
              },
              {
                title: 'Critical Stockouts',
                desc: 'Essential pharmaceuticals and consumables run dry during unexpected patient influxes.',
                icon: AlertCircle,
              },
              {
                title: 'Inefficient Distribution',
                desc: 'Supplies sit idle in tertiary storage while peripheral community clinics exhaust reserves.',
                icon: Share2,
              },
              {
                title: 'Operational Pressure',
                desc: 'Clinical staff spend valuable medical hours frantically locating emergency supplies.',
                icon: AlertTriangle,
              },
              {
                title: 'Avoidable Waste',
                desc: 'Surplus stockpiles expire in storage rooms because excess is not systematically redistributed.',
                icon: Package,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                  <item.icon className="h-5 w-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          SOLUTION SECTION (5 CONNECTED STEPS)
      ================================================== */}
      <section id="solution" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Closed-Loop Coordination
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One Intelligence Layer Across Your Healthcare Network
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              HealthFlow AI connects five essential operational capabilities into a continuous,
              proactive workflow that stabilizes community healthcare supply chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-14">
            {[
              {
                step: '01',
                title: 'MONITOR',
                desc: 'Track physical inventory, consumption velocity, facility capacity, and outpatient footfalls in real time.',
                badge: 'Live Ledger',
              },
              {
                step: '02',
                title: 'PREDICT',
                desc: 'Leverage historical demand and time-series analytics to project precise stockout horizons.',
                badge: 'AI Forecasting',
              },
              {
                step: '03',
                title: 'ALERT',
                desc: 'Automatically flag high-risk resources and facilities before emergency thresholds are breached.',
                badge: 'Prioritized Feeds',
              },
              {
                step: '04',
                title: 'RECOMMEND',
                desc: 'Algorithmically match facilities facing shortages with nearby institutions holding safe surplus.',
                badge: 'Smart Matching',
              },
              {
                step: '05',
                title: 'TRANSFER',
                desc: 'Coordinate inter-facility transfers from request to delivery with automated inventory reconciliation.',
                badge: 'Finite State Machine',
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-teal-600/40">{step.step}</span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {step.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          KEY FEATURES SECTION (8 CARDS)
      ================================================== */}
      <section id="features" className="py-16 md:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Smarter Healthcare Resource Management
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Purpose-built tools designed to support regional healthcare authorities, hospital directors,
              and district logistics coordinators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {[
              {
                title: 'AI Demand Prediction',
                desc: 'Identify changing patient-demand patterns and anticipate resource requirements.',
                icon: TrendingUp,
              },
              {
                title: 'Inventory Intelligence',
                desc: 'Understand available stock, consumption rates, safety stock, and estimated days remaining.',
                icon: Package,
              },
              {
                title: 'Risk Detection',
                desc: 'Surface facilities and resources that may require attention before shortages become critical.',
                icon: AlertTriangle,
              },
              {
                title: 'Smart Redistribution',
                desc: 'Identify surplus resources that could help facilities facing shortages.',
                icon: Share2,
              },
              {
                title: 'Transfer Management',
                desc: 'Track resource movement from request through delivery with role-enforced state transitions.',
                icon: Truck,
              },
              {
                title: 'Real-Time Alerts',
                desc: 'Keep teams informed about critical inventory and demand conditions with multi-severity feeds.',
                icon: Activity,
              },
              {
                title: 'Analytics & Reports',
                desc: 'Understand facility performance, resource risk, demand trends, and transfer activity over time.',
                icon: BarChart3,
              },
              {
                title: 'HealthFlow Panda',
                desc: 'Ask questions about your network using a conversational AI assistant connected to platform data.',
                icon: Bot,
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-white hover:shadow-md transition-all space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          PLATFORM PREVIEW SECTION (SYNTHETIC DATA DASHBOARD)
      ================================================== */}
      <section id="platform" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Interactive Architecture Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              See Your Healthcare Network at a Glance
            </h2>
            <p className="text-sm font-semibold text-teal-700">
              Demo Dashboard — Synthetic Data
            </p>
          </div>

          {/* Representative Preview Mockup */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-8">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Facilities', value: '25', desc: 'Hospitals & PHCs', color: 'text-slate-900' },
                { label: 'High-Risk Facilities', value: '3', desc: 'Action required', color: 'text-rose-600' },
                { label: 'Critical Resources', value: '2', desc: '< 3 days of supply', color: 'text-amber-600' },
                { label: 'Open Alerts', value: '8', desc: '2 critical severity', color: 'text-indigo-600' },
                { label: 'Active Transfers', value: '4', desc: 'In logistical transit', color: 'text-teal-600' },
              ].map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-500 block">{m.label}</span>
                  <span className={`text-2xl font-black mt-1 block ${m.color}`}>{m.value}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{m.desc}</span>
                </div>
              ))}
            </div>

            {/* Split Panel: Table & Workflow Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Inventory Risk Table Preview */}
              <div className="lg:col-span-7 rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-800">Inventory Velocity & Risk Tiers</h4>
                  <span className="text-[11px] text-slate-400">Calculated: daysRemaining = quantity / dailyConsumption</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="py-2">Facility</th>
                        <th className="py-2">Resource</th>
                        <th className="py-2 text-right">Stock</th>
                        <th className="py-2 text-right">Burn Rate</th>
                        <th className="py-2 text-center">Supply Horizon</th>
                        <th className="py-2 text-right">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2.5 font-medium">PHC Bakshi Ka Talab</td>
                        <td className="py-2.5">Medicine X (500mg)</td>
                        <td className="py-2.5 text-right font-bold text-rose-600">150</td>
                        <td className="py-2.5 text-right">75/day</td>
                        <td className="py-2.5 text-center font-bold text-rose-600">~2.0 days</td>
                        <td className="py-2.5 text-right">
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            CRITICAL
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium">District General Hosp.</td>
                        <td className="py-2.5">Medicine X (500mg)</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">850</td>
                        <td className="py-2.5 text-right">50/day</td>
                        <td className="py-2.5 text-center font-bold text-emerald-600">~17.0 days</td>
                        <td className="py-2.5 text-right">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            HEALTHY (SURPLUS)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium">CHC Malihabad</td>
                        <td className="py-2.5">Normal Saline 500ml</td>
                        <td className="py-2.5 text-right font-bold text-amber-600">320</td>
                        <td className="py-2.5 text-right">80/day</td>
                        <td className="py-2.5 text-center font-bold text-amber-600">~4.0 days</td>
                        <td className="py-2.5 text-right">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            WARNING
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Active Transfer Lifecycle Preview */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-800">Transfer State Machine</h4>
                  <span className="text-[11px] text-teal-600 font-semibold">Strict Lifecycle</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Transfer #HF-TR-1082</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        IN_TRANSIT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>300 units</strong> Medicine X &bull; District Gen. Hosp. &rarr; PHC Bakshi Ka Talab
                    </p>
                    {/* Visual Stepper */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 font-medium">
                      <span className="text-teal-600 font-bold">REQUESTED</span> &rarr;
                      <span className="text-teal-600 font-bold">APPROVED</span> &rarr;
                      <span className="text-teal-600 font-bold">PACKED</span> &rarr;
                      <span className="text-amber-600 font-bold">IN_TRANSIT</span> &rarr;
                      <span className="text-slate-400">DELIVERED</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/80 space-y-1 text-xs text-teal-900">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Automated Inventory Reconciliation
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Upon arrival confirmation, source inventory is deducted and recipient stock is credited with zero manual record discrepancy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS (5 STEPS)
      ================================================== */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Operational Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Risk Detection to Resource Movement
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              How health systems transform fragmented facility records into proactive redistribution action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-14">
            {[
              {
                num: '01',
                title: 'Connect',
                desc: 'Facility inventory levels and patient demand footfalls enter the platform securely.',
                icon: Layers,
              },
              {
                num: '02',
                title: 'Analyze',
                desc: 'HealthFlow AI calculates dynamic burn rates, safety stock buffers, and variances.',
                icon: Activity,
              },
              {
                num: '03',
                title: 'Predict',
                desc: 'Time-series models forecast potential shortages and demand surges days in advance.',
                icon: TrendingUp,
              },
              {
                num: '04',
                title: 'Recommend',
                desc: 'The algorithm pairs facilities at risk with institutions holding verified surplus.',
                icon: Share2,
              },
              {
                num: '05',
                title: 'Act',
                desc: 'Authorized supply coordinators approve, dispatch, and track the transfer to delivery.',
                icon: Truck,
              },
            ].map((step, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {step.num}
                  </div>
                  <step.icon className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          ROLES SECTION (3 ROLES)
      ================================================== */}
      <section id="roles" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Role-Based Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for Every Operational Layer
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Tailored workspaces with strict server-side facility isolation and access controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            {/* ADMIN */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-lg transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full">
                  GLOBAL SCOPE
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">ADMIN</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor the entire healthcare network, facilities, risks, reports, resources, and users.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> District-wide facility registry
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Algorithmic redistribution oversight
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Employee onboarding & audit trails
                </li>
              </ul>
            </div>

            {/* HOSPITAL MANAGER */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-full">
                  FACILITY ISOLATED
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">HOSPITAL MANAGER</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor your facility, update inventory, review alerts, and request resources.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Local physical stock ledgers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Anti-IDOR: peer facility data blocked
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Emergency requisition dispatch
                </li>
              </ul>
            </div>

            {/* SUPPLY MANAGER */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                  <Share2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">
                  LOGISTICS SCOPE
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">SUPPLY MANAGER</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Coordinate resource availability, requests, redistribution, and transfers.
              </p>
              <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" /> Cross-facility surplus review
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" /> Transfer authorization & dispatch
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" /> Delivery confirmation & tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          HEALTHFLOW PANDA SECTION
      ================================================== */}
      <section id="panda" className="py-16 md:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <Bot className="h-4 w-4 text-teal-600" />
              Grounded Conversational Intelligence
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Ask Your Healthcare Network
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              HealthFlow Panda helps authorized users understand what&rsquo;s happening across their
              healthcare network through natural-language questions grounded in live platform data.
            </p>
          </div>

          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span>Select an example query to preview Panda&rsquo;s grounded response:</span>
            </div>

            {/* Question Pills */}
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveQuestion(idx)}
                  className={`text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                    activeQuestion === idx
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-400'
                  }`}
                >
                  &ldquo;{item.q}&rdquo;
                </button>
              ))}
            </div>

            {/* Answer Display */}
            <div className="rounded-xl border border-teal-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-teal-600" /> HealthFlow Panda Response
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Grounded in Live DB
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {sampleQuestions[activeQuestion].a}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Zero hallucinated facts &bull; Synthesized directly from PostgreSQL inventory and patient demand records.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          IMPACT / VALUE SECTION
      ================================================== */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-900/60 px-3 py-1 rounded-full border border-teal-700">
              Operational Value
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Transforming Healthcare Supply Resilience
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Moving health systems from reactive firefighting to continuous proactive preparedness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {[
              {
                headline: 'See risk earlier.',
                detail: 'Anticipate shortages days before patient care is impacted.',
              },
              {
                headline: 'Understand demand better.',
                detail: 'Detect patient footfall surges and consumption spikes in real time.',
              },
              {
                headline: 'Move resources smarter.',
                detail: 'Leverage algorithmic surplus matching to prevent stock expiration and waste.',
              },
              {
                headline: 'Coordinate response faster.',
                detail: 'Streamline authorization through role-enforced logistical workflows.',
              },
            ].map((v, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2"
              >
                <div className="h-2 w-8 bg-teal-500 rounded-full mb-3" />
                <h3 className="text-xl font-extrabold text-white tracking-tight">{v.headline}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{v.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          TRUST / DATA DISCLAIMER
      ================================================== */}
      <section className="py-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-xs text-slate-500 leading-relaxed">
            <p>
              <strong>Notice:</strong> HEALTHFLOW AI is a healthcare resource intelligence and operational
              coordination platform. Current demonstration data is synthetic and intended for hackathon/demo
              purposes. The platform supports logistical and supply coordination and does not replace medical
              practitioners or clinical diagnosis.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          FINAL CTA SECTION
      ================================================== */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Turn Healthcare Data Into Action
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            See how HealthFlow AI helps teams predict risk, coordinate resources, and respond before
            shortages become critical.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-base hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
            >
              Explore the Platform
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-base hover:bg-slate-800 shadow-sm transition-all"
            >
              Login <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <BrandLogo variant="horizontal" size="md" theme="dark" href="/" />

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-400">
              <a href="#" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#platform" className="hover:text-white transition-colors">
                Platform
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Login
              </Link>
            </div>

            {/* Tag */}
            <div className="text-xs text-slate-400 text-center md:text-right">
              <p>Demo platform &bull; Synthetic data</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Built for Community Healthcare Intelligence</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
