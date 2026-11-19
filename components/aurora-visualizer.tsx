"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Circle,
  Code,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Layout,
  Lock,
  Monitor,
  Pause,
  Play,
  Server,
  Square,
  Wifi,
  Zap,
  ArrowRight,
} from "lucide-react";
import {
  EDGES,
  NODES,
  PHASES,
  PHASE_COUNT,
  SEVERITY_STYLE,
  type Node,
  type Edge,
} from "./attack-data";

const ICONS: Record<string, React.ElementType> = {
  ExternalLink,
  Monitor,
  Layout,
  Code,
  Square,
  Circle,
  AlertCircle,
  Database,
  Zap,
  Lock,
  Globe,
  Wifi,
  GitBranch,
  FileText,
  Server,
};

const NODE_R = 18;

type NodeStyle = {
  stroke: string;
  strokeActive: string;
  fill: string;
  fillActive: string;
  glow: string;
};

const TYPE_STYLE: Record<Node["type"], NodeStyle> = {
  attacker: {
    stroke: "#f59e0b",
    strokeActive: "#fbbf24",
    fill: "#0b0f19",
    fillActive: "#f59e0b",
    glow: "glow-amber",
  },
  victim: {
    stroke: "#3b82f6",
    strokeActive: "#60a5fa",
    fill: "#0b0f19",
    fillActive: "#3b82f6",
    glow: "glow-blue",
  },
  browser: {
    stroke: "#3b82f6",
    strokeActive: "#93c5fd",
    fill: "#0b0f19",
    fillActive: "#3b82f6",
    glow: "glow-blue",
  },
  engine: {
    stroke: "#64748b",
    strokeActive: "#94a3b8",
    fill: "#0b0f19",
    fillActive: "#0f172a",
    glow: "",
  },
  dom: {
    stroke: "#475569",
    strokeActive: "#94a3b8",
    fill: "#0b0f19",
    fillActive: "#0f172a",
    glow: "",
  },
  vuln: {
    stroke: "#f59e0b",
    strokeActive: "#ef4444",
    fill: "#0b0f19",
    fillActive: "#ef4444",
    glow: "glow-red",
  },
  payload: {
    stroke: "#ef4444",
    strokeActive: "#fca5a5",
    fill: "#0b0f19",
    fillActive: "#ef4444",
    glow: "glow-red",
  },
  intranet: {
    stroke: "#10b981",
    strokeActive: "#34d399",
    fill: "#0b0f19",
    fillActive: "#10b981",
    glow: "glow-blue",
  },
  target: {
    stroke: "#ef4444",
    strokeActive: "#fca5a5",
    fill: "#0b0f19",
    fillActive: "#ef4444",
    glow: "glow-red",
  },
  c2: {
    stroke: "#dc2626",
    strokeActive: "#ef4444",
    fill: "#0b0f19",
    fillActive: "#ef4444",
    glow: "glow-red",
  },
};

