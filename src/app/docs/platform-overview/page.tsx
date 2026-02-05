"use client";

import Link from "next/link";
import { Home, Search, Plus, User, FileText, Map, ChevronRight } from "lucide-react";
import BinaryRain from "@/components/BinaryRain";
import WalletButton from "@/components/WalletButton";

const sidebarItems = [
  { id: "overview", label: "Overview", number: "1" },
  { id: "how-it-works", label: "How It Works", number: "2" },
  { id: "create-lock", label: "Creating a Lock", number: "2a", indent: true },
  { id: "redirect-fees", label: "Redirecting Fees", number: "2b", indent: true },
  { id: "claiming-requirements", label: "Claiming Requirements", number: "2c", indent: true, warning: true },
  { id: "unlock-withdraw", label: "Unlock & Withdraw", number: "2d", indent: true },
  { id: "for-creators", label: "For Creators", number: "3" },
  { id: "for-holders", label: "For Holders", number: "4" },
  { id: "security", label: "Security", number: "5" },
  { id: "faq", label: "FAQ", number: "6" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <BinaryRain />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]/80 pointer-events-none z-[1]" />

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
            <Link href="/docs/platform-overview" className="icon-btn active" aria-label="Documentation"><FileText className="w-5 h-5" /></Link>
            <Link href="/roadmap" className="icon-btn" aria-label="Roadmap"><Map className="w-5 h-5" /></Link>
            <a href="https://x.com/FluxurFun" target="_blank" rel="noreferrer noopener" className="icon-btn" aria-label="Twitter">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <WalletButton />
        </nav>
      </header>

      <div className="relative z-10 flex">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-gray-800/50 h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]">
          <div className="p-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-4">On This Page</h3>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors hover:bg-white/5 w-full text-left ${
                    item.indent ? "ml-4 text-gray-400" : "text-gray-300"
                  }`}
                >
                  <span className="text-xs text-gray-600 w-6">{item.number}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold neon-text mb-8">Fluxur</h1>

          <section id="overview" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> Overview
            </h2>
            <p className="text-gray-300 mb-4">
              Fluxur is a time-locked vault system for pump.fun creator fees on Solana.
            </p>
            <p className="text-gray-300 mb-4">
              Creators can lock their trading fees in a dedicated vault address until a chosen unlock date. This builds trust with holders by demonstrating long-term commitment to the project.
            </p>
            <div className="neon-box rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong className="text-white">In short:</strong> Generate a vault, redirect your pump.fun creator fees to it, and unlock them at a date you choose.
              </p>
            </div>
          </section>

          <hr className="border-gray-800 my-8" />

          <section id="how-it-works" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> How It Works
            </h2>

            <div className="space-y-8">
              <div id="create-lock">
                <h3 className="text-xl font-semibold text-white mb-3">2a. Create a Lock</h3>
                <p className="text-gray-300 mb-4">After launching your token on pump.fun and creating a commitment on Fluxur:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Navigate to your commitment page</li>
                  <li>Click "Lock Creator Fees"</li>
                  <li>Choose your unlock date using the date picker</li>
                  <li>Click "Create Lock" to generate your unique vault address</li>
                </ul>
              </div>

              <div id="redirect-fees">
                <h3 className="text-xl font-semibold text-white mb-3">2b. Redirect Fees to Vault</h3>
                <p className="text-gray-300 mb-4">Once your lock is created:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Copy the vault address from your lock page</li>
                  <li>Go to pump.fun and update your creator fee wallet to the vault address</li>
                  <li>All future trading fees will be routed to the vault</li>
                  <li>Fluxur will detect incoming fees and show "Fees Detected" status</li>
                </ul>
              </div>

              <div id="claiming-requirements">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-red-400">2c. Claiming Requirements</span>
                </h3>

                <div className="p-4 rounded-xl border-2 border-red-500 bg-red-500/10 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500 text-2xl">⚠️</span>
                    <div>
                      <h4 className="font-bold text-red-400 text-lg mb-2">Fluxur does not auto-claim pump.fun rewards.</h4>
                      <div className="text-gray-300 text-sm space-y-3">
                        <p className="font-medium text-white">To lock creator fees:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                          <li><strong className="text-red-400">Creator share must be ≥ 1%</strong></li>
                          <li><strong className="text-red-400">You must remove creator share permissions on pump.fun (irreversible)</strong></li>
                          <li>Fees are claimed manually on pump.fun</li>
                          <li>Claimed SOL must be directed to the Fluxur vault address</li>
                        </ul>
                        <p className="text-red-400 font-bold mt-4">
                          If creator share is set to 0%, rewards cannot be claimed and are permanently inaccessible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="unlock-withdraw">
                <h3 className="text-xl font-semibold text-white mb-3">2d. Unlock & Withdraw</h3>
                <p className="text-gray-300 mb-4">When the unlock date arrives:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Return to your lock page</li>
                  <li>The vault balance will be available for withdrawal</li>
                  <li>Withdraw your accumulated fees to your wallet</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-800 my-8" />

          <section id="for-creators" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> For Creators
            </h2>
            <p className="text-gray-300 mb-4">Locking your creator fees demonstrates commitment to your project:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong className="text-white">Build Trust:</strong> Show holders you're committed and trustworthy</li>
              <li><strong className="text-white">Signal Commitment:</strong> A locked vault proves long-term intent</li>
              <li><strong className="text-white">Transparent Timeline:</strong> Holders can see exactly when fees unlock</li>
              <li><strong className="text-white">Verifiable:</strong> Vault balances are visible on-chain</li>
            </ul>
          </section>

          <hr className="border-gray-800 my-8" />

          <section id="for-holders" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> For Holders
            </h2>
            <p className="text-gray-300 mb-4">Time-locked vaults give you transparency into creator intent:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong className="text-white">See the Lock:</strong> View when creator fees will unlock</li>
              <li><strong className="text-white">Verify On-Chain:</strong> Vault balances are publicly visible</li>
              <li><strong className="text-white">Track Commitment:</strong> Projects with locks show stronger commitment</li>
            </ul>
          </section>

          <hr className="border-gray-800 my-8" />

          <section id="security" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> Security
            </h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong className="text-white">Unique Vault Addresses:</strong> Each lock generates a new Solana keypair</li>
              <li><strong className="text-white">Creator-Only Access:</strong> Only the creator wallet can view and manage their lock</li>
              <li><strong className="text-white">Wallet Authentication:</strong> Actions require signed messages from your wallet</li>
              <li><strong className="text-white">On-Chain Verification:</strong> Vault balances are verifiable via Solana RPC</li>
            </ul>
          </section>

          <hr className="border-gray-800 my-8" />

          <section id="faq" className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="neon-text">#</span> FAQ
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How do I lock my fees?</h3>
                <p className="text-gray-300">Create a commitment on Fluxur, then click "Lock Creator Fees" on your commitment page. Choose an unlock date and create the lock.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Can I unlock early?</h3>
                <p className="text-gray-300">Currently, locks cannot be unlocked before the chosen date. This ensures the commitment is meaningful.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">What happens to fees in the vault?</h3>
                <p className="text-gray-300">Fees accumulate in the vault until the unlock date. You can monitor the balance in real-time on your lock page.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Is this connected to pump.fun?</h3>
                <p className="text-gray-300">Fluxur works alongside pump.fun. You create your token on pump.fun, then use Fluxur to lock your creator fees in a time-locked vault.</p>
              </div>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <Link href="/" className="neon-btn-secondary rounded-full px-6 py-3 inline-flex items-center gap-2">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
