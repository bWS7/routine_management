import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function ProgressBar({ value = 0, color = 'bg-primary-600', className = '' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 rounded-full bg-gray-100 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, iconBg = 'bg-primary-50', iconColor = 'text-primary-600', valueColor = 'text-gray-900', trend, className = '' }) {
  const [displayed, setDisplayed] = useState(0);
  const isNumber = typeof value === 'number';
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isNumber) return;
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, isNumber]);

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>
            {isNumber ? displayed : value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 ml-4 p-2.5 rounded-xl ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3">
          <ProgressBar value={trend} />
          <p className="text-xs text-gray-400 mt-1">{trend}% do período</p>
        </div>
      )}
    </div>
  );
}