function edgePath(x1: number, y1: number, x2: number, y2: number, type: Edge["type"]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 70) return `M${x1} ${y1} L${x2} ${y2}`;
  if (type === "normal") return `M${x1} ${y1} L${x2} ${y2}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * 42;
  const cy = my + ny * 42;
  return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
}

interface AnimatedEdgeProps {
  edge: Edge;
  nodes: Record<string, Node>;
  phase: number;
  breached: boolean;
}

function AnimatedEdge({ edge, nodes, phase, breached }: AnimatedEdgeProps) {
  const ref = useRef<SVGPathElement>(null);
  const from = nodes[edge.from];
  const to = nodes[edge.to];
  const [drawn, setDrawn] = useState(false);

  const ready = Boolean(from && to && edge.phase <= phase);

  // Hooks must run unconditionally: guard the body with `ready` instead of
  // returning early before useEffect.
  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    const length = el.getTotalLength() || 1;
    el.style.strokeDasharray = `${length} ${length}`;
    el.style.strokeDashoffset = String(length);
    setDrawn(false);
    const timer = setTimeout(() => {
      el.style.transition = "stroke-dashoffset 0.7s ease-out";
      el.style.strokeDashoffset = "0";
      setDrawn(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [edge.phase, phase, edge.id, ready]);

  if (!ready) return null;

  const baseColor =
    edge.type === "normal" ? "#64748b" : edge.type === "attack" ? "#f59e0b" : edge.type === "compromise" ? "#ef4444" : "#dc2626";
  const activeColor = breached && edge.type === "exfil" ? "#ef4444" : baseColor;
  const width = edge.type === "normal" ? 1.5 : edge.type === "attack" ? 2 : 2.5;

  return (
    <motion.path
      ref={ref}
      d={edgePath(from!.x, from!.y, to!.x, to!.y, edge.type)}
      fill="none"
      stroke={activeColor}
      strokeWidth={width}
      strokeLinecap="round"
      markerEnd={edge.type !== "normal" ? "url(#arrow)" : undefined}
      className="transition-all duration-300"
      style={{ opacity: drawn ? 1 : 0 }}
    />
  );
}

interface NodeProps {
  node: Node;
  phase: number;
  order: number;
  hovered: string | null;
  onEnter: (id: string) => void;
  onLeave: () => void;
  breached: boolean;
}

function AuroraNode({ node, phase, order, hovered, onEnter, onLeave, breached }: NodeProps) {
  const active = phase >= node.appear;
  const isHovered = hovered === node.id;
  const style = TYPE_STYLE[node.type];
  const nodeBreached = breached && (node.type === "intranet" || node.type === "target" || node.type === "c2");
  const stroke = nodeBreached ? style.strokeActive : active ? style.strokeActive : style.stroke;
  const fill = active ? style.fillActive : style.fill;
  const pulse = node.id === "uaf" && phase >= 4;
  const Icon = ICONS[node.icon];

  return (
    <motion.g
      key={node.id}
      className="cursor-pointer"
      onMouseEnter={() => onEnter(node.id)}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: active ? 1 : 0,
        scale: active ? 1 : 0.8,
        filter: active && isHovered ? "url(#glow)" : "none",
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.4,
        delay: active ? order * 0.07 : 0,
        type: "spring",
        stiffness: 260,
        damping: 22,
      }}
    >
      {pulse && (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={NODE_R + 12}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          animate={{ r: [NODE_R + 12, NODE_R + 30, NODE_R + 12], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={NODE_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={2.5}
        className={active ? style.glow : ""}
        style={{ filter: active && isHovered ? "url(#glow)" : "none" }}
        whileHover={{ r: NODE_R + 4, strokeWidth: 3 }}
      />
      <g transform={`translate(${node.x - NODE_R + 7}, ${node.y - NODE_R + 7})`}>
        <Icon width={11} height={11} stroke={stroke} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Title sits above the circle so it stays readable */}
      <text
        x={node.x}
        y={node.y - NODE_R - 14}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        letterSpacing={0.02}
        fill={stroke}
        opacity={active ? 1 : 0}
        className="font-sans pointer-events-none"
      >
        {node.label}
      </text>
      <text
        x={node.x}
        y={node.y + NODE_R + 14}
        textAnchor="middle"
        fontSize={8.5}
        fill={stroke}
        opacity={active ? 0.5 : 0}
        className="font-mono leading-none pointer-events-none"
      >
        {node.sub}
      </text>
    </motion.g>
  );
}

interface TooltipState {
  id: string | null;
  x: number;
  y: number;
}

export default function AuroraVisualizer() {
  const diagramWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({ id: null, x: 0, y: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drag-to-pan state for the diagram
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    scale: number;
    vw: number;
    vh: number;
  } | null>(null);

  const SLACK = 100; // viewBox units allowed off-screen when panning

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const getViewport = useCallback(() => {
    const el = diagramWrapRef.current;
    if (!el) return { scale: 1, vw: 1100, vh: 700 };
    const r = el.getBoundingClientRect();
    const scale = Math.min(r.width / 1100, r.height / 700);
    return { scale, vw: r.width / scale, vh: r.height / scale };
  }, []);

  const panLimits = useCallback(() => {
    const { vw, vh } = getViewport();
    const minX = 80,
      maxX = 990,
      minY = 70,
      maxY = 690;
    return {
      minPanX: -SLACK - minX,
      maxPanX: vw + SLACK - maxX,
      minPanY: -SLACK - minY,
      maxPanY: vh + SLACK - maxY,
    };
  }, [getViewport]);

  const onPanMove = useCallback(
    (e: MouseEvent) => {
      const start = panStart.current;
      if (!start) return; // panStart.current is set synchronously in onPanStart
      const dx = (e.clientX - start.x) / start.scale;
      const dy = (e.clientY - start.y) / start.scale;
      const { minPanX, maxPanX, minPanY, maxPanY } = panLimits();
      setPan((p) => ({
        x: clamp(start.panX + dx, minPanX, maxPanX),
        y: clamp(start.panY + dy, minPanY, maxPanY),
      }));
    },
    [panLimits]
  );

  const onPanEnd = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
    window.removeEventListener("mousemove", onPanMove);
    window.removeEventListener("mouseup", onPanEnd);
  }, [onPanMove]);

  const onPanStart = useCallback(
    (e: React.MouseEvent) => {
      // Only pan when dragging the background, not a node
      if (e.target !== e.currentTarget) return;
      if (e.button !== 0) return;
      const { scale } = getViewport();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, scale, vw: 0, vh: 0 };
      window.addEventListener("mousemove", onPanMove);
      window.addEventListener("mouseup", onPanEnd);
    },
    [getViewport, pan.x, pan.y, onPanMove, onPanEnd]
  );

  const breached = phase >= 8;
  const nodesInPhase = useMemo(() => NODES.filter((n) => n.appear <= phase), [phase]);
  const nodesById = useMemo(() => Object.fromEntries(nodesInPhase.map((n) => [n.id, n])), [nodesInPhase]);
  const edgesInPhase = useMemo(() => EDGES.filter((e) => e.phase <= phase), [phase]);
  const currentPhase = PHASES[phase];
  const severityClass = SEVERITY_STYLE[currentPhase.severity];

  const showTooltip = useCallback(
    (id: string) => {
      const node = NODES.find((n) => n.id === id);
      if (!node || !diagramWrapRef.current) {
        setTooltip({ id: null, x: 0, y: 0 });
        return;
      }
      const rect = diagramWrapRef.current.getBoundingClientRect();
      const { scale } = getViewport();
      const offsetX = (rect.width - 1100 * scale) / 2;
      const offsetY = (rect.height - 700 * scale) / 2;
      const sx = offsetX + (node.x + pan.x) * scale;
      const sy = offsetY + (node.y + pan.y) * scale;
      setTooltip({ id, x: sx, y: sy });
    },
    [pan.x, pan.y, getViewport],
  );

  useEffect(() => {
    if (!playing) {
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setPhase((p) => (p >= PHASE_COUNT - 1 ? PHASE_COUNT - 1 : p + 1));
    }, 2600);
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPhase((p) => Math.min(PHASE_COUNT - 1, p + 1));
      if (e.key === "ArrowLeft") setPhase((p) => Math.max(0, p - 1));
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (p: number) => {
    setPhase(Math.max(0, Math.min(PHASE_COUNT - 1, p)));
    setPlaying(false);
  };

  const nodeContent: Record<string, { title: string; detail: string }> = {
    attacker: {
      title: "Attacker-controlled webpage",
      detail: "The lure: a malicious page or compromised ad that hosts the CVE-2010-0249 exploit. Simply visiting it triggers the script context.",
    },
    victim: {
      title: "Victim workstation",
      detail: "Google employee desktop (Windows XP / IE 8). The security context in which arbitrary code eventually executes.",
    },
    ie: {
      title: "Internet Explorer 8",
      detail: "Browser process hosting MSHTML. DEP is enabled by default in IE 8 but does not stop the memory corruption itself.",
    },
    mshtml: {
      title: "MSHTML rendering engine",
      detail: "Where the vulnerability lives — not in JScript. The DOM is built here and nodes are freed when no longer needed.",
    },
    dom: {
      title: "DOM element node",
      detail: "A page element referenced by JavaScript. When removed from the tree, MSHTML frees the underlying object.",
    },
    eventparam: {
      title: "EVENTPARAM wrapper",
      detail: "Holds event parameters including a pointer to the DOM node. After the node is freed, this pointer dangles.",
    },
    uaf: {
      title: "Use-after-free (CWE-416)",
      detail: "The stale pointer is dereferenced. Freed memory is no longer owned by the browser, yet IE accesses it as a live object.",
    },
    heap: {
      title: "Heap spray",
      detail: "Attacker-controlled data reallocates the freed slot, setting up controlled memory layout for the next step.",
    },
    exec: {
      title: "Arbitrary code execution",
      detail: "Vtable / control-flow hijack redirects execution to shellcode. Full confidentiality / integrity / availability impact.",
    },
    backdoor: {
      title: "RAT backdoor",
      detail: "The payload installs a remote-access Trojan that connects to C2 over SSL-mimicking channels on port 443.",
    },
    intranet: {
      title: "Google corporate intranet",
      detail: "Trusted internal network. Once the backdoor lands on a workstation, the intranet is no longer a safe zone.",
    },
    lan: {
      title: "Internal LAN probe",
      detail: "The backdoor enumerates hosts inside Google's LAN, looking for source-code repositories and sensitive documents.",
    },
    repo: {
      title: "Source-code repositories",
      detail: "High-value target: internal source code. Exfiltration of repositories was a hallmark of Operation Aurora.",
    },
    docs: {
      title: "Sensitive documents",
      detail: "Internal documents and design materials copied off the network through the backdoor channel.",
    },
    c2: {
      title: "Command & control (US · Taiwan)",
      detail: "SSL-mimicking C2 channels on port 443 blend in with normal HTTPS traffic back to the attackers.",
    },
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400/70 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            OPERATION AURORA — VISUALIZER
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 tracking-tight">
            CVE-2010-0249<span className="text-slate-500"> · IE DOM Use-After-Free</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md">
            Animated, interactive reconstruction of the zero-day exploit chain used against Google — from the malicious
            lure to intranet exfiltration.
          </p>
        </div>
        <div className={`${severityClass} px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
          {currentPhase.title}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diagram column */}
        <div className="lg:col-span-7 flex flex-col min-h-[560px]">
          <div
            ref={diagramWrapRef}
            className="flex-1 relative rounded-xl border border-slate-800 bg-slate-950/60 shadow-2xl overflow-hidden group ring-1 ring-slate-800/50 backdrop-blur-sm"
          >
            <svg
              ref={containerRef}
              viewBox="0 0 1100 700"
              className="w-full h-full block"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Operation Aurora attack chain diagram"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker
                  id="arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="3"
                  refY="3"
                  orient="auto-start-reverse"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,4 L4,2 Z" fill="currentColor" />
                </marker>
              </defs>

              {/* Pan background: captures drag gestures to move the diagram.
                   Sits behind everything so node clicks pass through to nodes. */}
              <rect
                width="1100"
                height="700"
                fill="none"
                pointerEvents="all"
                cursor={isPanning ? "grabbing" : "grab"}
                onMouseDown={onPanStart}
              />

              {/* Background grid */}
              <g stroke="rgb(255 255 255 / 0.04)" strokeWidth="1">
                {[0, 275, 550, 825].map((x) => (
                  <line key={x} x1={x} y1={0} x2={x} y2={700} />
                ))}
                {[0, 175, 350, 525].map((y) => (
                  <line key={y} x1={0} y1={y} x2={1100} y2={y} />
                ))}
              </g>

              {/* Pannable content group */}
              <g transform={`translate(${pan.x} ${pan.y})`}>
                {/* Edges drawn behind nodes */}
                {edgesInPhase.map((edge) => (
                  <AnimatedEdge key={edge.id} edge={edge} nodes={nodesById} phase={phase} breached={breached} />
                ))}

                {/* Nodes */}
                <AnimatePresence>
                  {nodesInPhase.map((node, order) => (
                    <AuroraNode
                      key={node.id}
                      node={node}
                      phase={phase}
                      order={order}
                      hovered={tooltip.id}
                      onEnter={showTooltip}
                      onLeave={() => setTooltip({ id: null, x: 0, y: 0 })}
                      breached={breached}
                    />
                  ))}
                </AnimatePresence>
              </g>
            </svg>

            {/* Tooltip overlay */}
            {tooltip.id && (
              <div
                className="absolute pointer-events-none z-50 translate-x-1/2 -translate-y-full mb-3"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="max-w-[270px] rounded-lg border border-slate-700 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md text-left border-l-4 border-l-amber-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <h3 className="text-xs font-bold text-slate-100 capitalize">{nodeContent[tooltip.id]?.title}</h3>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">
                    {nodeContent[tooltip.id]?.detail}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Phase label over diagram */}
            <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Phase {phase + 1} of {PHASE_COUNT}
              </span>
              <span className="text-xs font-semibold text-slate-200">{currentPhase.title}</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex -space-x-2">
              {[...Array(PHASE_COUNT)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= phase
                      ? "bg-amber-500 ring-1 ring-amber-500/40"
                      : "bg-slate-700 hover:bg-slate-500"
                  } ${i === phase ? "ring-2 ring-amber-400 scale-110" : ""}`}
                  aria-label={`Step ${i + 1}`}
                  title={`Phase ${i + 1}: ${PHASES[i].title}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setPan({ x: 0, y: 0 })}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                aria-label="Reset view"
                title="Reset view"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
              </button>
              <span>{playing ? "auto-play on" : "paused"}</span>
              <span className="text-slate-600">·</span>
              <span>← → to step</span>
            </div>
          </div>
        </div>

        {/* Detail column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              What happened
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{currentPhase.body}</p>
            <div className="bg-black/30 rounded-lg p-3.5 border border-slate-800/50 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">Technical detail</p>
              <p className="text-sm text-slate-200 leading-relaxed">{currentPhase.tech}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPhase.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded text-[10px] font-mono border bg-slate-800/60 text-slate-300 border-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            {(currentPhase.cve || currentPhase.cwe || currentPhase.cvss) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentPhase.cve && (
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold border bg-red-500/10 text-red-400 border-red-500/30">
                    {currentPhase.cve}
                  </span>
                )}
                {currentPhase.cwe && (
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/30">
                    {currentPhase.cwe}
                  </span>
                )}
                {currentPhase.cvss && (
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold border bg-red-600/20 text-red-400 border-red-500">
                    CVSS {currentPhase.cvss} HIGH
                  </span>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm flex-1">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Node inspector
            </h2>
            <p className="text-xs text-slate-500 mb-3">Hover any node in the diagram to inspect it.</p>
            {tooltip.id ? (
              <>
                <h3 className="text-xs font-bold text-slate-200 mb-1 capitalize">{tooltip.id}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{nodeContent[tooltip.id]?.detail}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">No node selected.</p>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-800/60 pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          CVE-2010-0249 · CWE-416 Use-After-Free · MSHTML (Internet Explorer) · Patched by MS10-002, January 21, 2010
        </div>
        <div className="flex items-center gap-3">
          <span>Operation Aurora — December 2009 / January 2010 — Google and 30+ other firms</span>
          <span className="border-l border-slate-700 pl-3">Defense: patch · DEP · sandbox · ASLR · heap hardening</span>
        </div>
      </footer>
    </div>
  );
}
