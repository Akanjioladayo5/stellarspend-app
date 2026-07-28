'use client'

import { useState, useEffect, useCallback } from "react";
import BalancesWidget from "@/components/dashboard/BalancesWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import GoalForm from "@/components/savings/GoalForm";
import { ContributionWidget } from "@/components/savings/ContributionWidget";
import {
  loadGoals,
  saveGoals,
  loadContributions,
  addContribution,
  checkAndExecuteDueContributions,
} from "@/lib/savings/scheduler";
import { calculateRoundUp } from "@/lib/savings/roundUp";
import type {
  Goal,
  GoalSchedule,
  GoalFormData,
  RoundUpRule,
  Contribution,
} from "@/lib/types/savings";
import { MOCK_TRANSACTIONS } from "@/lib/api/client";

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window === 'undefined') {
      return [
        {
          id: '1',
          name: 'New Laptop',
          targetAmount: 1200,
          currentAmount: 300,
          deadline: '2024-12-31',
          recurrence: 'once' as const,
          createdAt: new Date(),
        },
      ];
    }
    const savedGoals = loadGoals();
    return savedGoals.length > 0
      ? savedGoals
      : [
          {
            id: '1',
            name: 'New Laptop',
            targetAmount: 1200,
            currentAmount: 300,
            deadline: '2024-12-31',
            recurrence: 'once' as const,
            createdAt: new Date(),
          },
        ];
  });
  const [contributions, setContributions] = useState<Contribution[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadContributions();
  });
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const availableBalance = 500;

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const processRoundUps = useCallback(() => {
    const goalsWithRoundUp = goals.filter(
      (g) => g.roundUpRule?.enabled && !g.roundUpRule.paused,
    );
    if (goalsWithRoundUp.length === 0) return;

    MOCK_TRANSACTIONS.forEach((tx) => {
      if (!tx.successful) return;
      const paymentOp = tx.operations.find(
        (op) => op.type === 'payment' && op.amount,
      );
      if (!paymentOp?.amount) return;

      const txAmount = parseFloat(paymentOp.amount);

      goalsWithRoundUp.forEach((goal) => {
        if (goal.currentAmount >= goal.targetAmount) return;

        const roundUpAmount = calculateRoundUp(
          txAmount,
          goal.roundUpRule!.nearestUnit,
        );
        if (roundUpAmount <= 0) return;

        const alreadyProcessed = contributions.some(
          (c) =>
            c.goalId === goal.id &&
            c.transactionHash === tx.hash &&
            c.source === 'round-up',
        );
        if (alreadyProcessed) return;

        const newContribution: Contribution = {
          id: Math.random().toString(36).substring(2, 11),
          goalId: goal.id,
          amount: roundUpAmount,
          source: 'round-up',
          transactionHash: tx.hash,
          createdAt: new Date(),
        };

        addContribution(newContribution);
        setContributions((prev) => [...prev, newContribution]);
        setGoals((prev) =>
          prev.map((g) =>
            g.id === goal.id
              ? { ...g, currentAmount: g.currentAmount + roundUpAmount }
              : g,
          ),
        );
      });
    });
  }, [goals, contributions]);

  useEffect(() => {
    processRoundUps();
    const interval = setInterval(() => {
      processRoundUps();
    }, 30000);
    return () => clearInterval(interval);
  }, [processRoundUps]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { updatedGoals, executedContributions } =
        checkAndExecuteDueContributions(goals, availableBalance);
      if (executedContributions.length > 0) {
        setGoals(updatedGoals);
        setContributions((prev) => [...prev, ...executedContributions]);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [goals, availableBalance]);

  const handleGoalCreated = (goalData: GoalFormData & { schedule?: GoalSchedule }) => {
    const newGoal: Goal = {
      id: Math.random().toString(36).substring(2, 11),
      name: goalData.title,
      targetAmount: goalData.targetAmount,
      currentAmount: 0,
      deadline: goalData.deadline,
      recurrence: goalData.recurrence,
      createdAt: new Date(),
      schedule: goalData.schedule,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleContribute = (goalId: string, amount: number) => {
    const newContribution: Contribution = {
      id: Math.random().toString(36).substring(2, 11),
      goalId,
      amount,
      source: 'manual',
      createdAt: new Date(),
    };
    addContribution(newContribution);
    setContributions((prev) => [...prev, newContribution]);
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, currentAmount: goal.currentAmount + amount }
          : goal,
      ),
    );
  };

  const handleUpdateSchedule = (goalId: string, schedule: GoalSchedule | undefined) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, schedule } : goal,
      ),
    );
  };

  const handleUpdateRoundUpRule = (goalId: string, rule: RoundUpRule) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, roundUpRule: rule } : goal,
      ),
    );
  };

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
          Here&apos;s a snapshot of your portfolio and recent blockchain activity.
        </p>
      </div>

      {/* Balances */}
      <BalancesWidget />

      {/* Quick Actions */}
      <QuickActions />

      {/* Savings Goals */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Savings Goals</h2>
          <button
            onClick={() => setGoalModalOpen(true)}
            className="px-4 py-2 bg-[#e8b84b] text-black rounded-lg hover:bg-[#e8b84b]/90 transition-colors"
          >
            Create Goal
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-[#7a8aaa]">
            No savings goals yet. Create your first goal to start saving!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <ContributionWidget
                key={goal.id}
                goal={goal}
                contributions={contributions}
                onContribute={handleContribute}
                availableBalance={availableBalance}
                onUpdateSchedule={handleUpdateSchedule}
                onUpdateRoundUpRule={handleUpdateRoundUpRule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />

      <GoalForm
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
}
