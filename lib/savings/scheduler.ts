import { Goal, GoalSchedule, Contribution } from '@/lib/types/savings';

const STORAGE_KEY = 'stellarspend_goals';
const CONTRIBUTIONS_KEY = 'stellarspend_contributions';

export function loadGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Goal[];
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function loadContributions(): Contribution[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONTRIBUTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Contribution[];
  } catch {
    return [];
  }
}

export function saveContributions(contributions: Contribution[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
}

export function addContribution(contribution: Contribution): void {
  const existing = loadContributions();
  existing.push(contribution);
  saveContributions(existing);
}

export function createSchedule(
  recurrence: 'monthly' | 'yearly',
  amount: number,
): GoalSchedule {
  const now = new Date();
  let nextDueDate: Date;

  if (recurrence === 'monthly') {
    nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else {
    nextDueDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  }

  return {
    nextDueDate: nextDueDate.toISOString(),
    amount,
    paused: false,
  };
}

export function getNextDueDate(schedule: GoalSchedule): Date {
  return new Date(schedule.nextDueDate);
}

export function advanceSchedule(schedule: GoalSchedule): GoalSchedule {
  const current = new Date(schedule.nextDueDate);
  let nextDueDate: Date;

  if (schedule.nextDueDate.slice(8, 10) === '31') {
    nextDueDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  } else {
    nextDueDate = new Date(
      current.getFullYear(),
      current.getMonth() + 1,
      current.getDate(),
    );
  }

  return {
    ...schedule,
    nextDueDate: nextDueDate.toISOString(),
    lastExecutedAt: new Date().toISOString(),
  };
}

export function checkAndExecuteDueContributions(
  goals: Goal[],
  availableBalance: number,
): {
  updatedGoals: Goal[];
  executedContributions: Contribution[];
} {
  const now = new Date();
  const updatedGoals: Goal[] = [];
  const executedContributions: Contribution[] = [];

  for (const goal of goals) {
    if (!goal.schedule || goal.schedule.paused) {
      updatedGoals.push(goal);
      continue;
    }

    const nextDue = getNextDueDate(goal.schedule);
    if (nextDue > now || goal.currentAmount >= goal.targetAmount) {
      updatedGoals.push(goal);
      continue;
    }

    if (goal.schedule.amount > availableBalance) {
      updatedGoals.push(goal);
      continue;
    }

    const contribution: Contribution = {
      id: Math.random().toString(36).substring(2, 11),
      goalId: goal.id,
      amount: goal.schedule.amount,
      source: 'scheduled',
      createdAt: new Date(),
    };

    const updatedGoal: Goal = {
      ...goal,
      currentAmount: goal.currentAmount + goal.schedule.amount,
      schedule: advanceSchedule(goal.schedule),
    };

    updatedGoals.push(updatedGoal);
    executedContributions.push(contribution);
    addContribution(contribution);
    availableBalance -= goal.schedule.amount;
  }

  return { updatedGoals, executedContributions };
}
