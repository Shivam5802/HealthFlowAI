import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: 'HealthFlow AI — Predict. Prevent. Protect.',
  description:
    'AI-Powered Healthcare Resource Intelligence Platform for Demand Forecasting, Stockout Prevention, and Clinical Resource Reallocation',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-teal-100 selection:text-teal-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
