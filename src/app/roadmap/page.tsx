"use client";

import Link from "next/link";
import { Home, Search, Plus, User, FileText, Map, CheckCircle, Loader2 } from "lucide-react";
import BinaryRain from "@/components/BinaryRain";
import WalletButton from "@/components/WalletButton";

type PhaseStatus = "completed" | "in-progress";

interface Phase {
  id: number;
  title: string;
  status: PhaseStatus;
  items: string[];
}

const phases: Phase[] = [
  {
    id: 1,
    title: "Phase 1 — Website Launch",
    status: "completed",
    items: [
      "Fluxur website goes live",
      "Create, Discover, Dashboard, and Docs go fully public",
      "Clear focus on transparency and developer commitment",
    ],
  },
  {
    id: 2,
    title: "Phase 2 — Launchpad & Token Locks",
    status: "completed",
    items: [
      "Fluxur launchpad launches",
      "Create new tokens ending with FLXR",
      "Connect previously launched tokens",
      "Lock pump.fun creator fees using time-based unlocks",
      "Locks are fully on-chain and publicly verifiable",
    ],
  },
  {
    id: 3,
    title: "Phase 3 — $FLUXUR Token Launch",
    status: "in-progress",
    items: [
      "Official launch of $FLUXUR",
      "$FLUXUR becomes the core token of the Fluxur ecosystem",
      "Clear communication to prevent unofficial or fake tokens",
    ],
  },
  {
    id: 4,
    title: "Phase 4 — Pump.fun Hackathon",
    status: "in-progress",
    items: [
      "Apply to the pump.fun hackathon",
      "Present Fluxur as infrastructure for commitment and trust",
    ],
  },
  {
    id: 5,
    title: "Phase 5 — Governance",
    status: "in-progress",
    items: [
      "Voting for $FLUXUR holders goes live",
      "On-chain voting directly through the Fluxur website",
      "Community decisions shape future development",
    ],
  },
  {
    id: 6,
    title: "Phase 6 — Staking & Rewards",
    status: "in-progress",
    items: [
      "$FLUXUR holders will be able to stake their tokens",
      "Staking offers a defined APY based on protocol activity",
      "Rewards distributed from $FLUXUR ecosystem activity",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Binary Rain Background */}
      <BinaryRain />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]/80 pointer-events-none z-[1]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/fluxur-logo.png" alt="Fluxur" className="w-10 h-10 logo-glow" />
            <span className="text-lg font-semibold neon-text hidden sm:inline">FLUXUR</span>
          </Link>
          <button type="button" className="neon-box pulse-glow rounded-full px-4 py-2 flex items-center gap-2 text-sm hover:cursor-default">
            <span className="text-gray-400 text-xs uppercase tracking-wide">$FLUXUR</span>
            <span className="neon-text font-medium">Coming Soon</span>
          </button>
        </div>

        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="icon-btn" aria-label="Home"><Home className="w-5 h-5" /></Link>
            <Link href="/discover" className="icon-btn" aria-label="Discover"><Search className="w-5 h-5" /></Link>
            <Link href="/create" className="icon-btn" aria-label="Create"><Plus className="w-5 h-5" /></Link>
            <Link href="/dashboard" className="icon-btn" aria-label="Dashboard"><User className="w-5 h-5" /></Link>
            <Link href="/docs/platform-overview" className="icon-btn" aria-label="Documentation"><FileText className="w-5 h-5" /></Link>
            <Link href="/roadmap" className="icon-btn active" aria-label="Roadmap"><Map className="w-5 h-5" /></Link>
            <a href="https://x.com/FluxurFun" target="_blank" rel="noreferrer noopener" className="icon-btn" aria-label="Twitter">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <WalletButton />
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-8 py-8 max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold neon-text mb-8 text-center">Fluxur Roadmap</h1>

        {/* Phases */}
        <div className="space-y-6">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`neon-box rounded-2xl p-6 transition-all ${
                phase.status === "completed"
                  ? "bg-green-500/5 border-green-500/30"
                  : "bg-cyan-500/5 border-cyan-500/20 opacity-80"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {phase.status === "completed" ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  )}
                </div>

                {/* Phase Content */}
                <div className="flex-1">
                  <h2
                    className={`text-lg sm:text-xl font-semibold mb-3 ${
                      phase.status === "completed" ? "text-green-400" : "text-cyan-400"
                    }`}
                  >
                    {phase.title}
                  </h2>
                  <ul className="space-y-2">
                    {phase.items.map((item, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 text-sm sm:text-base ${
                          phase.status === "completed" ? "text-gray-300" : "text-gray-400"
                        }`}
                      >
                        <span className="text-gray-500 mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Holder Airdrops Section */}
        <div className="mt-8 neon-box rounded-2xl p-6 bg-purple-500/5 border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 text-purple-400">
                Top Holder Airdrops
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-400">
                  <span className="text-gray-500 mt-1.5">•</span>
                  <span>Airdrops distributed to the top 100 $FLUXUR holders</span>
                </li>
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-400">
                  <span className="text-gray-500 mt-1.5">•</span>
                  <span>Funded by protocol rewards generated by Fluxur</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Goal Statement */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-base sm:text-lg italic">
            The goal is to set the standard for provable commitment in on-chain ecosystems.
          </p>
        </div>
      </main>
    </div>
  );
}
