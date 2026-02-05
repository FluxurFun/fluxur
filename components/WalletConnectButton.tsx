"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { Wallet, Check } from "lucide-react";

interface WalletConnectButtonProps {
  className?: string;
}

export default function WalletConnectButton({ className = "" }: WalletConnectButtonProps) {
  const { publicKey, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const displayAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  if (connected && displayAddress) {
    return (
      <div className={`neon-box rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${className}`}>
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-green-400">Connected:</span>
        <span className="text-cyan-400 font-mono">{displayAddress}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={connecting}
      className={`neon-btn rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {connecting ? (
        <>
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </>
      )}
    </button>
  );
}
