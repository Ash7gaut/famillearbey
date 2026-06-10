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
}: TreePanZoomProps) {
  return (
    <div className="relative h-[min(70vh,680px)] overflow-hidden rounded-b-2xl bg-arbey-50/80 bg-[radial-gradient(circle_at_1px_1px,#d2d8c8_1px,transparent_0)] bg-[length:24px_24px]">
      <TransformWrapper
        key={viewKey}
        initialScale={initialScale}
        minScale={0.2}
        maxScale={2}
        centerOnInit
        limitToBounds={false}
        smooth={false}
        panning={{
          velocityDisabled: true,
          excluded: ['tree-member-card', 'tree-control'],
        }}
        wheel={{ step: 0.015 }}
        zoomAnimation={{
          disabled: false,
          size: 0.2,
          animationTime: 280,
          animationType: 'easeOut',
        }}
        doubleClick={{ disabled: true }}
      >
        <ZoomControls />
        <TransformComponent wrapperClass="!h-full !w-full" contentClass="!w-max !p-8">
          {children}
        </TransformComponent>
      </TransformWrapper>

      <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-arbey-200/80 bg-white/90 px-3 py-1.5 text-xs text-arbey-500 backdrop-blur-sm">
        Glisser pour naviguer · Molette pour zoomer
      </p>
    </div>
  );
}
