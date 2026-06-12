import type { ReactNode } from 'react';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

interface TreePanZoomProps {
  children: ReactNode;
  initialScale?: number;
  viewKey?: string;
  heightClass?: string;
  contentClass?: string;
  panExcluded?: string[];
  showHint?: boolean;
  /** Molette : zoom plus réactif quand true (step adapté au delta). */
  smooth?: boolean;
  wheelStep?: number;
  /** Inertie après un glisser-déposer. */
  enablePanMomentum?: boolean;
  /** Défilement trackpad à deux doigts pour se déplacer. */
  enableTrackPadPanning?: boolean;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="tree-control absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-arbey-200 bg-white/95 p-1 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="tree-control flex h-8 w-8 items-center justify-center rounded-lg text-arbey-700 transition hover:bg-arbey-50"
        aria-label="Zoomer"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="tree-control flex h-8 w-8 items-center justify-center rounded-lg text-arbey-700 transition hover:bg-arbey-50"
        aria-label="Dézoomer"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className="tree-control flex h-8 w-8 items-center justify-center rounded-lg text-xs text-arbey-600 transition hover:bg-arbey-50"
        aria-label="Réinitialiser la vue"
        title="Réinitialiser"
      >
        ⌂
      </button>
    </div>
  );
}

export function TreePanZoom({
  children,
  initialScale = 0.85,
  viewKey = 'default',
  heightClass = 'h-[min(70vh,680px)]',
  contentClass = '!w-max !p-8',
  panExcluded = [],
  showHint = true,
  smooth = false,
  wheelStep = 0.015,
  enablePanMomentum = false,
  enableTrackPadPanning = false,
}: TreePanZoomProps) {
  const panExcludedClasses = ['tree-member-card', 'tree-control', ...panExcluded];

  return (
    <div
      className={`relative overflow-hidden rounded-b-2xl bg-arbey-50/80 bg-[radial-gradient(circle_at_1px_1px,#d2d8c8_1px,transparent_0)] bg-[length:24px_24px] ${heightClass}`}
    >
      <TransformWrapper
        key={viewKey}
        initialScale={initialScale}
        minScale={0.2}
        maxScale={2}
        centerOnInit
        limitToBounds={false}
        smooth={smooth}
        panning={{
          velocityDisabled: !enablePanMomentum,
          excluded: panExcludedClasses,
        }}
        trackPadPanning={{
          disabled: !enableTrackPadPanning,
          velocityDisabled: !enablePanMomentum,
          excluded: panExcludedClasses,
        }}
        wheel={{ step: wheelStep }}
        velocityAnimation={
          enablePanMomentum
            ? {
                sensitivityMouse: 1.35,
                sensitivityTouch: 1.5,
                maxStrengthMouse: 28,
                animationTime: 260,
              }
            : undefined
        }
        zoomAnimation={{
          disabled: false,
          size: 0.2,
          animationTime: smooth ? 180 : 280,
          animationType: 'easeOut',
        }}
        doubleClick={{ disabled: true }}
      >
        <ZoomControls />
        <TransformComponent wrapperClass="!h-full !w-full" contentClass={contentClass}>
          {children}
        </TransformComponent>
      </TransformWrapper>

      {showHint && (
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-arbey-200/80 bg-white/90 px-3 py-1.5 text-xs text-arbey-500 backdrop-blur-sm">
          Glisser pour naviguer · Molette pour zoomer
        </p>
      )}
    </div>
  );
}
