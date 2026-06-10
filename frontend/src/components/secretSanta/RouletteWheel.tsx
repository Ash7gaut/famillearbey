import { useEffect, useState } from 'react';

interface RouletteWheelProps {
  names: string[];
  targetName: string;
  onComplete?: () => void;
}

export function RouletteWheel({ names, targetName, onComplete }: RouletteWheelProps) {
  const [spinning, setSpinning] = useState(true);
  const [displayName, setDisplayName] = useState(names[0] ?? '');

  const segments = names.length > 0 ? names : [targetName];
  const segmentAngle = 360 / segments.length;
  const targetIndex = Math.max(0, segments.indexOf(targetName));
  const fullSpins = 4;
  const finalRotation = fullSpins * 360 + (360 - targetIndex * segmentAngle - segmentAngle / 2);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayName(segments[Math.floor(Math.random() * segments.length)]);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setSpinning(false);
      setDisplayName(targetName);
      onComplete?.();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [segments, targetName, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-arbey-200 bg-gradient-to-br from-warm-100 to-arbey-100 shadow-lg transition-transform duration-[2800ms] ease-out sm:h-52 sm:w-52"
          style={{
            transform: spinning ? `rotate(${finalRotation}deg)` : `rotate(${finalRotation}deg)`,
          }}
        >
          {segments.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="pointer-events-none absolute text-[9px] font-medium text-arbey-600 sm:text-[10px]"
              style={{
                transform: `rotate(${i * segmentAngle}deg) translateY(-68px)`,
              }}
            >
              {name.split(' ')[0]}
            </span>
          ))}
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-2xl text-warm-500">▼</div>
      </div>

      <div className="text-center">
        {spinning ? (
          <p className="animate-pulse text-sm text-arbey-500">La roulette tourne…</p>
        ) : (
          <>
            <p className="text-sm text-arbey-500">Tu offres à</p>
            <p className="font-display text-2xl font-bold text-arbey-900">{displayName}</p>
          </>
        )}
      </div>
    </div>
  );
}
