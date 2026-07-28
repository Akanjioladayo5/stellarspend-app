export function calculateRoundUp(amount: number, nearestUnit: number): number {
  if (nearestUnit <= 0 || amount <= 0) return 0;
  const rounded = Math.ceil(amount / nearestUnit) * nearestUnit;
  return Math.round((rounded - amount) * 100) / 100;
}

export function calculateRoundUpContribution(
  transactionAmount: number,
  nearestUnit: number,
): { roundUpAmount: number; roundedTotal: number } | null {
  const roundUpAmount = calculateRoundUp(transactionAmount, nearestUnit);
  if (roundUpAmount <= 0) return null;
  return {
    roundUpAmount,
    roundedTotal: transactionAmount + roundUpAmount,
  };
}
