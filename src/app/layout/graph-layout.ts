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

export type MacroNodeKind = 'anchor' | 'agent' | 'mcp';

export interface MacroLayoutOptions {
    readonly origin: Positioned;
    readonly anchorGap: number;
    readonly mcpGap: number;
    readonly mcpStackGap: number;
    readonly subGap: number;
    readonly groupGap: number;
}

export interface MicroLayoutOptions {
    readonly origin: Positioned;
    readonly layerGap: number;
    readonly rowGap: number;
    readonly colGap: number;
    readonly maxPerRow: number;
}

export function layoutMacroGraph(
    nodes: readonly LayoutNodeInput[],
    edges: readonly LayoutEdgeInput[],
    kinds: ReadonlyMap<string, MacroNodeKind>,
    options: MacroLayoutOptions,
): Map<string, Positioned> {
    const ids: string[] = [];
    const idSet = new Set<string>();
    for (const node of nodes) {
        if (idSet.has(node.id)) continue;
        idSet.add(node.id);
        ids.push(node.id);
    }

    const kindOf = (id: string): MacroNodeKind => kinds.get(id) ?? 'agent';

    const anchorOf = new Map<string, string>();
    const parentOf = new Map<string, string>();
    const mcpsOf = new Map<string, string[]>();

    for (const edge of edges) {
        if (edge.source === edge.target) continue;
        if (!idSet.has(edge.source) || !idSet.has(edge.target)) continue;

        if (kindOf(edge.source) === 'anchor') {
            if (!anchorOf.has(edge.target)) anchorOf.set(edge.target, edge.source);
            continue;
        }

        if (kindOf(edge.target) === 'mcp') {
            const bucket = mcpsOf.get(edge.source);
            if (bucket) {
                if (!bucket.includes(edge.target)) bucket.push(edge.target);
            } else {
                mcpsOf.set(edge.source, [edge.target]);
            }
            continue;
        }

        if (kindOf(edge.source) !== 'agent' || kindOf(edge.target) !== 'agent') continue;
        if (!parentOf.has(edge.target)) parentOf.set(edge.target, edge.source);
    }

    for (const group of anchorOf.keys()) parentOf.delete(group);

    const childrenOf = new Map<string, string[]>();
    for (const [child, parent] of parentOf) {
        const bucket = childrenOf.get(parent);
        if (bucket) bucket.push(child);
        else childrenOf.set(parent, [child]);
    }

    const clusterRoots = ids.filter(id =>
        kindOf(id) === 'agent'
        && !parentOf.has(id)
        && (anchorOf.has(id) || childrenOf.has(id) || mcpsOf.has(id))
    );

    const topExtentOf = new Map<string, number>();
    const heightOf = new Map<string, number>();

    const measure = (id: string): void => {
        const kids = childrenOf.get(id) ?? [];
        for (const kid of kids) measure(kid);

        let below = 0;
        if (kids.length > 0) {
            below = options.subGap;
            for (let i = 0; i < kids.length; i++) {
                below += heightOf.get(kids[i])!;
                if (i < kids.length - 1) below += options.groupGap;
            }
        }

        const topExtent = anchorOf.has(id) ? options.anchorGap : 0;
        topExtentOf.set(id, topExtent);
        heightOf.set(id, topExtent + below);
    };

    const positions = new Map<string, Positioned>();

    const place = (id: string, x: number, top: number): void => {
        const y = top + topExtentOf.get(id)!;
        positions.set(id, {x, y});

        const anchor = anchorOf.get(id);
        if (anchor !== undefined && !positions.has(anchor)) {
            positions.set(anchor, {x, y: y - options.anchorGap});
        }

        const mcps = mcpsOf.get(id) ?? [];
        const left = mcps.filter((_, i) => i % 2 === 0);
        const right = mcps.filter((_, i) => i % 2 === 1);
        left.forEach((mcp, i) => {
            if (positions.has(mcp)) return;
            positions.set(mcp, {x: x - options.mcpGap, y: y + (i - (left.length - 1) / 2) * options.mcpStackGap});
        });
        right.forEach((mcp, i) => {
            if (positions.has(mcp)) return;
            positions.set(mcp, {x: x + options.mcpGap, y: y + (i - (right.length - 1) / 2) * options.mcpStackGap});
        });

        const kids = childrenOf.get(id) ?? [];
        let cursor = y + options.subGap;
        for (const kid of kids) {
            place(kid, x, cursor);
            cursor += heightOf.get(kid)! + options.groupGap;
        }
    };

    let cursor = options.origin.y;
    for (const root of clusterRoots) {
        measure(root);
        place(root, options.origin.x, cursor);
        cursor += heightOf.get(root)! + options.groupGap;
    }

    for (const id of ids) {
        if (positions.has(id)) continue;
        positions.set(id, {x: options.origin.x, y: cursor});
        cursor += options.groupGap;
    }

    return positions;
}

export function layoutMicroGraph(
    nodes: readonly LayoutNodeInput[],
    options: MicroLayoutOptions,
): Map<string, Positioned> {
    const positions = new Map<string, Positioned>();
    if (nodes.length === 0) return positions;

    positions.set(nodes[0].id, {x: options.origin.x, y: options.origin.y});

    const focus = nodes[1];
    if (!focus) return positions;

    positions.set(focus.id, {x: options.origin.x, y: options.origin.y + options.layerGap});

    const children = nodes.slice(2);
    for (let row = 0; row * options.maxPerRow < children.length; row++) {
        const members = children.slice(row * options.maxPerRow, (row + 1) * options.maxPerRow);
        members.forEach((child, i) => positions.set(child.id, {
            x: options.origin.x + (i - (members.length - 1) / 2) * options.colGap,
            y: options.origin.y + options.layerGap + (row + 1) * options.rowGap,
        }));
    }

    return positions;
}
