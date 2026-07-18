import { LucideIcon } from 'lucide-react';

interface EmptyInsightStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  minPoints?: number;
  currentPoints?: number;
}

export default function EmptyInsightState({
  icon: Icon,
  title,
  description,
  minPoints,
  currentPoints,
}: EmptyInsightStateProps) {
  const pct =
    minPoints && currentPoints !== undefined
      ? Math.min(100, Math.round((currentPoints / minPoints) * 100))
      : null;

  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-2xl"
      style={{ background: 'var(--bg-subtle)', border: '1.5px dashed var(--border)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full mb-3"
        style={{ background: 'var(--accent-blue-light)' }}
      >
        <Icon className="h-6 w-6" style={{ color: 'var(--accent-blue)' }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
      {pct !== null && minPoints && (
        <div className="mt-4 w-full max-w-[160px]">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>{currentPoints} / {minPoints} check-ins</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'var(--accent-blue)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
