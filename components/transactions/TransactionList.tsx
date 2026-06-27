"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  fetchTransactions,
  Transaction,
  FilterParams,
  PaginatedResponse,
} from "@/lib/api/client";
import TransactionItem from "./TransactionItem";
import { ChevronRight, Search } from "lucide-react";

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
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const activeFilters = useMemo<FilterParams>(() => ({
    ...filters,
    search: debouncedSearch || undefined,
  }), [filters, debouncedSearch]);

  // Reset pagination when filters change
  useEffect(() => {
    setTransactions([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [activeFilters]);

  // Load transactions
  const loadTransactions = useCallback(
    async (pageNum: number, isNewSearch: boolean = false) => {
      try {
        if (!isNewSearch) {
          setIsLoadingMore(true);
        }
        const response: PaginatedResponse<Transaction> =
          await fetchTransactions(activeFilters, pageNum, 10);

        if (isNewSearch) {
          setTransactions(response.data);
        } else {
          setTransactions((prev) => [...prev, ...response.data]);
        }

        setTotal(response.total);
        setHasMore(response.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilters],
  );

  // Initial load
  useEffect(() => {
    loadTransactions(1, true);
  }, [activeFilters, loadTransactions]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !loading
        ) {
          loadTransactions(page + 1);
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, isLoadingMore, loading, page, loadTransactions]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !loading) {
      loadTransactions(page + 1);
    }
  };

  const searchInput = (
    <div className="mb-6">
      <label
        htmlFor="transaction-search"
        className="text-[10px] font-black text-[#7a8aaa] uppercase tracking-[0.3em]"
      >
        Search transactions
      </label>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-inner shadow-black/20">
        <Search className="w-4 h-4 text-[#7a8aaa]" />
        <input
          id="transaction-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search description, amount, or date"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#7a8aaa]/70"
        />
      </div>
    </div>
  );

  if (loading && transactions.length === 0) {
    return (
      <div>
        {searchInput}
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
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div>
        {searchInput}
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-1 h-12 bg-linear-to-b from-[#e8b84b]/20 to-transparent mb-6" />
          <p className="text-[#7a8aaa] text-[10px] font-bold uppercase tracking-[0.3em]">
            No results found
          </p>
          <p className="text-[#7a8aaa]/60 text-xs mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {searchInput}
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
              {transactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onOpenDrawer={onOpenDrawer}
                />
              ))}

              {/* Skeleton loaders for infinite scroll */}
              {isLoadingMore &&
                Array.from({ length: 3 }).map((_, i) => (
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
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="py-8" />

      {/* Load more button or "all loaded" message */}
      {hasMore && !isLoadingMore && (
        <div className="text-center py-12 flex flex-col items-center">
          <button
            onClick={handleLoadMore}
            className="text-[#e8b84b] font-black text-xs uppercase tracking-[0.15em] hover:text-white transition-colors flex items-center gap-2 group"
          >
            Load more transactions
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {!hasMore && transactions.length > 0 && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-1 h-12 bg-linear-to-b from-[#e8b84b]/20 to-transparent mb-6" />
          <p className="text-[#7a8aaa] text-[10px] font-bold uppercase tracking-[0.3em]">
            All transactions loaded
          </p>
          <p className="text-[#7a8aaa]/60 text-xs mt-2">
            Total: {total} transaction{total !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
