import type { FamilyMember } from '../../types';
import type { TreeUnit } from './treeModel';

export const CARD_W = 228;
export const CARD_H = 96;
const COUPLE_GAP = 40;
const SIBLING_GAP = 32;
const ROOT_GAP = 96;
const LEVEL_GAP = 76;
const CORNER = 14;

export interface LayoutNode {
  member: FamilyMember;
  x: number;
  y: number;
}

export interface LayoutEdge {
  key: string;
  kind: 'couple' | 'child';
  d: string;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  nodeById: Map<string, LayoutNode>;
  edges: LayoutEdge[];
  width: number;
  height: number;
}

interface Measured {
  unit: TreeUnit;
  chainW: number;
  /** Largeur de chaque bloc d'enfants (un par union) puis total. */
  blocks: Measured[][];
  childrenW: number;
  width: number;
}

const sumWidths = (items: Measured[]) =>
  items.reduce((acc, m) => acc + m.width, 0) + SIBLING_GAP * Math.max(0, items.length - 1);

function measure(unit: TreeUnit): Measured {
  const chainW = unit.chain.length * CARD_W + (unit.chain.length - 1) * COUPLE_GAP;
  const blocks = unit.unions.map((u) => u.children.map(measure));
  const nonEmpty = blocks.filter((b) => b.length > 0);
  const childrenW =
    nonEmpty.reduce((acc, b) => acc + sumWidths(b), 0) + SIBLING_GAP * Math.max(0, nonEmpty.length - 1);
  return { unit, chainW, blocks, childrenW, width: Math.max(chainW, childrenW) };
}

/** Connecteur orthogonal à coins arrondis : ancre → barre horizontale → haut de l'enfant. */
function childPath(ax: number, ay: number, cx: number, cy: number, barY: number) {
  if (Math.abs(cx - ax) < 0.5) return `M${ax} ${ay}V${cy}`;
  const s = cx > ax ? 1 : -1;
  const r = Math.min(CORNER, Math.abs(cx - ax) / 2, barY - ay, cy - barY);
  return `M${ax} ${ay}V${barY - r}Q${ax} ${barY} ${ax + s * r} ${barY}H${cx - s * r}Q${cx} ${barY} ${cx} ${barY + r}V${cy}`;
}

/** Layout par générations : couples côte à côte, enfants centrés sous leur couple. */
export function layoutTree(roots: TreeUnit[]): TreeLayout {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const nodeById = new Map<string, LayoutNode>();
  let maxDepth = 0;

  function place(m: Measured, x0: number, depth: number) {
    const { unit } = m;
    maxDepth = Math.max(maxDepth, depth);
    const y = depth * (CARD_H + LEVEL_GAP);
    const chainX = x0 + (m.width - m.chainW) / 2;

    const xOf = new Map<string, number>();
    unit.chain.forEach((member, i) => {
      const node = { member, x: chainX + i * (CARD_W + COUPLE_GAP), y };
      xOf.set(member.id, node.x);
      nodes.push(node);
      nodeById.set(member.id, node);
      if (i > 0) {
        const lx = node.x - COUPLE_GAP;
        edges.push({
          key: `couple-${unit.chain[i - 1].id}-${member.id}`,
          kind: 'couple',
          d: `M${lx} ${y + CARD_H / 2}H${node.x}`,
        });
      }
    });

    const barY = y + CARD_H + LEVEL_GAP / 2;
    let cursor = x0 + (m.width - m.childrenW) / 2;
    unit.unions.forEach((union, ui) => {
      const kids = m.blocks[ui];
      if (kids.length === 0) return;
      // Ancre : milieu du trait de couple, ou bas de la carte pour un parent seul.
      const [a, b] = union.parentIds;
      const ax = b
        ? (xOf.get(a)! + CARD_W + xOf.get(b)!) / 2
        : xOf.get(a)! + CARD_W / 2;
      const ay = b ? y + CARD_H / 2 : y + CARD_H;

      for (const kid of kids) {
        place(kid, cursor, depth + 1);
        const childNode = nodeById.get(kid.unit.mainId)!;
        edges.push({
          key: `child-${unit.mainId}-${kid.unit.mainId}`,
          kind: 'child',
          d: childPath(ax, ay, childNode.x + CARD_W / 2, childNode.y, barY),
        });
        cursor += kid.width + SIBLING_GAP;
      }
    });
  }

  let x = 0;
  for (const root of roots) {
    const m = measure(root);
    place(m, x, 0);
    x += m.width + ROOT_GAP;
  }

  const width = Math.max(0, x - ROOT_GAP);
  return { nodes, nodeById, edges, width, height: (maxDepth + 1) * CARD_H + maxDepth * LEVEL_GAP };
}
