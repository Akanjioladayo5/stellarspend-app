"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  fetchTransactions,
  Transaction,
  FilterParams,
  PaginatedResponse,
} from "@/lib/api/client";
import TransactionItem from "./TransactionItem";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface TransactionListProps {
  filters: FilterParams;
  onOpenDrawer: (tx: Transaction) => void;
}

export default function TransactionList({
  filters,
  onOpenDrawer,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const prevFiltersRef = useRef(filters);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadTransactions = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Transaction> = await fetchTransactions(
        filters,
        pageNum,
        PAGE_SIZE,
      );

      setTransactions(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const filtersChanged = prevFiltersRef.current !== filters;
    prevFiltersRef.current = filters;

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    loadTransactions(page);
  }, [filters, page, loadTransactions]);

  const handlePrevious = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNext = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white/[0.01] backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl shadow-black/50">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Operation
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Context
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Impact
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Timeframe
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em] text-right">
                  Review
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.05]" />
                      <div className="space-y-2">
                        <div className="w-24 h-4 bg-white/[0.05] rounded" />
                        <div className="w-20 h-3 bg-white/[0.03] rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-white/[0.05] rounded" />
                      <div className="w-48 h-3 bg-white/[0.03] rounded" />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-20 h-4 bg-white/[0.05] rounded" />
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-white/[0.05] rounded" />
                      <div className="w-16 h-3 bg-white/[0.03] rounded" />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-10 h-10 bg-white/[0.05] rounded-xl ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!loading && transactions.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center">
        <div className="w-1 h-12 bg-linear-to-b from-[#e8b84b]/20 to-transparent mb-6" />
        <p className="text-[#7a8aaa] text-[10px] font-bold uppercase tracking-[0.3em]">
          No transactions found
        </p>
        <p className="text-[#7a8aaa]/60 text-xs mt-2">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/[0.01] backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl shadow-black/50">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Operation
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Context
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Impact
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em]">
                  Timeframe
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.2em] text-right">
                  Review
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.05]" />
                          <div className="space-y-2">
                            <div className="w-24 h-4 bg-white/[0.05] rounded" />
                            <div className="w-20 h-3 bg-white/[0.03] rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-white/[0.05] rounded" />
                          <div className="w-48 h-3 bg-white/[0.03] rounded" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-20 h-4 bg-white/[0.05] rounded" />
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className="w-16 h-4 bg-white/[0.05] rounded" />
                          <div className="w-16 h-3 bg-white/[0.03] rounded" />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-10 h-10 bg-white/[0.05] rounded-xl ml-auto" />
                      </td>
                    </tr>
                  ))
                : transactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onOpenDrawer={onOpenDrawer}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-8">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={page === 1 || loading}
          className="text-[#e8b84b] font-black text-xs uppercase tracking-[0.15em] hover:text-white transition-colors flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#e8b84b]"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          Previous
        </button>

        <p className="text-[#7a8aaa] text-[10px] font-bold uppercase tracking-[0.3em]">
          Page {page} of {totalPages}
        </p>

        <button
          type="button"
          onClick={handleNext}
          disabled={page >= totalPages || loading}
          className="text-[#e8b84b] font-black text-xs uppercase tracking-[0.15em] hover:text-white transition-colors flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#e8b84b]"
        >
          Next
          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </>
  );
}
