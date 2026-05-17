'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ProgressMetricProps {
  label: string;
  value: number; // 0 to 100
  info?: string;
  icon?: LucideIcon;
  className?: string;
}

export function ProgressMetric({ label, value, info, icon: Icon, className }: ProgressMetricProps) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex justify-between items-center text-sm font-medium text-zinc-700">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-[18px] text-zinc-500" />}
          {label}
        </span>
        {info && <span className="text-zinc-500 font-normal">{info}</span>}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-zinc-900 w-8">{percent}%</span>
        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
