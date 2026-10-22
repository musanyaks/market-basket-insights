"use client";

import type { AssociationRule } from "@/types";
import { useMemo, useState } from "react";

interface NetworkGraphProps {
  rules: AssociationRule[];
  limit?: number;
}

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
  lift: number;
}

export function NetworkGraph({ rules, limit = 30 }: NetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const topRules = rules.slice(0, limit);
    const nodeMap = new Map<string, { id: string; count: number }>();

    for (const rule of topRules) {
      for (const item of rule.antecedent) {
        const existing = nodeMap.get(item) ?? { id: item, count: 0 };
        existing.count += 1;
        nodeMap.set(item, existing);
      }
      for (const item of rule.consequent) {
        const existing = nodeMap.get(item) ?? { id: item, count: 0 };
        existing.count += 1;
        nodeMap.set(item, existing);
      }
    }

    const nodeList = [...nodeMap.values()];
    const placedNodes: Node[] = nodeList.map((node, index) => {
      const angle = (index / nodeList.length) * Math.PI * 2;
      const radius = 140 + Math.random() * 40;
      return {
        id: node.id,
        x: 250 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        radius: 8 + Math.min(node.count * 2, 16),
      };
    });

    const edgeList: Edge[] = topRules.map((rule) => ({
      source: rule.antecedent[0],
      target: rule.consequent[0],
      lift: rule.lift,
    }));

    return { nodes: placedNodes, edges: edgeList };
  }, [rules, limit]);

  const maxLift = useMemo(() => {
    if (edges.length === 0) return 1;
    return Math.max(...edges.map((e) => e.lift));
  }, [edges]);

  return (
    <div className="h-96 w-full">
      <svg viewBox="0 0 500 400" className="h-full w-full">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>
        {edges.map((edge, idx) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;

          const opacity = 0.2 + (edge.lift / maxLift) * 0.6;
          const strokeWidth = 1 + (edge.lift / maxLift) * 3;

          return (
            <line
              key={idx}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#64748b"
              strokeWidth={strokeWidth}
              opacity={opacity}
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={hoveredNode === node.id ? "#4f46e5" : "#6366f1"}
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <text
              x={node.x}
              y={node.y + node.radius + 14}
              textAnchor="middle"
              className="fill-slate-700 text-[10px] font-medium"
            >
              {node.id.length > 16 ? node.id.slice(0, 14) + "…" : node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
