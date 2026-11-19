export type PhaseId = number;

export interface Node {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  type: "attacker" | "victim" | "browser" | "engine" | "dom" | "vuln" | "payload" | "intranet" | "target" | "c2";
  /** Phase at which the node enters the scene */
  appear: number;
  /** Icon from lucide-react */
  icon: string;
}

export interface Phase {
  readonly id: number;
  readonly title: string;
  readonly body: string;
  readonly tech: string;
  readonly tags: readonly string[];
  readonly severity: "safe" | "attack" | "compromise" | "breach";
  readonly cve?: string;
  readonly cwe?: string;
  readonly cvss?: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
  /** Phase at which the edge is drawn */
  phase: number;
  type: "normal" | "attack" | "compromise" | "exfil";
}

/**
 * Operation Aurora — CVE-2010-0249 attack chain.
 *
 * Coordinates live in a 1100 × 700 viewBox. Nodes enter as the phase
 * advances, telling the story left-to-right: lure → browser exploit →
 * use-after-free → code execution → backdoor → intranet breach.
 */
export const NODES: Node[] = [
  {
    id: "attacker",
    label: "Attacker",
    sub: "Malicious webpage (the lure)",
    x: 120,
    y: 300,
    type: "attacker",
    appear: 1,
    icon: "ExternalLink",
  },
  {
    id: "victim",
    label: "Victim workstation",
    sub: "Google employee · IE 8",
    x: 460,
    y: 100,
    type: "victim",
    appear: 0,
    icon: "Monitor",
  },
  {
    id: "ie",
    label: "Internet Explorer 8",
    sub: "Browser process",
    x: 460,
    y: 280,
    type: "browser",
    appear: 2,
    icon: "Layout",
  },
  {
    id: "mshtml",
    label: "MSHTML engine",
    sub: "Rendering engine / DOM",
    x: 460,
    y: 400,
    type: "engine",
    appear: 3,
    icon: "Code",
  },
  {
    id: "dom",
    label: "DOM element",
    sub: "Object node",
    x: 460,
    y: 520,
    type: "dom",
    appear: 3,
    icon: "Square",
  },
  {
    id: "eventparam",
    label: "EVENTPARAM",
    sub: "Dangling pointer",
    x: 660,
    y: 520,
    type: "vuln",
    appear: 3,
    icon: "Circle",
  },
  {
    id: "uaf",
    label: "USE-AFTER-FREE",
    sub: "Stale pointer deref",
    x: 460,
    y: 640,
    type: "vuln",
    appear: 4,
    icon: "AlertCircle",
  },
  {
    id: "heap",
    label: "Heap spray",
    sub: "Attacker-controlled data",
    x: 660,
    y: 640,
    type: "vuln",
    appear: 5,
    icon: "Database",
  },
  {
    id: "exec",
    label: "Code execution",
    sub: "Shellcode · vtable hijack",
    x: 860,
    y: 640,
    type: "payload",
    appear: 6,
    icon: "Zap",
  },
  {
    id: "backdoor",
    label: "RAT backdoor",
    sub: "Payload installed",
    x: 860,
    y: 500,
    type: "payload",
    appear: 7,
    icon: "Lock",
  },
  {
    id: "intranet",
    label: "Google intranet",
    sub: "Corporate LAN",
    x: 960,
    y: 100,
    type: "intranet",
    appear: 0,
    icon: "Globe",
  },
  {
    id: "lan",
    label: "Internal LAN probe",
    sub: "Enumerating hosts",
    x: 960,
    y: 260,
    type: "intranet",
    appear: 8,
    icon: "Wifi",
  },
  {
    id: "repo",
    label: "Source-code repos",
    sub: "Exfiltrated",
    x: 960,
    y: 390,
    type: "target",
    appear: 8,
    icon: "GitBranch",
  },
  {
    id: "docs",
    label: "Sensitive documents",
    sub: "Exfiltrated",
    x: 960,
    y: 520,
    type: "target",
    appear: 8,
    icon: "FileText",
  },
  {
    id: "c2",
    label: "C2 servers",
    sub: "US · Taiwan :443 SSL",
    x: 960,
    y: 660,
    type: "c2",
    appear: 8,
    icon: "Server",
  },
];

export const EDGES: Edge[] = [
  { id: "e-victim-intranet", from: "victim", to: "intranet", label: "browsing", phase: 0, type: "normal" },
  { id: "e-attacker-ie", from: "attacker", to: "ie", label: "malicious page", phase: 1, type: "attack" },
  { id: "e-victim-ie", from: "victim", to: "ie", label: "opens page", phase: 2, type: "normal" },
  { id: "e-ie-mshtml", from: "ie", to: "mshtml", label: "renders DOM", phase: 3, type: "normal" },
  { id: "e-mshtml-dom", from: "mshtml", to: "dom", label: "object model", phase: 3, type: "normal" },
  { id: "e-dom-eventparam", from: "dom", to: "eventparam", label: "holds pointer", phase: 3, type: "normal" },
  { id: "e-eventparam-uaf", from: "eventparam", to: "uaf", label: "dangling pointer", phase: 4, type: "attack" },
  { id: "e-uaf-heap", from: "uaf", to: "heap", label: "reallocated", phase: 5, type: "attack" },
  { id: "e-heap-exec", from: "heap", to: "exec", label: "shellcode", phase: 6, type: "attack" },
  { id: "e-exec-backdoor", from: "exec", to: "backdoor", label: "RAT payload", phase: 7, type: "compromise" },
  { id: "e-backdoor-lan", from: "backdoor", to: "lan", label: "probes LAN", phase: 8, type: "exfil" },
  { id: "e-backdoor-c2", from: "backdoor", to: "c2", label: "SSL :443", phase: 8, type: "exfil" },
  { id: "e-lan-repo", from: "lan", to: "repo", label: "source code", phase: 8, type: "exfil" },
  { id: "e-lan-docs", from: "lan", to: "docs", label: "documents", phase: 8, type: "exfil" },
];

