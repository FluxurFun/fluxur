"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { Wallet, Check, LogOut } from "lucide-react";

interface WalletConnectCardProps {
  title?: string;
  description?: string;
  showDisconnect?: boolean;
}

export default function WalletConnectCard({
  title = "Connect your wallet",
  description = "Connect your wallet to get started.",
  showDisconnect = true,
}: WalletConnectCardProps) {
  const { publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const displayAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 8)}...${base58.slice(-8)}`;
  }, [publicKey]);

  const fullAddress = useMemo(() => {
    if (!publicKey) return null;
    return publicKey.toBase58();
  }, [publicKey]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  if (connected && displayAddress) {
    return (
      <div className="neon-box rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Wallet Connected</h2>
              <p className="text-cyan-400 text-sm font-mono">{displayAddress}</p>
            </div>
          </div>
          {showDisconnect && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="neon-btn-secondary rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
        <div className="p-4 bg-gray-900/30">
          <p className="text-gray-500 text-xs font-mono break-all">{fullAddress}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="neon-box rounded-2xl overflow-hidden">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/50">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">{title}</h2>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="neon-btn rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {connecting ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect
            </>
          )}
        </button>
      </div>
      <div className="p-6">
        <p className="text-gray-500 text-sm">No wallet connected.</p>
      </div>
    </div>
  );
}
