import {
  Contract,
  TransactionBuilder,
  Account,
  scValToNative,
  nativeToScVal,
  Address,
  rpc as SorobanRpc,
} from '@stellar/stellar-sdk';

import { getSorobanServer, getNetworkPassphrase } from '@/lib/api/stellar/client';
import type { Goal, GoalSchedule, RoundUpRule, Contribution } from '@/lib/types/savings';
export type { Goal, GoalSchedule, RoundUpRule, Contribution };
import { callContractView, submitContractTx, triggerNotification } from './budgetContract';

const SAVINGS_CONTRACT_ID = process.env.NEXT_PUBLIC_SAVINGS_CONTRACT_ID ?? '';
const LOCAL_GOALS_KEY = 'stellarspend_local_goals';

async function callSavingsContract<T>(
  method: string,
  args: unknown[],
  sourcePublicKey: string,
): Promise<T> {
  if (!SAVINGS_CONTRACT_ID) {
    throw new Error(
      'NEXT_PUBLIC_SAVINGS_CONTRACT_ID is not configured. Set it to the ' +
      'deployed savings goal contract address.',
    );
  }

  const server = getSorobanServer();
  const networkPassphrase = getNetworkPassphrase();
  const contract = new Contract(SAVINGS_CONTRACT_ID);

  const sourceAccountResp = await server.getAccount(sourcePublicKey);
  const sourceAccount = new Account(
    sourcePublicKey,
    sourceAccountResp.sequenceNumber(),
  );

  const scArgs = args.map((arg) => toScVal(arg));

  const tx = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...scArgs))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Savings contract call "${method}" failed: ${sim.error}`);
  }

  if (!sim.result?.retval) {
    throw new Error(`Savings contract call "${method}" returned no value.`);
  }

  return scValToNative(sim.result.retval) as T;
}

function toScVal(value: unknown) {
  if (
    typeof value === 'string' &&
    value.startsWith('G') &&
    value.length === 56
  ) {
    return new Address(value).toScVal();
  }
  if (typeof value === 'number') {
    return nativeToScVal(value, { type: 'u64' });
  }
  if (typeof value === 'boolean') {
    return nativeToScVal(value ? 1 : 0, { type: 'u32' });
  }
  return nativeToScVal(value);
}

export async function createGoalOnChain(
  goalId: string,
  ownerPublicKey: string,
  targetAmount: number,
  deadline: string,
  recurrence: string,
): Promise<string> {
  const result = await callSavingsContract<string>(
    'create_goal',
    [goalId, ownerPublicKey, targetAmount, deadline, recurrence],
    ownerPublicKey,
  );
  return result;
}

export async function contributeToGoalOnChain(
  goalId: string,
  amount: number,
  source: string,
  accountPublicKey: string,
): Promise<string> {
  const result = await callSavingsContract<string>(
    'contribute',
    [goalId, amount, source],
    accountPublicKey,
  );
  return result;
}

export async function getGoalScheduleOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<GoalSchedule> {
  const result = await callSavingsContract<GoalSchedule>(
    'get_schedule',
    [goalId],
    accountPublicKey,
  );
  return result;
}

export async function setRoundUpRuleOnChain(
  goalId: string,
  enabled: boolean,
  nearestUnit: number,
  accountPublicKey: string,
): Promise<void> {
  await callSavingsContract(
    'set_round_up_rule',
    [goalId, enabled, nearestUnit],
    accountPublicKey,
  );
}

export async function getRoundUpRuleOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<RoundUpRule> {
  const result = await callSavingsContract<RoundUpRule>(
    'get_round_up_rule',
    [goalId],
    accountPublicKey,
  );
  return result;
}

export async function applyRoundUpOnChain(
  goalId: string,
  transactionHash: string,
  roundUpAmount: number,
  accountPublicKey: string,
): Promise<void> {
  await callSavingsContract(
    'apply_round_up',
    [goalId, transactionHash, roundUpAmount],
    accountPublicKey,
  );
}

export async function pauseScheduleOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<void> {
  await callSavingsContract(
    'pause_schedule',
    [goalId],
    accountPublicKey,
  );
}

export async function resumeScheduleOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<void> {
  await callSavingsContract(
    'resume_schedule',
    [goalId],
    accountPublicKey,
  );
}

export async function cancelScheduleOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<void> {
  await callSavingsContract(
    'cancel_schedule',
    [goalId],
    accountPublicKey,
  );
}

export async function getContributionHistoryOnChain(
  goalId: string,
  accountPublicKey: string,
): Promise<Contribution[]> {
  const result = await callSavingsContract<Contribution[]>(
    'get_contribution_history',
    [goalId],
    accountPublicKey,
  );
  return result;
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
