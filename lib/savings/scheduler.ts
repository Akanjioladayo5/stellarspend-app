import { Goal, GoalSchedule, Contribution } from '@/lib/types/savings';

const STORAGE_KEY = 'stellarspend_goals';
const CONTRIBUTIONS_KEY = 'stellarspend_contributions';

/**
 * Loads all goals from localStorage.
 * @returns {Goal[]} Array of goals, or empty array if none exist or on server.
 */
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

/**
 * Saves goals to localStorage.
 * @param {Goal[]} goals - Array of goals to persist.
 */
export function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

/**
 * Loads all contributions from localStorage.
 * @returns {Contribution[]} Array of contributions, or empty array if none exist or on server.
 */
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

/**
 * Saves contributions to localStorage.
 * @param {Contribution[]} contributions - Array of contributions to persist.
 */
export function saveContributions(contributions: Contribution[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
}

/**
 * Adds a contribution and persists it.
 * @param {Contribution} contribution - Contribution to add.
 */
export function addContribution(contribution: Contribution): void {
  const existing = loadContributions();
  existing.push(contribution);
  saveContributions(existing);
}

/**
 * Creates a new goal schedule.
 * @param {'monthly' | 'yearly'} recurrence - How often the contribution recurs.
 * @param {number} amount - Contribution amount per period.
 * @returns {GoalSchedule} The created schedule.
 */
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

/**
 * Returns the next due date for a schedule.
 * @param {GoalSchedule} schedule - The schedule to inspect.
 * @returns {Date} The next due date.
 */
export function getNextDueDate(schedule: GoalSchedule): Date {
  return new Date(schedule.nextDueDate);
}

/**
 * Advances a schedule to the next period.
 * @param {GoalSchedule} schedule - The current schedule.
 * @returns {GoalSchedule} The advanced schedule.
 */
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

/**
 * Checks goals for due contributions and executes them if funds are available.
 * @param {Goal[]} goals - Goals to evaluate.
 * @param {number} availableBalance - Currently available balance.
 * @returns {{ updatedGoals: Goal[]; executedContributions: Contribution[] }} Updated goals and contributions executed in this run.
 */
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
