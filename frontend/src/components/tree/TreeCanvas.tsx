import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Minus, Plus, Scan } from 'lucide-react';
import type { FamilyMember } from '../../types';
import { CARD_H, CARD_W } from './treeLayout';
import type { TreeLayout } from './treeLayout';
import { TreeNodeCard } from './TreeNodeCard';

const MIN_K = 0.15;
const MAX_K = 2.5;
const FIT_PADDING = 40;
/** En dessous, l'arbre entier serait illisible : on zoome plutôt sur la première racine. */
const MIN_READABLE_K = 0.7;
/** Zoom de départ quand l'arbre ne tient pas : texte des cartes ≥ ~11px effectifs. */
const READABLE_START_K = 0.85;
const DRAG_THRESHOLD = 5;
const DOT_SPACING = 24;

interface View {
  x: number;
  y: number;
  k: number;
}

export interface TreeFocusRequest {
  id: string;
  nonce: number;
}

interface TreeCanvasProps {
  layout: TreeLayout;
  focus: TreeFocusRequest | null;
  /** Membre sur lequel centrer la vue quand l'arbre entier ne tient pas lisiblement. */
  rootId?: string;
  highlightedId: string | null;
  onSelectMember: (member: FamilyMember) => void;
}

const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));

const controlClass =
  'focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-700 shadow-warm transition hover:bg-warm-50 active:scale-95';

