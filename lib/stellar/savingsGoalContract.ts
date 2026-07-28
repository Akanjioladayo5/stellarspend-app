import { callContractView, submitContractTx, triggerNotification } from './budgetContract';

const SAVINGS_CONTRACT_ID = process.env.NEXT_PUBLIC_SAVINGS_CONTRACT_ID || '';
const LOCAL_GOALS_KEY = 'stellarspend_local_goals';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  recurrence: 'once' | 'monthly' | 'yearly';
  createdAt: Date;
}

export function getMockGoalsFallback(): Goal[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_GOALS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((g: Goal) => ({
        ...g,
        createdAt: new Date(g.createdAt),
      }));
    } catch (e) {
      console.error('Failed to parse mock goals', e);
    }
  }
  // Default mock savings goal
  return [
    {
      id: '1',
      name: 'New Laptop',
      targetAmount: 1200,
      currentAmount: 300,
      deadline: '2024-12-31',
      recurrence: 'once',
      createdAt: new Date(),
    },
  ];
}

export function setMockGoalsFallback(goals: Goal[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify(goals));
  }
}

export async function fetchGoals(publicKey: string): Promise<Goal[]> {
  if (!SAVINGS_CONTRACT_ID) {
    return getMockGoalsFallback();
  }
  try {
    const raw = await callContractView<Array<{
      id: string;
      name: string;
      target_amount: string | number;
      current_amount: string | number;
      deadline: string;
      recurrence: string;
      created_at: string | number;
    }>>(publicKey, SAVINGS_CONTRACT_ID, 'get_goals', [publicKey]);

    return raw.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount || 0),
      deadline: g.deadline,
      recurrence: (g.recurrence as 'once' | 'monthly' | 'yearly') || 'once',
      createdAt: new Date(g.created_at),
    }));
  } catch (e) {
    console.error('Failed to fetch goals on-chain. Falling back to local storage.', e);
    return getMockGoalsFallback();
  }
}

export async function createGoal(
  publicKey: string,
  goalData: { title: string; targetAmount: number; deadline: string; recurrence: 'once' | 'monthly' | 'yearly' },
  statusCallback?: (status: string) => void
): Promise<Goal> {
  const newId = `goal_${Date.now()}`;
  if (!SAVINGS_CONTRACT_ID) {
    const mockGoals = getMockGoalsFallback();
    const newGoal: Goal = {
      id: newId,
      name: goalData.title,
      targetAmount: goalData.targetAmount,
      currentAmount: 0,
      deadline: goalData.deadline,
      recurrence: goalData.recurrence,
      createdAt: new Date(),
    };
    mockGoals.push(newGoal);
    setMockGoalsFallback(mockGoals);
    return newGoal;
  }
  try {
    const result = await submitContractTx(
      publicKey,
      SAVINGS_CONTRACT_ID,
      'create_goal',
      [
        publicKey,
        newId,
        goalData.title,
        goalData.targetAmount,
        goalData.deadline,
        goalData.recurrence,
      ],
      statusCallback
    );

    const newGoal: Goal = {
      id: result || newId,
      name: goalData.title,
      targetAmount: goalData.targetAmount,
      currentAmount: 0,
      deadline: goalData.deadline,
      recurrence: goalData.recurrence,
      createdAt: new Date(),
    };
    return newGoal;
  } catch (e: unknown) {
    const errMessage = e instanceof Error ? e.message : String(e);
    triggerNotification('error', `Failed to create goal: ${errMessage}`);
    throw e;
  }
}

export async function contributeToGoal(
  publicKey: string,
  goalId: string,
  amount: number,
  statusCallback?: (status: string) => void
): Promise<void> {
  if (!SAVINGS_CONTRACT_ID) {
    const mockGoals = getMockGoalsFallback();
    const index = mockGoals.findIndex((g) => g.id === goalId);
    if (index !== -1) {
      mockGoals[index].currentAmount += amount;
      setMockGoalsFallback(mockGoals);
    }
    return;
  }
  try {
    await submitContractTx(
      publicKey,
      SAVINGS_CONTRACT_ID,
      'contribute_to_goal',
      [publicKey, goalId, amount],
      statusCallback
    );

    const mockGoals = getMockGoalsFallback();
    const index = mockGoals.findIndex((g) => g.id === goalId);
    if (index !== -1) {
      mockGoals[index].currentAmount += amount;
      setMockGoalsFallback(mockGoals);
    }
  } catch (e: unknown) {
    const errMessage = e instanceof Error ? e.message : String(e);
    triggerNotification('error', `Failed to contribute to goal: ${errMessage}`);
    throw e;
  }
}
