/**
 * Pure, deterministic layered graph layout for ngx-vflow graphs.
 *
 * Nodes are arranged as a forest: roots have no incoming edge, traversal
 * assigns depths, and siblings stack along the cross axis centred under
 * their parent's span. Deeper levels recurse naturally.
 *
 * Determinism: results depend only on node/edge insertion order.
 */
export interface Positioned {
    readonly x: number;
    readonly y: number;
}

export interface LayoutNodeInput {
    readonly id: string;
}

export interface LayoutEdgeInput {
    readonly source: string;
    readonly target: string;
}

export interface GraphLayoutOptions {
    /** Direction of increasing depth: LR grows rightwards, TB downwards. */
    readonly orientation: 'LR' | 'TB';
    /** Distance between depth layers along the main axis. */
    readonly layerGap: number;
    /** Distance between neighbours along the cross axis. */
    readonly siblingGap: number;
    /** Layout origin (position of the first root). */
    readonly origin: Positioned;
    /**
     * Nodes placed one layer on the OPPOSITE side of their parent (depth −1),
     * e.g. MCP servers left of their agent in LR mode.
     */
    readonly inverseSideIds?: ReadonlySet<string>;
    /**
     * Nodes excluded from layering and pinned beside their single child —
     * LR: directly above it (e.g. the synthetic user node). Ignored in TB.
     */
    readonly pinnedIds?: ReadonlySet<string>;
    /** Cross-axis distance between a pinned node and its child. */
    readonly pinOffset?: number;
}

export function layoutGraph(
    nodes: readonly LayoutNodeInput[],
    edges: readonly LayoutEdgeInput[],
    options: GraphLayoutOptions,
): Map<string, Positioned> {
    const positions = new Map<string, Positioned>();
    const {orientation, layerGap, siblingGap, origin} = options;
    const pinOffset = options.pinOffset ?? 230;

    const ids: string[] = [];
    const idSet = new Set<string>();
    for (const node of nodes) {
        if (idSet.has(node.id)) continue;
        idSet.add(node.id);
        ids.push(node.id);
    }

    const inverse = new Set([...(options.inverseSideIds ?? [])].filter(id => idSet.has(id)));
    // Pinning is defined for LR only; elsewhere pinned nodes take part normally.
    const pinned = orientation === 'LR'
        ? new Set([...(options.pinnedIds ?? [])].filter(id => idSet.has(id)))
        : new Set<string>();

    // Forest assembly: edges touching pinned nodes are decorative, and the
    // first incoming edge wins, so shared nodes (one MCP serving many
    // sessions) get a single deterministic parent.
    const children = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const edge of edges) {
        if (edge.source === edge.target) continue;
        if (!idSet.has(edge.source) || !idSet.has(edge.target)) continue;
        if (pinned.has(edge.source) || pinned.has(edge.target)) continue;
        if (hasParent.has(edge.target)) continue;
        hasParent.add(edge.target);
        const siblings = children.get(edge.source);
        if (siblings) siblings.push(edge.target);
        else children.set(edge.source, [edge.target]);
    }

    // Depth assignment: roots have no parent; inverse-side children step back.
    const depth = new Map<string, number>();
    const roots = ids.filter(id => !pinned.has(id) && !hasParent.has(id));
    const queue = [...roots];
    for (const root of roots) depth.set(root, 0);
    for (let i = 0; i < queue.length; i++) {
        const parent = queue[i];
        const parentDepth = depth.get(parent)!;
        for (const child of children.get(parent) ?? []) {
            if (depth.has(child)) continue;
            depth.set(child, parentDepth + (inverse.has(child) ? -1 : 1));
            queue.push(child);
        }
    }

    // Tidy stacking: a leaf occupies one sibling slot; a parent spans its children.
    const span = new Map<string, number>();
    const measuring = new Set<string>();
    const measure = (id: string): number => {
        const known = span.get(id);
        if (known !== undefined) return known;
        if (measuring.has(id)) return siblingGap; // defensive: break hypothetical cycles
        measuring.add(id);
        const kids = children.get(id) ?? [];
        let size = siblingGap;
        if (kids.length > 0) {
            let total = 0;
            for (const kid of kids) total += measure(kid);
            size = Math.max(total + siblingGap * (kids.length - 1), siblingGap);
        }
        measuring.delete(id);
        span.set(id, size);
        return size;
    };

    const cross = new Map<string, number>();
    const place = (id: string, start: number): void => {
        const kids = children.get(id) ?? [];
        if (kids.length === 0) {
            cross.set(id, start + span.get(id)! / 2);
            return;
        }
        let cursor = start;
        for (const kid of kids) {
            place(kid, cursor);
            cursor += span.get(kid)! + siblingGap;
        }
        const first = kids[0];
        const last = kids[kids.length - 1];
        cross.set(id, (cross.get(first)! + cross.get(last)!) / 2);
    };

    const originMain = orientation === 'LR' ? origin.x : origin.y;
    const originCross = orientation === 'LR' ? origin.y : origin.x;

    let crossCursor = originCross;
    for (const root of roots) {
        measure(root);
        place(root, crossCursor);
        crossCursor += span.get(root)! + siblingGap;
    }

    const mainAxis = new Map<string, number>();
    let maxDepth = 0;
    for (const [id, d] of depth) {
        if (d > maxDepth) maxDepth = d;
        mainAxis.set(id, originMain + d * layerGap);
    }

    // Pinned nodes hug their first placed child (LR: directly above it).
    for (const id of ids) {
        if (!pinned.has(id)) continue;
        const child = edges.find(e =>
            e.source === id
            && idSet.has(e.target)
            && mainAxis.has(e.target)
        )?.target;
        if (child === undefined) continue;
        cross.set(id, cross.get(child)! - pinOffset);
        mainAxis.set(id, mainAxis.get(child)!);
    }

    // Orphan fallback: nodes unreachable from any root (including childless
    // pins and edge-less nodes such as info nodes) keep a sane slot past the
    // laid-out content instead of collapsing onto the origin.
    const orphanMain = originMain + (maxDepth + 1) * layerGap;
    for (const id of ids) {
        if (mainAxis.has(id)) continue;
        cross.set(id, crossCursor);
        mainAxis.set(id, orphanMain);
        crossCursor += siblingGap;
    }

    for (const id of ids) {
        const main = mainAxis.get(id);
        const crossPosition = cross.get(id);
        if (main === undefined || crossPosition === undefined) continue;
        positions.set(id, orientation === 'LR' ? {x: main, y: crossPosition} : {x: crossPosition, y: main});
    }
    return positions;
}
