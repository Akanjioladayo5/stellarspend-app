import { describe, expect, test, jest, beforeEach } from '@jest/globals';

jest.mock('@noir-lang/noir_js', () => ({
  Noir: jest.fn(),
}));

jest.mock('@aztec/bb.js', () => ({
  UltraHonkBackend: jest.fn(),
}));

const { Noir } = jest.requireMock('@noir-lang/noir_js') as { Noir: jest.Mock };
const { UltraHonkBackend } = jest.requireMock('@aztec/bb.js') as { UltraHonkBackend: jest.Mock };

import { generateSpendingProof } from '../generateSpendingProof';
import { initZkToolchain } from './wasmLoader';

const SAMPLE_PROOF = new Uint8Array(Array.from({ length: 64 }, (_, i) => i));

beforeEach(() => {
  jest.clearAllMocks();
  (initZkToolchain as jest.Mock).mockResolvedValue(true);

  (Noir as jest.Mock).mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  }));

  (UltraHonkBackend as jest.Mock).mockImplementation(() => ({
    generateProof: jest.fn().mockResolvedValue({
      proof: SAMPLE_PROOF,
      publicInputs: [],
    }),
    verifyProof: jest.fn().mockResolvedValue(true),
  }));
});

describe('generateSpendingProof', () => {
  test('throws immediately when payment exceeds limit', async () => {
    await expect(generateSpendingProof(150, 100)).rejects.toThrow(
      /Constraint Validation Failed.*150.*100/
    );
  });

  test('does not reach prover when constraint fails', async () => {
    await expect(generateSpendingProof(200, 100)).rejects.toThrow();
    expect(Noir).not.toHaveBeenCalled();
    expect(UltraHonkBackend).not.toHaveBeenCalled();
  });

  test('returns deterministic proof for valid inputs', async () => {
    const result = await generateSpendingProof(50, 100);

    expect(result).toHaveProperty('proof');
    expect(result).toHaveProperty('publicInputs');
    expect(result.proof).toBeInstanceOf(Uint8Array);
    expect(result.proof.length).toBe(64);
    expect(result.publicInputs).toHaveLength(1);
    expect(result.publicInputs[0]).toBeInstanceOf(Uint8Array);
    expect(result.publicInputs[0].length).toBe(32);
  });

  test('returns the same proof bytes for identical inputs', async () => {
    const first = await generateSpendingProof(50, 100);
    const second = await generateSpendingProof(50, 100);

    expect(first.proof).toEqual(second.proof);
  });

  test('invokes wasmLoader before proving', async () => {
    await generateSpendingProof(50, 100);
    expect(initZkToolchain).toHaveBeenCalledTimes(1);
  });

  test('reports status via callback', async () => {
    const cb = jest.fn();
    await generateSpendingProof(50, 100, cb);

    expect(cb).toHaveBeenCalledWith(expect.stringContaining('Initializing'));
    expect(cb).toHaveBeenCalledWith(expect.stringContaining('Verifying'));
  });

  test('throws when wasmLoader fails', async () => {
    (initZkToolchain as jest.Mock).mockResolvedValue(false);

    await expect(generateSpendingProof(50, 100)).rejects.toThrow(
      /WASM modules could not be loaded/
    );
  });

  test('throws when local verification fails', async () => {
    (UltraHonkBackend as jest.Mock).mockImplementation(() => ({
      generateProof: jest.fn().mockResolvedValue({
        proof: SAMPLE_PROOF,
        publicInputs: [],
      }),
      verifyProof: jest.fn().mockResolvedValue(false),
    }));

    await expect(generateSpendingProof(50, 100)).rejects.toThrow(
      /Local verification.*failed/
    );
  });
});
