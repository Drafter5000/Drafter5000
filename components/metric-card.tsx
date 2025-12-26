'use client';

import { Win95Badge } from '@/components/win95';
import { LucideIcon } from 'lucide-react';

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  trend?: TrendData;
}

export function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="win95-raised p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold">{title}</span>
        <div className="win95-sunken p-1">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-[24px] font-bold mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--win95-button-shadow)]">{description}</span>
        {trend && (
          <Win95Badge variant={trend.isPositive ? 'default' : 'secondary'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </Win95Badge>
        )}
      </div>
    </div>
  );
}
