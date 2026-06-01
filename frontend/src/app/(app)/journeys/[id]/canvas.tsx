"use client";
import { motion } from "framer-motion";
import { Zap, Clock, MessageCircle, GitFork, ShoppingBag } from "lucide-react";

type Node = { id: string; type: string; label: string; x: number; y: number };
type Edge = { from: string; to: string; label?: string };

const NODE_ICON: Record<string, any> = {
  trigger: Zap, wait: Clock, message: MessageCircle, branch: GitFork, purchase: ShoppingBag,
};

const NODE_COLOR: Record<string, string> = {
  trigger: "from-amber-500 to-orange-600",
  wait: "from-zinc-500 to-zinc-600",
  message: "from-brand-500 to-brand-700",
  branch: "from-cyan-500 to-blue-600",
};

export function JourneyCanvas({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const W = 1100, H = 280;
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="relative overflow-x-auto rounded-xl bg-zinc-50/60 p-4">
      <svg width={W} height={H} className="block">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(220 9% 46%)" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = nodeMap[e.from], b = nodeMap[e.to];
          if (!a || !b) return null;
          const x1 = a.x + 80, y1 = a.y + 30;
          const x2 = b.x, y2 = b.y + 30;
          const mx = (x1 + x2) / 2;
          return (
            <g key={i}>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke="hsl(220 13% 70%)" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)"
              />
              {e.label && (
                <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle" className="fill-zinc-500" fontSize="10">{e.label}</text>
              )}
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const Icon = NODE_ICON[n.type] ?? MessageCircle;
          const grad = NODE_COLOR[n.type] ?? NODE_COLOR.message;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              transform={`translate(${n.x}, ${n.y})`}
            >
              <foreignObject width={160} height={60}>
                <div className={`flex h-full w-full items-center gap-2 rounded-xl bg-gradient-to-br ${grad} px-3 py-2 text-white shadow-soft`}>
                  <Icon size={16} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider opacity-80">{n.type}</p>
                    <p className="truncate text-xs font-semibold">{n.label}</p>
                  </div>
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
