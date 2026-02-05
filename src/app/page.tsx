"use client";

import { Home, Search, Plus, User, FileText, Map } from "lucide-react";
import Link from "next/link";
import BinaryRain from "@/components/BinaryRain";
import WalletButton from "@/components/WalletButton";

export default function FluxurLanding() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Binary Rain Background */}
      <BinaryRain />

      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]/70 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,0.6)_70%)] pointer-events-none z-[1]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/fluxur-logo.png"
              alt="Fluxur"
              className="w-10 h-10 logo-glow"
            />
            <span className="text-lg font-semibold neon-text hidden sm:inline">FLUXUR</span>
          </Link>

          {/* Token Address - Coming Soon */}
          <button
            type="button"
            className="neon-box pulse-glow rounded-full px-4 py-2 flex items-center gap-2 text-sm hover:cursor-default"
          >
            <span className="text-gray-400 text-xs uppercase tracking-wide">$FLUXUR</span>
            <span className="neon-text font-medium">Coming Soon</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <button type="button" className="icon-btn active" aria-label="Home">
              <Home className="w-5 h-5" />
            </button>
            <Link href="/discover" className="icon-btn" aria-label="Discover">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/create" className="icon-btn" aria-label="Create">
              <Plus className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="icon-btn" aria-label="Dashboard">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/docs/platform-overview" className="icon-btn" aria-label="Documentation">
              <FileText className="w-5 h-5" />
            </Link>
            <Link href="/roadmap" className="icon-btn" aria-label="Roadmap">
              <Map className="w-5 h-5" />
            </Link>
            <a
              href="https://x.com/FluxurFun"
              target="_blank"
              rel="noreferrer noopener"
              className="icon-btn"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          {/* Select Wallet Button */}
          <WalletButton />
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
        {/* Large Logo */}
        <div className="mb-8">
          <img
            src="https://ugc.same-assets.com/W01YjK1Qw-hPmPgOLIFQntZszYQazLna.png"
            alt="Fluxur"
            className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 logo-glow object-contain"
          />
        </div>

        {/* Mobile Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold neon-text mb-6 md:hidden">
          FLUXUR
        </h1>

        {/* Description */}
        <p className="max-w-xl text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
          Lock your{" "}
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noreferrer noopener"
            className="neon-text hover:underline"
          >
            pump.fun
          </a>{" "}
          creator fees in a time-locked vault.
          <br />
          Generate a dedicated vault address, redirect fees, and unlock them at a date you choose.
        </p>

        {/* Token Coming Soon Badge (Mobile) */}
        <div className="mb-8 md:hidden">
          <div className="neon-box pulse-glow rounded-full px-4 py-2 flex items-center gap-2 text-sm">
            <span className="text-gray-400 text-xs uppercase tracking-wide">$FLUXUR</span>
            <span className="neon-text font-medium">Coming Soon</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/create" className="neon-btn rounded-full px-8 py-3 text-base font-semibold text-center">
            Create Commitment
          </Link>
          <Link href="/discover" className="neon-btn-secondary rounded-full px-8 py-3 text-base font-semibold text-center">
            Explore Discover
          </Link>
        </div>
      </main>
    </div>
  );
}
