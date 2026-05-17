'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
