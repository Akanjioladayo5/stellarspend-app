import type { Metadata } from "next";
import BalancesWidget from "@/components/dashboard/BalancesWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

export const metadata: Metadata = {
  title: "Dashboard — StellarSpend",
  description:
    "Your StellarSpend financial overview: wallet balances, quick actions, and recent transactions.",
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-[#e8b84b]/20 bg-[#e8b84b]/[0.08] text-[#e8b84b]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#e8b84b] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Live Overview
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Good day, <span className="text-[#e8b84b]">Stellar</span> user
        </h1>
        <p className="text-[#7a8aaa] mt-1 text-sm max-w-md">
          Here&apos;s a snapshot of your portfolio and recent blockchain
          activity.
        </p>
      </div>

      {/* Balances */}
      <BalancesWidget />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
}
