/**
 * lib/zk/wasmLoader.ts
 *
 * Handles client-side initialization of Noir ACVM and ABI compiler WASM modules.
 * Implements a thread-safe singleton cache and returns initialization state.
 */

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes the Noir ZK WASM modules (acvm_js and noirc_abi) in the browser context.
 * Implements caching to ensure initialization is only performed once.
 * Returns true if the initialization succeeded, false if running in SSR context.
 * Throws if WASM modules fail to load in a browser environment.
 */
export async function initZkToolchain(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    // Dynamic imports to prevent server-side Node.js compilation crashes
    const initACVM = (await import('@noir-lang/acvm_js')).default;
    const initNoirC = (await import('@noir-lang/noirc_abi')).default;

    const acvmWasmUrl = new URL('@noir-lang/acvm_js/web/acvm_js_bg.wasm', import.meta.url).toString();
    const noircWasmUrl = new URL('@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm', import.meta.url).toString();

    try {
      await Promise.all([
        initACVM(fetch(acvmWasmUrl)),
        initNoirC(fetch(noircWasmUrl))
      ]);
    } catch {
      // Fallback for bundler setups where static assets are not served at the expected import.meta.url path
      try {
        await Promise.all([
          initACVM(fetch('/_next/static/wasm/acvm_js_bg.wasm')),
          initNoirC(fetch('/_next/static/wasm/noirc_abi_wasm_bg.wasm'))
        ]);
      } catch {
        throw new Error(
          'Failed to initialize ZK WASM modules. The Barretenberg proving engine cannot start.'
        );
      }
    }

    isInitialized = true;
    return true;
  })();

  return initPromise;
}