export const PHASES: Phase[] = [
  {
    id: 0,
    title: "Idle — employee on the intranet",
    body:
      "A Google employee browses the corporate intranet on a Windows XP workstation running Internet Explorer 8. No malicious code has executed yet.",
    tech:
      "MSHTML renders trusted internal pages normally. DOM objects are allocated and freed in order; no dangling pointers exist.",
    tags: ["IE 8", "MSHTML", "Intranet", "No exploit"],
    severity: "safe",
  },
  {
    id: 1,
    title: "Lure — malicious webpage loads",
    body:
      "The victim visits an attacker-controlled webpage — delivered by phishing email or a compromised ad banner. Simply loading the page is enough: exploitation is remote (AV:N), low complexity, and requires only user interaction (UI:R).",
    tech:
      "CVE-2010-0249 · CVSS 3.1 8.8 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H). The same code later leaked into Metasploit.",
    tags: ["CVE-2010-0249", "Remote", "CVSS 8.8", "User interaction required"],
    severity: "attack",
    cve: "CVE-2010-0249",
    cvss: "8.8",
  },
  {
    id: 2,
    title: "JavaScript runs in IE",
    body:
      "Attacker JavaScript executes in the page. It copies a reference to a DOM element, then manipulates the tree — removing the element and firing events — so MSHTML frees the underlying node.",
    tech:
      "The flaw lives in MSHTML (the rendering engine), not the scripting engine. It is triggered purely through the DOM via JavaScript.",
    tags: ["JavaScript", "MSHTML", "DOM"],
    severity: "attack",
  },
  {
    id: 3,
    title: "Object freed — dangling pointer remains",
    body:
      "The DOM node is freed, but an EVENTPARAM wrapper still holds a pointer to it. A dangling pointer to freed memory stays live in the browser heap.",
    tech:
      "Use-after-free (CWE-416): access to \"a pointer associated with a deleted object… incorrectly initialized memory and improper handling of objects in memory.\"",
    tags: ["CWE-416", "Use-after-free", "Dangling pointer", "EVENTPARAM"],
    severity: "attack",
    cwe: "CWE-416",
  },
  {
    id: 4,
    title: "Use-after-free — stale pointer dereferenced",
    body:
      "The script dereferences the stale pointer. The memory it references is no longer owned by the browser and can be repurposed by the heap — yet IE treats it as a live object.",
    tech:
      "No exploit mitigation is standard in 2009: no browser sandbox, immature ASLR, deterministic heap reuse makes the freed slot predictable.",
    tags: ["Stale pointer", "Invalid memory access", "Heap reuse"],
    severity: "attack",
  },
  {
    id: 5,
    title: "Heap sprayed — attacker-controlled data",
    body:
      "Attacker-controlled data (heap spray) reallocates the freed slot. By controlling what occupies it, the attacker can corrupt a C++ vtable or function pointer.",
    tech:
      "The exploit relies on deterministic heap reuse rather than stack execution. DEP on IE 8 generally blocks direct shellcode execution.",
    tags: ["Heap spray", "Vtable", "DEP", "Memory corruption"],
    severity: "attack",
  },
  {
    id: 6,
    title: "Code execution — shellcode runs",
    body:
      "Control flow is redirected into attacker shellcode. Arbitrary code executes in the security context of the logged-in user — full compromise of the workstation.",
    tech:
      "CVE-2010-0249 → Confidentiality / Integrity / Availability: High. IE 6, 6 SP1, 7, and 8 across Windows 2000 through Windows 7 are affected.",
    tags: ["Arbitrary code execution", "Shellcode", "Full compromise"],
    severity: "compromise",
  },
  {
    id: 7,
    title: "RAT backdoor installed",
    body:
      "The payload drops a remote-access Trojan. It phones home to command-and-control servers over SSL-mimicking channels on port 443 — in the US and Taiwan.",
    tech:
      "The backdoor then probes the internal corporate LAN, hunting source-code repositories and sensitive documents — exactly what happened at Google.",
    tags: ["RAT", "Backdoor", "C2 :443", "US · Taiwan"],
    severity: "compromise",
  },
  {
    id: 8,
    title: "Breach — intranet infiltrated",
    body:
      "Inside Google's LAN, the backdoor enumerates source-code repositories and exfiltrates sensitive documents. Operation Aurora hit Google and 30+ other firms in December 2009 – January 2010.",
    tech:
      "Patched by Microsoft Security Bulletin MS10-002 (advisory 979352) on January 21, 2010 — two months after active exploitation. Defenses: patch, DEP, sandboxing, ASLR, modern heap hardening.",
    tags: ["Data exfiltration", "MS10-002 patch", "Jan 21, 2010", "Zero-day"],
    severity: "breach",
    cve: "CVE-2010-0249",
  },
];

export const PHASE_COUNT = PHASES.length;

export const SEVERITY_STYLE: Record<string, string> = {
  safe: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  attack: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  compromise: "bg-red-500/10 border-red-500/30 text-red-400",
  breach: "bg-red-600/20 border-red-500 text-red-400",
};

export function nodeForId(id: string) {
  return NODES.find((n) => n.id === id);
}

export function edgesForPhase(phase: number) {
  return EDGES.filter((e) => e.phase <= phase);
}

export function nodesForPhase(phase: number) {
  return NODES.filter((n) => n.appear <= phase);
}
