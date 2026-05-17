'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isUp: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-zinc-600">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100 transition-colors">
            <Icon className="size-[18px] text-zinc-500" />
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-4xl font-bold text-zinc-900 tracking-tight leading-none mb-2 group-hover:scale-[1.02] transition-transform origin-left">
          {value}
        </h3>
        
        <div className="flex items-center gap-2 mt-auto">
          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              trend.isUp 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-red-50 text-red-600 border-red-100"
            )}>
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-400 font-medium">{description}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
