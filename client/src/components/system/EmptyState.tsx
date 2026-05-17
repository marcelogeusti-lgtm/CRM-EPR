'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-zinc-200 border-dashed bg-white p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm"
    >
      <div className="size-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4 text-zinc-400">
        <Icon className="size-6" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </motion.div>
  );
}
