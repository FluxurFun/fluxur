"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useRef, ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

type AuthUser = { id: number; wallet_address: string } | null;

type AuthContextType = {
  user: AuthUser;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refresh: async () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

const SESSION_FLAG = "fluxur_auth_verified";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, signMessage } = useWallet();
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  // Use ref to track signing state - more reliable than state during re-renders
  const signInProgressRef = useRef(false);
  const hasAttemptedRef = useRef(false);

  const refresh = useMemo(
    () => async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        setUser(json.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear user and session flag when wallet disconnects so UI clears and next connect re-signs
  useEffect(() => {
    if (!connected) {
      setUser(null);
      hasAttemptedRef.current = false;
      signInProgressRef.current = false;
      setLoading(false);
      if (typeof window !== "undefined") localStorage.removeItem(SESSION_FLAG);
    }
  }, [connected]);

  // Run sign flow once per browser session if no session user but wallet already connected/trusted
  useEffect(() => {
    const runSignFlow = async () => {
      if (!connected || !publicKey || !signMessage) return;
      if (loading) return; // wait for initial /me
      if (user) return; // already logged in

      // Never auto-sign on /commit routes
      if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/commit")) return;

      // Guard: already attempted or in progress
      if (hasAttemptedRef.current) return;
      if (signInProgressRef.current) return;

      // Session guard across tabs
      if (typeof window !== "undefined" && localStorage.getItem(SESSION_FLAG) === "1") return;

      // Mark as in progress and attempted
      signInProgressRef.current = true;
      hasAttemptedRef.current = true;

      try {
        const walletAddress = publicKey.toBase58();
        const nRes = await fetch("/api/auth/nonce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress }) });
        if (!nRes.ok) {
          signInProgressRef.current = false;
          return;
        }
        const { nonce } = await nRes.json();
        if (!nonce) {
          signInProgressRef.current = false;
          return;
        }
        const issuedAt = new Date().toISOString();
        const encoded = new TextEncoder().encode(`Domain: fluxur\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssuedAt: ${issuedAt}`);
        const sigBytes = await signMessage(encoded);
        const bs58 = (await import("bs58")).default;
        const signature = bs58.encode(sigBytes);
        const vRes = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress, nonce, signature, issuedAt }) });
        if (vRes.ok) {
          if (typeof window !== "undefined") localStorage.setItem(SESSION_FLAG, "1");
          await refresh();
        }
      } catch (e) {
        console.warn("AuthProvider sign flow failed", e);
      } finally {
        signInProgressRef.current = false;
      }
    };

    runSignFlow();
  }, [connected, publicKey, signMessage, loading, user, refresh]);

  const value = useMemo(() => ({ user, loading, refresh }), [user, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
