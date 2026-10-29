import { useEffect, useMemo, useRef, useState } from 'react';

interface RouletteWheelProps {
  names: string[];
  targetName: string;
  onComplete?: () => void;
}

const SEGMENT_COLORS = ['#dce3d4', '#c8d0b8', '#b4bea0', '#e8ebe3', '#d2d8c8'];

const SPIN_MS = 4500;

function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

export function RouletteWheel({ names, targetName, onComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [tickerName, setTickerName] = useState('');
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const segments = useMemo(() => (names.length > 0 ? names : [targetName]), [names, targetName]);
  const segmentAngle = 360 / segments.length;
  const targetIndex = Math.max(0, segments.indexOf(targetName));

  const finalRotation = useMemo(() => {
    const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
    return 6 * 360 + (360 - targetCenter);
  }, [targetIndex, segmentAngle]);

  const gradient = useMemo(
    () =>
      segments
        .map(
          (_, i) =>
            `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`,
        )
        .join(', '),
    [segments, segmentAngle],
  );

  useEffect(() => {
    const startFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRotation(finalRotation));
    });

    let tick = 0;
    const ticker = setInterval(() => {
      tick += 1;
      const progress = tick / (SPIN_MS / 90);
      if (progress > 0.85) {
        setTickerName(firstName(targetName));
      } else {
        setTickerName(firstName(segments[Math.floor(Math.random() * segments.length)]));
      }
    }, 90);

    const doneTimer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setDone(true);
      setTickerName(firstName(targetName));
      onComplete?.();
    }, SPIN_MS);

    return () => {
      cancelAnimationFrame(startFrame);
      clearInterval(ticker);
      clearTimeout(doneTimer);
    };
  }, [finalRotation, onComplete, segments, targetName]);

  return (
    <div className="flex flex-col items-center gap-6" data-testid="roulette-wheel">
      <div className="relative mx-auto w-[min(100%,17rem)]">
        {/* Flèche fixe en haut, pointe vers la roue */}
        <div
          className="absolute left-1/2 top-0 z-30 -translate-x-1/2"
          style={{ marginTop: '-2px' }}
          aria-hidden
        >
          <div className="flex flex-col items-center">
            <div className="h-3 w-6 rounded-t-full bg-warm-500 shadow-sm" />
            <div className="h-0 w-0 border-x-[11px] border-t-[18px] border-x-transparent border-t-warm-500 drop-shadow" />
          </div>
        </div>

        {/* Repère sur le bord de la roue (12h) */}
        <div
          className="absolute left-1/2 top-[10px] z-20 h-3 w-1 -translate-x-1/2 rounded-full bg-warm-600"
          aria-hidden
        />

        <div className="mt-5 rounded-full bg-arbey-200 p-3 shadow-xl">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.7, 0.05, 1)`,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(from -90deg, ${gradient})` }}
            />

            {segments.map((_, i) => {
              const angle = i * segmentAngle;
              return (
                <div
                  key={i}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom bg-arbey-400/40"
                  style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
                  aria-hidden
                />
              );
            })}

            <div className="absolute inset-[28%] z-10 flex items-center justify-center rounded-full border-4 border-cream-50 bg-cream-50 shadow-inner">
              <span
                data-testid="roulette-ticker"
                className={`px-2 text-center font-display text-lg font-bold text-arbey-900 transition-opacity sm:text-xl ${
                  done ? 'opacity-100' : 'opacity-90'
                }`}
              >
                {tickerName || firstName(segments[0])}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-arbey-500" data-testid="roulette-status">
        {done ? 'Et le gagnant est…' : 'La roulette tourne…'}
      </p>
    </div>
  );
}
