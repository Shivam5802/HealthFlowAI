import * as React from 'react';
import { cn } from '../../lib/utils';

export type StatusType = 'healthy' | 'warning' | 'critical' | 'info' | 'offline';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({ status, label, pulse = false, className }: StatusIndicatorProps) {
  const colorMap: Record<StatusType, { dot: string; text: string; ring: string }> = {
    healthy: { dot: 'bg-green-600', text: 'text-green-700', ring: 'bg-green-400' },
    warning: { dot: 'bg-amber-600', text: 'text-amber-700', ring: 'bg-amber-400' },
    critical: { dot: 'bg-red-600', text: 'text-red-700', ring: 'bg-red-400' },
    info: { dot: 'bg-blue-600', text: 'text-blue-700', ring: 'bg-blue-400' },
    offline: { dot: 'bg-slate-400', text: 'text-slate-600', ring: 'bg-slate-300' },
  };

  const current = colorMap[status] || colorMap.offline;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              current.ring
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', current.dot)} />
      </span>
      {label && <span className={cn('text-xs font-medium', current.text)}>{label}</span>}
    </div>
  );
}
