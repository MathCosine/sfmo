import { useEffect, useState } from 'react';

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function partsUntil(target: Date, now: Date): Parts | null {
  const ms = target.getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const seconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

const UNITS: Array<[keyof Parts, string]> = [
  ['days', 'days'],
  ['hours', 'hrs'],
  ['minutes', 'min'],
  ['seconds', 'sec'],
];

/** Ticks down to an ISO timestamp; renders `fallback` once it has passed. */
export function Countdown({ target, fallback }: { target: string; fallback: React.ReactNode }) {
  const targetDate = new Date(target);
  const [parts, setParts] = useState<Parts | null>(() => partsUntil(targetDate, new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setParts(partsUntil(new Date(target), new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!parts) return <>{fallback}</>;

  return (
    <div className="countdown" role="timer" aria-live="off">
      {UNITS.map(([key, label]) => (
        <div className="countdown__cell" key={key}>
          <span className="countdown__value">{String(parts[key]).padStart(2, '0')}</span>
          <span className="countdown__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