export function TreeCanvas({ layout, focus, rootId, highlightedId, onSelectMember }: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef(size);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  const [animate, setAnimate] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const downPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const handledFocus = useRef(-1);

  const apply = useCallback((next: View, animated = false) => {
    viewRef.current = next;
    setAnimate(animated);
    setView(next);
  }, []);

  const zoomAt = useCallback(
    (px: number, py: number, factor: number, animated = false) => {
      const v = viewRef.current;
      const k = clampK(v.k * factor);
      const ratio = k / v.k;
      apply({ x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio, k }, animated);
    },
    [apply],
  );

  const fit = useCallback(
    (animated: boolean) => {
      const { w, h } = sizeRef.current;
      if (!w || !h || layout.nodes.length === 0) return;
      const fitK = Math.min(
        (w - FIT_PADDING * 2) / layout.width,
        (h - FIT_PADDING * 2) / layout.height,
        1,
      );
      if (fitK >= MIN_READABLE_K) {
        apply(
          { k: fitK, x: (w - layout.width * fitK) / 2, y: (h - layout.height * fitK) / 2 },
          animated,
        );
      } else {
        // Zoom lisible centré sur la première racine ; navigation au pan (idem pour « Recentrer »).
        const first = (rootId && layout.nodeById.get(rootId)) || layout.nodes[0];
        const k = READABLE_START_K;
        apply({ k, x: w / 2 - (first.x + CARD_W / 2) * k, y: FIT_PADDING / 2 }, animated);
      }
    },
    [layout, rootId, apply],
  );

  // Taille du conteneur
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const next = { w: el.clientWidth, h: el.clientHeight };
      sizeRef.current = next;
      setSize(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ajustement initial (nouvelle disposition ou première mesure du conteneur)
  const ready = size.w > 0 && size.h > 0;
  useEffect(() => {
    if (ready) fit(false);
  }, [fit, ready]);

  // Recentrage sur un membre (recherche)
  useEffect(() => {
    if (!focus || focus.nonce === handledFocus.current) return;
    const node = layout.nodeById.get(focus.id);
    if (!node || !sizeRef.current.w) return;
    handledFocus.current = focus.nonce;
    const k = Math.min(1.5, Math.max(viewRef.current.k, 0.85));
    apply(
      {
        k,
        x: sizeRef.current.w / 2 - (node.x + CARD_W / 2) * k,
        y: sizeRef.current.h / 2 - (node.y + CARD_H / 2) * k,
      },
      true,
    );
  }, [focus, layout, ready, apply]);

  // Molette : zoom autour du curseur (écouteur non passif pour bloquer le scroll de page)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const local = (e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pointers.current.size === 0) moved.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downPos.current = { x: e.clientX, y: e.clientY };
    setAnimate(false);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };

    if (pointers.current.size === 1) {
      if (!moved.current) {
        if (Math.hypot(cur.x - downPos.current.x, cur.y - downPos.current.y) < DRAG_THRESHOLD) return;
        moved.current = true;
        // Capture seulement une fois le glissement engagé, pour ne pas voler le clic des cartes.
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      const v = viewRef.current;
      apply({ ...v, x: v.x + cur.x - prev.x, y: v.y + cur.y - prev.y });
      pointers.current.set(e.pointerId, cur);
      return;
    }

    if (pointers.current.size === 2) {
      const others = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1];
      const oldCenter = { x: (prev.x + others.x) / 2, y: (prev.y + others.y) / 2 };
      const newCenter = { x: (cur.x + others.x) / 2, y: (cur.y + others.y) / 2 };
      const oldDist = Math.hypot(prev.x - others.x, prev.y - others.y);
      const newDist = Math.hypot(cur.x - others.x, cur.y - others.y);
      moved.current = true;
      const v = viewRef.current;
      apply({ ...v, x: v.x + newCenter.x - oldCenter.x, y: v.y + newCenter.y - oldCenter.y });
      if (oldDist > 0) {
        const c = local({ clientX: newCenter.x, clientY: newCenter.y });
        zoomAt(c.x, c.y, newDist / oldDist);
      }
      pointers.current.set(e.pointerId, cur);
    }
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
  };

  const onClickCapture = (e: ReactMouseEvent) => {
    if (moved.current) {
      e.stopPropagation();
      e.preventDefault();
      moved.current = false;
    }
  };

  const zoomFromCenter = (factor: number) =>
    zoomAt(sizeRef.current.w / 2, sizeRef.current.h / 2, factor, true);

  return (
    <div
      ref={containerRef}
      data-testid="tree-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      style={{
        backgroundImage: 'radial-gradient(rgb(var(--cream-400)) 1.2px, transparent 1.2px)',
        backgroundSize: `${DOT_SPACING * view.k}px ${DOT_SPACING * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
      className="relative h-[calc(100dvh-26rem-env(safe-area-inset-bottom))] min-h-[300px] cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-cream-300 bg-cream-100 active:cursor-grabbing sm:h-[calc(100dvh-22rem-env(safe-area-inset-bottom))] sm:min-h-[360px] lg:h-[calc(100dvh-17rem)] lg:min-h-[420px]"
    >
      <div
        data-testid="tree-viewport"
        data-zoom={view.k.toFixed(3)}
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: animate ? 'transform 300ms ease' : 'none',
        }}
        className="absolute left-0 top-0 will-change-transform"
      >
        <svg
          data-testid="tree-connectors"
          width={layout.width}
          height={layout.height}
          fill="none"
          strokeLinecap="round"
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
        >
          {layout.edges.map((edge) => (
            <path
              key={edge.key}
              d={edge.d}
              strokeWidth={edge.kind === 'couple' ? 3 : 2}
              className={edge.kind === 'couple' ? 'stroke-warm-500' : 'stroke-ink-500'}
            />
          ))}
        </svg>
        {layout.nodes.map((node) => (
          <TreeNodeCard
            key={node.member.id}
            member={node.member}
            x={node.x}
            y={node.y}
            highlighted={node.member.id === highlightedId}
            onSelect={onSelectMember}
          />
        ))}
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-2" data-testid="tree-controls">
        <button
          type="button"
          data-testid="tree-zoom-in-button"
          aria-label="Zoomer"
          onClick={() => zoomFromCenter(1.25)}
          className={controlClass}
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          data-testid="tree-zoom-out-button"
          aria-label="Dézoomer"
          onClick={() => zoomFromCenter(0.8)}
          className={controlClass}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          data-testid="tree-zoom-reset-button"
          aria-label="Recentrer l'arbre"
          onClick={() => fit(true)}
          className={controlClass}
        >
          <Scan className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
