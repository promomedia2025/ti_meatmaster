"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

export function WalletWidget({ variant = "mobile" }: { variant?: "desktop" | "mobile" }) {
    const { user, isAuthenticated } = useAuth() as any;
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletLoading, setWalletLoading] = useState(true);
    const [walletCurrency, setWalletCurrency] = useState<string>("EUR");

    useEffect(() => {
        const fetchWalletBalance = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`/api/wallet/balance?customer_id=${user.id}`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();

                if (data.success && data.data) {
                    const balance = data.data.balance || data.data.amount || data.data.wallet_balance || 0;
                    setWalletBalance(typeof balance === 'number' ? balance : parseFloat(balance) || 0);
                    setWalletCurrency(data.data.currency || "EUR");
                } else {
                    setWalletBalance(0);
                }
            } catch (err) {
                setWalletBalance(0);
            } finally {
                setWalletLoading(false);
            }
        };

        if (user?.id) {
            fetchWalletBalance();
        } else if (isAuthenticated === false) {
            setWalletLoading(false);
        }
    }, [user?.id, isAuthenticated]);

    // The wallet shows purely based on authentication, ignoring if they have orders or not!
    if (!isAuthenticated) return null;

    // --- DESKTOP COMPACT VERSION ---
    if (variant === "desktop") {
        return (
            <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-[var(--brand-border)]/10 to-[var(--brand-hover)]/10 border border-[var(--brand-border)]/20 rounded-full px-6 py-3 mx-4">
                <Wallet className="w-5 h-5 text-[var(--brand-border)]" />
                <span className="text-base font-semibold text-zinc-400">Πορτοφόλι:</span>
                {walletLoading ? (
                    <Skeleton className="h-5 w-20 bg-zinc-800" />
                ) : (
                    <span className="text-base font-bold text-white">
                        {walletBalance !== null ? walletBalance.toFixed(2) : "0.00"} {walletCurrency}
                    </span>
                )}
            </div>
        );
    }

    // --- MOBILE BANNER VERSION ---
    return (
        <div className="md:hidden my-4 bg-gradient-to-r from-[var(--brand-border)]/10 to-[var(--brand-hover)]/10 border border-[var(--brand-border)]/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--brand-border)]/20 rounded-full flex items-center justify-center border border-[var(--brand-border)]/30">
                        <Wallet className="w-4 h-4 text-[var(--brand-border)]" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-semibold text-zinc-400 mb-0.5">Υπόλοιπο Πορτοφολιού</h3>
                        {walletLoading ? (
                            <Skeleton className="h-4 w-20 bg-zinc-800" />
                        ) : (
                            <p className="text-lg font-bold text-white">
                                {walletBalance !== null ? walletBalance.toFixed(2) : "0.00"} {walletCurrency}
                            </p>
                        )}
                    </div>
                </div>

                {/* Restored the pulsing 'Διαθέσιμο' dot from your original code */}
                <div className="text-right flex flex-col items-end">
                    <p className="text-[10px] text-zinc-500 mb-1">Διαθέσιμο</p>
                    <div className="w-2.5 h-2.5 bg-[var(--brand-border)] rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}