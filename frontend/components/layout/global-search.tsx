'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Package, ArrowLeftRight, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { facilitiesApi } from '../../services/facilitiesApi';
import { resourcesApi } from '../../services/resourcesApi';
import { alertsApi } from '../../services/alertsApi';
import { transfersApi } from '../../services/transfersApi';
import { Dialog, DialogContent } from '../ui/dialog';
import { Badge } from '../ui/badge';

interface SearchResult {
  id: string;
  type: 'facility' | 'resource' | 'transfer' | 'alert';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const q = query.toLowerCase();
        const [facilities, resources, alerts, transfers] = await Promise.allSettled([
          facilitiesApi.getFacilities(),
          resourcesApi.getResources(),
          alertsApi.getAlerts(),
          transfersApi.getTransfers(),
        ]);

        const combined: SearchResult[] = [];

        if (facilities.status === 'fulfilled') {
          facilities.value
            .filter((f) => f.name.toLowerCase().includes(q) || f.district.toLowerCase().includes(q))
            .slice(0, 4)
            .forEach((f) => {
              combined.push({
                id: f.id,
                type: 'facility',
                title: f.name,
                subtitle: `${f.type} • ${f.district}, ${f.state}`,
                href: `/admin/facilities/${f.id}`,
                badge: f.status,
              });
            });
        }

        if (resources.status === 'fulfilled') {
          resources.value
            .filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((r) => {
              combined.push({
                id: r.id,
                type: 'resource',
                title: r.name,
                subtitle: `Category: ${r.category} • Unit: ${r.unit}`,
                href: `/admin/inventory`,
                badge: r.category,
              });
            });
        }

        if (alerts.status === 'fulfilled') {
          alerts.value
            .filter((a) => a.title.toLowerCase().includes(q) || a.severity.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((a) => {
              combined.push({
                id: a.id,
                type: 'alert',
                title: a.title,
                subtitle: a.message,
                href: `/admin/alerts`,
                badge: a.severity,
              });
            });
        }

        if (transfers.status === 'fulfilled') {
          transfers.value
            .filter((t) => t.id.toLowerCase().includes(q) || t.status.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((t) => {
              combined.push({
                id: t.id,
                type: 'transfer',
                title: `Transfer #${t.id.slice(0, 8)}`,
                subtitle: `${t.resource?.name || 'Resource'} (${t.quantity} units) • ${t.status}`,
                href: `/admin/transfers`,
                badge: t.status,
              });
            });
        }

        setResults(combined);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'facility':
        return <Building2 className="h-4 w-4 text-teal-600" />;
      case 'resource':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-amber-600" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-slate-200">
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search facilities, medicines, transfers, alerts..."
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {isLoading && (
            <div className="p-6 text-center text-xs text-slate-500">Searching clinical intelligence network...</div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No facilities, inventory items, or active records match &ldquo;{query}&rdquo;
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.href)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</p>
                      <p className="text-xs text-slate-500 leading-snug">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-700 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type at least 2 characters to search across live database records
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
