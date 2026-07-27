/**
 * lib/api/stellar/client.ts
 *
 * Thin, shared Soroban RPC client config used by any Soroban contract
 * wrapper in this app (e.g. analyticsContract.ts). Keeps the RPC URL and
 * network passphrase in one place instead of each contract file reading
 * env vars directly.
 */

import { rpc as SorobanRpc } from '@stellar/stellar-sdk';

// ASSUMPTION: env var names. If this repo already defines Soroban RPC config
// under different names (check .env.local / next.config.ts), rename these
// to match rather than adding a second, conflicting set of env vars.
const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
  'Test SDF Network ; September 2015'; // Testnet default

let server: SorobanRpc.Server | null = null;

/** Singleton Soroban RPC server instance. */
export function getSorobanServer(): SorobanRpc.Server {
  if (!server) {
    server = new SorobanRpc.Server(SOROBAN_RPC_URL);
  }
  return server;
}

export function getNetworkPassphrase(): string {
  return NETWORK_PASSPHRASE;
}