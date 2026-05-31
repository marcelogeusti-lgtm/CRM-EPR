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
        "rounded-[8px] border border-[#27272a] bg-[#18181b] p-4 flex flex-col justify-between h-full group transition-colors duration-200 hover:border-[#3f3f46]",
        className
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-zinc-400">{title}</span>
        {Icon && (
          <Icon className="size-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        )}
      </div>
      
      <div>
        <h3 className="text-[22px] font-bold text-zinc-100 tracking-tight leading-none mb-1.5">
          {value}
        </h3>
        
        <div className="flex items-center gap-2 mt-auto">
          {trend && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
              trend.isUp 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-red-500/10 text-red-400"
            )}>
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-[10px] text-zinc-500 font-medium truncate">{description}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
