import {
  Contract,
  TransactionBuilder,
  Account,
  scValToNative,
  nativeToScVal,
  Address,
  rpc as SorobanRpc,
} from '@stellar/stellar-sdk';

import { getSorobanServer, getNetworkPassphrase } from '../api/stellar/client';
import type { GoalSchedule, RoundUpRule, Contribution } from '@/lib/types/savings';

const SAVINGS_CONTRACT_ID =
  process.env.NEXT_PUBLIC_SAVINGS_CONTRACT_ID ?? '';

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
